/**
 * Bug Detective QA CLI.
 *
 *   npm run qa -- --ticket <1-4> --workspace <path> [--lang en|pt] [--json out.json] [--timeout 180] [--keep]
 *                 [--package <dir>] [--deps-cache <dir>] [--deps-only]
 *
 * Copies the player's workspace to a temporary directory, runs Gate 1 (the stage's project
 * tests) and Gate 2 (hidden Playwright validation of the ticket) against isolated processes,
 * and prints a predefined message. The player's workspace, database and processes are never touched.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import type { ChildProcess } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { messages } from './messages.ts';
import type { Language, Messages } from './messages.ts';
import type { TestRecord } from './support/progress.ts';

const QA_DIR = import.meta.dirname;
const DEFAULT_TIMEOUT_SECONDS = 180;
const EXCLUDED_NAMES = new Set(['node_modules', '.git', 'dist', 'test-results', 'playwright-report']);
const DATABASE_FILE = /\.db(-journal|-wal|-shm)?$/;
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const OUTPUT_TAIL_LINES = 40;
// Directories that hold installed dependencies in an npm workspaces project.
const DEPENDENCY_DIRS = ['node_modules', 'client/node_modules', 'server/node_modules'];

type Gate = 1 | 2;
type Status = 'passed' | 'failed' | 'timeout';

interface Options {
  ticket: number;
  workspace: string;
  language: Language;
  jsonPath?: string;
  timeoutSeconds: number;
  keep: boolean;
  verbose: boolean;
  /** Stage package directory (gate1/, gate2/). Defaults to stages/stage-N in this folder. */
  packageDir: string;
  /** Directory of installed dependencies, keyed by lockfile, reused instead of `npm ci`. */
  depsCache?: string;
  /** Only install dependencies into the cache, then exit. */
  depsOnly: boolean;
}

interface QaResult {
  ticket: number;
  gate: Gate;
  status: Status;
  message: string;
  tests: TestRecord[];
  durationMs: number;
}

class DeadlineError extends Error {}

class StepError extends Error {
  record: TestRecord;

  constructor(record: TestRecord) {
    super(record.error);
    this.record = record;
  }
}

// ---------------------------------------------------------------------------
// Options

function parseOptions(): Options {
  const { values } = parseArgs({
    options: {
      ticket: { type: 'string' },
      workspace: { type: 'string' },
      lang: { type: 'string', default: 'en' },
      json: { type: 'string' },
      timeout: { type: 'string', default: String(DEFAULT_TIMEOUT_SECONDS) },
      keep: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      package: { type: 'string' },
      'deps-cache': { type: 'string' },
      'deps-only': { type: 'boolean', default: false },
    },
  });

  const language = values.lang === 'pt' ? 'pt' : values.lang === 'en' ? 'en' : undefined;
  const ticket = Number(values.ticket);
  const timeoutSeconds = Number(values.timeout);
  const valid =
    language &&
    Number.isInteger(ticket) &&
    ticket >= 1 &&
    ticket <= 4 &&
    values.workspace &&
    Number.isFinite(timeoutSeconds) &&
    timeoutSeconds > 0;

  if (!valid) {
    console.error(messages[language ?? 'en'].usage);
    process.exit(2);
  }

  const workspace = resolve(process.env.INIT_CWD ?? process.cwd(), values.workspace!);
  if (!existsSync(join(workspace, 'package.json'))) {
    console.error(`Workspace not found or has no package.json: ${workspace}`);
    process.exit(2);
  }

  const cwd = process.env.INIT_CWD ?? process.cwd();
  const packageDir = values.package ? resolve(cwd, values.package) : join(QA_DIR, 'stages', `stage-${ticket}`);
  if (!values['deps-only'] && !existsSync(join(packageDir, 'gate1')) && !existsSync(join(packageDir, 'gate2'))) {
    console.error(`Stage package not found or has no gate1/ and gate2/: ${packageDir}`);
    process.exit(2);
  }
  if (values['deps-only'] && !values['deps-cache']) {
    console.error('--deps-only requires --deps-cache <dir>.');
    process.exit(2);
  }

  return {
    ticket,
    workspace,
    packageDir,
    depsCache: values['deps-cache'] && resolve(cwd, values['deps-cache']),
    depsOnly: values['deps-only']!,
    language: language!,
    jsonPath: values.json && resolve(process.env.INIT_CWD ?? process.cwd(), values.json),
    timeoutSeconds,
    keep: values.keep!,
    verbose: values.verbose!,
  };
}

