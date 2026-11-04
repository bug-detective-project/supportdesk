export type Language = 'en' | 'pt';

export interface Messages {
  heading: (ticket: number) => string;
  steps: {
    copy: string;
    install: string;
    gate1: string;
    build: string;
    database: string;
    start: string;
    gate2: string;
  };
  results: {
    gate1Failed: string;
    gate2Failed: string;
    timeout: (seconds: number) => string;
    passed: string;
  };
  /** A dependency of the workspace that does not come from the npm registry: the install refuses it. */
  forbiddenDependency: (name: string, resolved: string) => string;
  failingTests: string;
  unfinishedTests: string;
  testCounts: (passed: number, failed: number) => string;
  duration: (seconds: string) => string;
  jsonWritten: (path: string) => string;
  logsKept: (path: string) => string;
  usage: string;
}

export const messages: Record<Language, Messages> = {
  en: {
    heading: (ticket) => `Bug Detective QA: ticket ${ticket}`,
    steps: {
      copy: 'Copy workspace',
      install: 'Install dependencies',
      gate1: 'Gate 1: project tests',
      build: 'Build client',
      database: 'Create a fresh database',
      start: 'Start app',
      gate2: 'Gate 2: ticket validation',
    },
    results: {
      gate1Failed:
        'Gate 1 failed: existing functionality broke. Your change made project tests fail. Fix them before resubmitting.',
      gate2Failed:
        'Gate 2 failed: the reported bug is still unresolved. The app still shows the behavior described in the ticket.',
      timeout: (seconds) =>
        `Timeout: QA exceeded the time limit of ${seconds} seconds, possibly because of a hang or infinite loop.`,
      passed: 'Passed: ready for code review.',
    },
    forbiddenDependency: (name, resolved) =>
      `The dependency ${name} comes from ${resolved}, not from the npm registry. Only packages from https://registry.npmjs.org/ can be installed.`,
    failingTests: 'Failing tests:',
    unfinishedTests: 'Unfinished tests:',
    testCounts: (passed, failed) => `${passed} passed, ${failed} failed`,
    duration: (seconds) => `Finished in ${seconds}s`,
    jsonWritten: (path) => `JSON result written to ${path}`,
    logsKept: (path) => `Logs and the workspace copy were kept in ${path}`,
    usage:
      'Usage: npm run qa -- --ticket <n> --package <dir> --workspace <path> [--lang en|pt] [--json out.json] [--timeout seconds] [--keep] [--deps-cache dir] [--deps-only]',
  },
  pt: {
    heading: (ticket) => `Bug Detective QA: ticket ${ticket}`,
    steps: {
      copy: 'Copiar o workspace',
      install: 'Instalar dependências',
      gate1: 'Gate 1: testes do projeto',
      build: 'Gerar o build do client',
      database: 'Criar um banco de dados novo',
      start: 'Iniciar a aplicação',
      gate2: 'Gate 2: validação do ticket',
    },
    results: {
      gate1Failed:
        'Gate 1 falhou: uma funcionalidade existente quebrou. Sua alteração fez testes do projeto falharem. Corrija-os antes de reenviar.',
      gate2Failed:
        'Gate 2 falhou: o bug reportado ainda não foi resolvido. A aplicação ainda apresenta o comportamento descrito no ticket.',
      timeout: (seconds) =>
        `Timeout: o QA excedeu o limite de ${seconds} segundos, possivelmente por causa de um travamento ou loop infinito.`,
      passed: 'Aprovado: pronto para code review.',
    },
    forbiddenDependency: (name, resolved) =>
      `A dependência ${name} vem de ${resolved}, não do registro do npm. Só pacotes de https://registry.npmjs.org/ podem ser instalados.`,
    failingTests: 'Testes com falha:',
    unfinishedTests: 'Testes não concluídos:',
    testCounts: (passed, failed) => `${passed} passaram, ${failed} falharam`,
    duration: (seconds) => `Concluído em ${seconds}s`,
    jsonWritten: (path) => `Resultado em JSON gravado em ${path}`,
    logsKept: (path) => `Os logs e a cópia do workspace foram mantidos em ${path}`,
    usage:
      'Uso: npm run qa -- --ticket <n> --package <pasta> --workspace <caminho> [--lang en|pt] [--json saida.json] [--timeout segundos] [--keep] [--deps-cache pasta] [--deps-only]',
  },
};
