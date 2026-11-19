
import { test, expect } from '@playwright/test';

test('Configure ParaBank loan provider', async ({ page }) => {

    // Navigate to ParaBank administration page
    await page.goto('/parabank/admin.htm');

    // Locate the application settings form
    const settingsForm = page.locator('form').filter({
        has: page.locator('#loanProvider'),
    });

    // Configure Loan Provider to Web Service
    await settingsForm.locator('#loanProvider').selectOption('ws');

    // Save the configuration
    await settingsForm.locator('input[type="submit"]').click();

    // Verify the selected Loan Provider
    await expect(page.locator('#loanProvider')).toHaveValue('ws');

    console.log('Admin setup: Loan Provider configured to Web Service!');
});