// ---------------------------------------------------------------------------
// Processes

const running = new Set<ChildProcess>();

function killTree(child: ChildProcess, signal: NodeJS.Signals = 'SIGKILL'): void {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    running.delete(child);
    return;
  }
  const exited = new Promise<void>((done) => child.once('exit', () => done()));
  killTree(child, 'SIGTERM');
  const timer = setTimeout(() => killTree(child, 'SIGKILL'), 3000);
  await exited;
  clearTimeout(timer);
  running.delete(child);
}

function killAll(): void {
  for (const child of running) {
    killTree(child);
  }
}

interface ProcessOptions {
  cwd: string;
  env?: Record<string, string>;
  logFile: string;
  signal: AbortSignal;
  verbose: boolean;
}

/** Inherited environment without the app's own settings, so nothing leaks from the caller's shell. */
function baseEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' };
  for (const name of ['PORT', 'CLIENT_PORT', 'API_URL', 'DATABASE_PATH', 'NODE_OPTIONS']) {
    delete env[name];
  }
  for (const name of Object.keys(env)) {
    if (name.startsWith('npm_') || name === 'INIT_CWD') {
      delete env[name];
    }
  }
  return env;
}

function launch(command: string, args: string[], options: ProcessOptions) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...baseEnv(), ...options.env },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  running.add(child);

  const log = createWriteStream(options.logFile, { flags: 'a' });
  log.write(`$ ${command} ${args.join(' ')}\n`);
  let output = '';
  const collect = (chunk: Buffer) => {
    const text = chunk.toString();
    output = (output + text).slice(-200_000);
    log.write(text);
    if (options.verbose) {
      process.stdout.write(text);
    }
  };
  child.stdout!.on('data', collect);
  child.stderr!.on('data', collect);

  const exited = new Promise<number>((done) => {
    child.on('error', (error) => {
      collect(Buffer.from(`${error.message}\n`));
      done(-1);
    });
    child.on('close', (code) => {
      running.delete(child);
      log.end();
      done(code ?? -1);
    });
  });

  return { child, exited, output: () => output };
}

/** Runs a command to completion. Rejects with DeadlineError if the run times out first. */
async function exec(command: string, args: string[], options: ProcessOptions) {
  options.signal.throwIfAborted();
  const proc = launch(command, args, options);
  const onAbort = () => killTree(proc.child);
  options.signal.addEventListener('abort', onAbort, { once: true });
  const code = await proc.exited;
  options.signal.removeEventListener('abort', onAbort);
  options.signal.throwIfAborted();
  return { code, output: proc.output() };
}

/** Starts a long-running process and waits until `readyUrls` all answer with 2xx. */
async function startService(
  command: string,
  args: string[],
  readyUrls: string[],
  options: ProcessOptions,
  stepName: string,
): Promise<ChildProcess> {
  const proc = launch(command, args, options);
  let exitCode: number | undefined;
  void proc.exited.then((code) => {
    exitCode = code;
  });

  const startedAt = Date.now();
  for (;;) {
    options.signal.throwIfAborted();
    if (exitCode !== undefined) {
      throw new StepError({
        name: stepName,
        status: 'failed',
        error: `Process exited with code ${exitCode}.\n${tail(proc.output())}`,
      });
    }
    const ready = await Promise.all(
      readyUrls.map((url) =>
        fetch(url, { signal: AbortSignal.timeout(2000) })
          .then((response) => response.ok)
          .catch(() => false),
      ),
    );
    if (ready.every(Boolean)) {
      return proc.child;
    }
    if (Date.now() - startedAt > 30_000) {
      throw new StepError({
        name: stepName,
        status: 'failed',
        error: `Not ready after 30 seconds (${readyUrls.join(', ')}).\n${tail(proc.output())}`,
      });
    }
    await new Promise((done) => setTimeout(done, 250));
  }
}

