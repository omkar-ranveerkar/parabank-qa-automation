
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',

    fullyParallel: false,

    forbidOnly: !!process.env.CI,

    retries: 0,

    workers: 1,

    reporter: [
        ['list'],
        ['./reporter/customReporter.ts'],
    ],

    projects: [
        {
            name: 'setup',
            testMatch: '**/admin-config.spec.ts',
        },
        {
            name: 'chromium',
            dependencies: ['setup'],
            testIgnore: '**/admin-config.spec.ts',
        },
    ],

    use: {
        baseURL: 'https://parabank.parasoft.com',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        ...devices['Desktop Chrome'],
    },
});
