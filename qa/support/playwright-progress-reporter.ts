import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { recordProgress, stripAnsi } from './progress.ts';

/** Streams each finished test to QA_PROGRESS_FILE so a timed-out run can still be reported. */
export default class PlaywrightProgressReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    const name = test.titlePath().slice(3).join(' > ');
    const status = result.status === 'passed' ? 'passed' : result.status === 'skipped' ? 'skipped' : 'failed';
    const error =
      result.status === 'timedOut'
        ? `Test timed out after ${result.duration} ms`
        : result.errors[0]?.message && stripAnsi(result.errors[0].message);
    recordProgress({ name, status, ...(status === 'failed' && { error }) });
  }

  printsToStdio(): boolean {
    return false;
  }
}