function freePort(): Promise<number> {
  return new Promise((done, fail) => {
    const server = createServer();
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => done(port));
    });
  });
}

function tail(text: string, lines = OUTPUT_TAIL_LINES): string {
  return text.trimEnd().split('\n').slice(-lines).join('\n');
}

// ---------------------------------------------------------------------------
// Files

async function copyWorkspace(from: string, to: string): Promise<void> {
  await cp(from, to, {
    recursive: true,
    filter: (source) => {
      const name = basename(source);
      // The QA suite itself is authoring-only and never part of a player's app.
      const isQaSuite = relative(from, source) === 'qa';
      return !EXCLUDED_NAMES.has(name) && !DATABASE_FILE.test(name) && !isQaSuite;
    },
  });
}

async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findFiles(path, pattern)));
    } else if (pattern.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

async function readProgress(file: string): Promise<TestRecord[]> {
  if (!existsSync(file)) {
    return [];
  }
  return (await readFile(file, 'utf8'))
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TestRecord);
}

// ---------------------------------------------------------------------------
// Test listing (used to name unfinished tests after a timeout)

interface PlaywrightListSuite {
  title: string;
  specs?: { title: string }[];
  suites?: PlaywrightListSuite[];
}

function playwrightNames(suites: PlaywrightListSuite[], path: string[] = []): string[] {
  return suites.flatMap((suite) => {
    const suitePath = [...path, suite.title];
    return [
      ...(suite.specs ?? []).map((spec) => [...suitePath, spec.title].join(' > ')),
      ...playwrightNames(suite.suites ?? [], suitePath),
    ];
  });
}

// ---------------------------------------------------------------------------
// Run

interface Context {
  options: Options;
  text: Messages;
  signal: AbortSignal;
  work: string;
  app: string;
  logs: string;
  gate: Gate;
  listed: Record<Gate, string[]>;
  progress: Record<Gate, string>;
  steps: TestRecord[];
  gate2Dir: string;
}

async function step<T>(context: Context, label: string, action: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  console.log(`  … ${label}`);
  try {
    const result = await action();
    console.log(`  ✓ ${label} (${seconds(performance.now() - startedAt)}s)`);
    return result;
  } catch (error) {
    const mark = error instanceof DeadlineError || context.signal.aborted ? '⏱' : '✗';
    console.log(`  ${mark} ${label} (${seconds(performance.now() - startedAt)}s)`);
    throw error;
  }
}

function processOptions(context: Context, cwd: string, logName: string, env?: Record<string, string>) {
  return {
    cwd,
    env,
    logFile: join(context.logs, `${logName}.log`),
    signal: context.signal,
    verbose: context.options.verbose,
  };
}

/**
 * Key of the installed dependencies for this lockfile. Native modules (better-sqlite3) depend on
 * the Node version and platform, so they are part of the key.
 */
async function dependencyKey(app: string): Promise<string> {
  const lockfile = await readFile(join(app, 'package-lock.json'));
  return createHash('sha256')
    .update(lockfile)
    .update(`\0${process.version}\0${process.platform}\0${process.arch}`)
    .digest('hex');
}

/** Restores dependencies from the cache. Returns false when there is no cache entry for this lockfile. */
async function restoreDependencies(context: Context): Promise<boolean> {
  const { app, options } = context;
  if (!options.depsCache || !existsSync(join(app, 'package-lock.json'))) {
    return false;
  }
  const archive = join(options.depsCache, `${await dependencyKey(app)}.tar`);
  if (!existsSync(archive)) {
    return false;
  }
  const { code } = await exec('tar', ['-xf', archive, '-C', app], processOptions(context, app, 'install'));
  return code === 0;
}

