import { relative } from 'node:path';
import type { Reporter, TestCase, TestModule } from 'vitest/node';
import { recordProgress, stripAnsi } from './progress.ts';

/** Streams each finished test to QA_PROGRESS_FILE so a timed-out run can still be reported. */
export default class VitestProgressReporter implements Reporter {
  onTestCaseResult(testCase: TestCase): void {
    const result = testCase.result();
    const name = `${relative(process.cwd(), testCase.module.moduleId)} > ${testCase.fullName}`;
    const status = result.state === 'passed' ? 'passed' : result.state === 'skipped' ? 'skipped' : 'failed';
    const error = result.errors?.[0]?.message;
    recordProgress({ name, status, ...(status === 'failed' && { error: error && stripAnsi(error) }) });
  }

  onTestModuleEnd(testModule: TestModule): void {
    const [error] = testModule.errors();
    if (error) {
      recordProgress({
        name: `${relative(process.cwd(), testModule.moduleId)} (file could not run)`,
        status: 'failed',
        error: stripAnsi(error.message),
      });
    }
  }
}
