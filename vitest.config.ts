import { defineConfig } from 'vitest/config';

// Only the QA CLI's own tests: the tickets' gate1/ and gate2/ run inside the workspace copies.
export default defineConfig({
  test: {
    include: ['support/**/*.test.ts'],
  },
});