/** Stores the freshly installed dependencies in the cache. A failure here never fails QA. */
async function saveDependencies(context: Context): Promise<void> {
  const { app, options } = context;
  if (!options.depsCache || !existsSync(join(app, 'package-lock.json'))) {
    return;
  }
  await mkdir(options.depsCache, { recursive: true });
  const archive = join(options.depsCache, `${await dependencyKey(app)}.tar`);
  const partial = `${archive}.${process.pid}.partial`;
  const dirs = DEPENDENCY_DIRS.filter((dir) => existsSync(join(app, dir)));
  const { code } = await exec('tar', ['-cf', partial, '-C', app, ...dirs], processOptions(context, app, 'install'));
  if (code === 0) {
    await rename(partial, archive);
  } else {
    await rm(partial, { force: true });
  }
}

async function installDependencies(context: Context): Promise<void> {
  const { app, text } = context;
  await step(context, text.steps.install, async () => {
    if (await restoreDependencies(context)) {
      return;
    }
    const args = existsSync(join(app, 'package-lock.json'))
      ? ['ci', '--prefer-offline', '--no-audit', '--no-fund']
      : ['install', '--prefer-offline', '--no-audit', '--no-fund'];
    const { code, output } = await exec('npm', args, processOptions(context, app, 'install'));
    if (code !== 0) {
      throw new StepError({ name: text.steps.install, status: 'failed', error: tail(output) });
    }
    await saveDependencies(context);
  });
}

async function runGate1(context: Context): Promise<boolean> {
  const { app, text } = context;

  await installDependencies(context);

  return step(context, text.steps.gate1, async () => {
    for (const file of await findFiles(app, TEST_FILE)) {
      await rm(file);
    }
    await cp(join(context.options.packageDir, 'gate1'), app, { recursive: true });

    const listFile = join(context.work, 'gate1-list.json');
    await exec('npx', ['--no-install', 'vitest', 'list', `--json=${listFile}`], processOptions(context, app, 'gate1'));
    if (existsSync(listFile)) {
      const listed = JSON.parse(await readFile(listFile, 'utf8')) as { name: string; file: string }[];
      // `vitest list` escapes double quotes in names; the reporter does not.
      context.listed[1] = listed.map((test) => `${relative(app, test.file)} > ${test.name.replaceAll('\\"', '"')}`);
    }

    const { code, output } = await exec(
      'npx',
      [
        '--no-install',
        'vitest',
        'run',
        '--reporter=default',
        `--reporter=${join(QA_DIR, 'support', 'vitest-progress-reporter.ts')}`,
      ],
      processOptions(context, app, 'gate1', { QA_PROGRESS_FILE: context.progress[1] }),
    );
    const records = await readProgress(context.progress[1]);
    const failed = records.some((record) => record.status === 'failed');
    if (code !== 0 && !failed) {
      context.steps.push({ name: text.steps.gate1, status: 'failed', error: tail(output) });
    }
    return code === 0 && !failed;
  });
}

async function runGate2(context: Context): Promise<boolean> {
  const { app, text, work } = context;
  context.gate = 2;
  const services: ChildProcess[] = [];

  try {
    await step(context, text.steps.build, async () => {
      const { code, output } = await exec(
        'npx',
        ['--no-install', 'vite', 'build'],
        processOptions(context, join(app, 'client'), 'build'),
      );
      if (code !== 0) {
        throw new StepError({ name: text.steps.build, status: 'failed', error: tail(output) });
      }
    });

    const databasePath = join(work, 'qa.db');
    await step(context, text.steps.database, async () => {
      const { code, output } = await exec(
        'npm',
        ['run', 'db:reset'],
        processOptions(context, app, 'database', { DATABASE_PATH: databasePath }),
      );
      if (code !== 0) {
        throw new StepError({ name: text.steps.database, status: 'failed', error: tail(output) });
      }
    });

    const baseUrl = await step(context, text.steps.start, async () => {
      const serverPort = await freePort();
      const apiUrl = `http://127.0.0.1:${serverPort}`;
      services.push(
        await startService(
          'node',
          ['src/index.ts'],
          [`${apiUrl}/api/tickets`],
          processOptions(context, join(app, 'server'), 'server', {
            PORT: String(serverPort),
            DATABASE_PATH: databasePath,
          }),
          text.steps.start,
        ),
      );

      const clientPort = await freePort();
      const clientUrl = `http://127.0.0.1:${clientPort}`;
      services.push(
        await startService(
          'npx',
          ['--no-install', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(clientPort), '--strictPort'],
          [`${clientUrl}/`, `${clientUrl}/api/employees`],
          processOptions(context, join(app, 'client'), 'preview', {
            CLIENT_PORT: String(clientPort),
            API_URL: apiUrl,
          }),
          text.steps.start,
        ),
      );
      return clientUrl;
    });

    return await step(context, text.steps.gate2, async () => {
      const { code, output } = await exec(
        'npx',
        ['--no-install', 'playwright', 'test', '--config', 'playwright.config.ts'],
        processOptions(context, QA_DIR, 'gate2', {
          ...gate2Env(context),
          QA_BASE_URL: baseUrl,
          QA_PROGRESS_FILE: context.progress[2],
        }),
      );
      const records = await readProgress(context.progress[2]);
      const failed = records.some((record) => record.status === 'failed');
      if (code !== 0 && !failed) {
        context.steps.push({ name: text.steps.gate2, status: 'failed', error: tail(output) });
      }
      return code === 0 && !failed;
    });
  } finally {
    await Promise.all(services.map(stopProcess));
  }
}

