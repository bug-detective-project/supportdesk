import { appendFileSync } from 'node:fs';

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'unfinished';

export interface TestRecord {
  name: string;
  status: TestStatus;
  error?: string;
}

/** Appends one finished test to the JSON Lines file named by QA_PROGRESS_FILE. */
export function recordProgress(record: TestRecord): void {
  const file = process.env.QA_PROGRESS_FILE;
  if (file) {
    appendFileSync(file, `${JSON.stringify(record)}\n`);
  }
}

export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}