function gate2Env(context: Context): Record<string, string> {
  return {
    QA_TEST_DIR: context.gate2Dir,
    QA_OUTPUT_DIR: join(context.work, 'playwright'),
  };
}

/**
 * Returns the Gate 2 test directory. Spec files import `../../../support/`, and Playwright and
 * its dependencies resolve from this folder's node_modules, so a package from another directory
 * is copied into a temporary `stages/stage-N/` layout inside this folder, next to a copy of support/.
 */
async function prepareGate2(options: Options): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const defaultDir = join(QA_DIR, 'stages', `stage-${options.ticket}`);
  if (resolve(options.packageDir) === defaultDir) {
    return { dir: join(defaultDir, 'gate2'), cleanup: async () => {} };
  }
  const root = await mkdtemp(join(QA_DIR, '.package-'));
  const dir = join(root, 'stages', `stage-${options.ticket}`, 'gate2');
  await cp(join(options.packageDir, 'gate2'), dir, { recursive: true });
  await cp(join(QA_DIR, 'support'), join(root, 'support'), { recursive: true });
  return { dir, cleanup: () => rm(root, { recursive: true, force: true }) };
}

async function listGate2(context: Context): Promise<void> {
  const { code, output } = await exec(
    'npx',
    ['--no-install', 'playwright', 'test', '--config', 'playwright.config.ts', '--list', '--reporter=json'],
    processOptions(context, QA_DIR, 'gate2-list', { ...gate2Env(context), QA_BASE_URL: 'http://127.0.0.1' }),
  );
  if (code === 0) {
    const report = JSON.parse(output.slice(output.indexOf('{'))) as { suites: PlaywrightListSuite[] };
    // Top-level suites are files; the reporter names tests without the file name.
    context.listed[2] = report.suites.flatMap((file) =>
      playwrightNames(file.suites ?? []).concat((file.specs ?? []).map((spec) => spec.title)),
    );
  }
}

async function collectTests(context: Context, timedOut: boolean): Promise<TestRecord[]> {
  const tests: TestRecord[] = [];
  for (const gate of [1, 2] as const) {
    const records = await readProgress(context.progress[gate]);
    tests.push(...records);
    if (timedOut && gate >= context.gate) {
      const finished = new Set(records.map((record) => record.name));
      for (const name of context.listed[gate]) {
        if (!finished.has(name)) {
          tests.push({ name, status: 'unfinished' });
        }
      }
    }
  }
  return [...context.steps, ...tests];
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => prefix + line)
    .join('\n');
}

function printReport(result: QaResult, text: Messages): void {
  console.log('');
  console.log(result.message);

  const failed = result.tests.filter((test) => test.status === 'failed');
  const unfinished = result.tests.filter((test) => test.status === 'unfinished');
  const passed = result.tests.filter((test) => test.status === 'passed');

  if (failed.length > 0) {
    console.log('');
    console.log(text.failingTests);
    for (const test of failed) {
      console.log(`  • ${test.name}`);
      if (test.error) {
        console.log(indent(tail(test.error, 12), '      '));
      }
    }
  }
  if (unfinished.length > 0) {
    console.log('');
    console.log(text.unfinishedTests);
    for (const test of unfinished) {
      console.log(`  • ${test.name}`);
    }
  }
  console.log('');
  console.log(`${text.testCounts(passed.length, failed.length)}. ${text.duration(seconds(result.durationMs))}`);
}

/** `--deps-only`: installs the workspace's dependencies into the cache and exits. */
async function prepareDependencies(context: Context, deadline: NodeJS.Timeout): Promise<void> {
  const { options } = context;
  let ok = false;
  try {
    await step(context, context.text.steps.copy, () => copyWorkspace(options.workspace, context.app));
    await installDependencies(context);
    ok = true;
  } catch (error) {
    if (error instanceof StepError) {
      console.log(indent(tail(error.record.error ?? ''), '    '));
    } else if (!context.signal.aborted) {
      throw error;
    }
  } finally {
    clearTimeout(deadline);
    killAll();
  }
  process.exitCode = ok ? 0 : 1;
}

async function main(): Promise<void> {
  const options = parseOptions();
  const text = messages[options.language];
  const startedAt = performance.now();
  const work = await mkdtemp(join(tmpdir(), 'bug-detective-qa-'));
  const gate2 = options.depsOnly ? { dir: '', cleanup: async () => {} } : await prepareGate2(options);
  const controller = new AbortController();
  const deadline = setTimeout(() => {
    controller.abort(new DeadlineError('timeout'));
    killAll();
  }, options.timeoutSeconds * 1000);

  const interrupt = () => {
    killAll();
    process.exit(130);
  };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  const context: Context = {
    options,
    text,
    signal: controller.signal,
    work,
    app: join(work, 'app'),
    logs: join(work, 'logs'),
    gate: 1,
    listed: { 1: [], 2: [] },
    progress: { 1: join(work, 'gate1.jsonl'), 2: join(work, 'gate2.jsonl') },
    steps: [],
    gate2Dir: gate2.dir,
  };
  await mkdir(context.logs, { recursive: true });

  if (options.depsOnly) {
    await prepareDependencies(context, deadline);
    await rm(work, { recursive: true, force: true });
    return;
  }

  console.log(text.heading(options.ticket));
  console.log('');

  let status: Status;
  try {
    await listGate2(context);
    await step(context, text.steps.copy, () => copyWorkspace(options.workspace, context.app));
    context.listed[1] = (await findFiles(join(options.packageDir, 'gate1'), TEST_FILE)).map((file) =>
      relative(join(options.packageDir, 'gate1'), file),
    );
    status = (await runGate1(context)) && (await runGate2(context)) ? 'passed' : 'failed';
  } catch (error) {
    if (controller.signal.aborted) {
      status = 'timeout';
    } else if (error instanceof StepError) {
      context.steps.push(error.record);
      status = 'failed';
    } else {
      throw error;
    }
  } finally {
    clearTimeout(deadline);
    killAll();
    await gate2.cleanup();
  }

  const message =
    status === 'passed'
      ? text.results.passed
      : status === 'timeout'
        ? text.results.timeout(options.timeoutSeconds)
        : context.gate === 1
          ? text.results.gate1Failed
          : text.results.gate2Failed;

  const result: QaResult = {
    ticket: options.ticket,
    gate: context.gate,
    status,
    message,
    tests: await collectTests(context, status === 'timeout'),
    durationMs: Math.round(performance.now() - startedAt),
  };

  printReport(result, text);

  if (options.jsonPath) {
    await writeFile(options.jsonPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(text.jsonWritten(options.jsonPath));
  }

  if (options.keep) {
    console.log(text.logsKept(work));
  } else {
    await rm(work, { recursive: true, force: true });
  }

  process.exitCode = status === 'passed' ? 0 : 1;
}

await main();
