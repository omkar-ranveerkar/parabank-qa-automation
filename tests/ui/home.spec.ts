import {test, expect} from '@playwright/test';

test ('ParaBank homepage should load successfully',  async ({ page }) => {

    // Navigate to ParaBank
    await page.goto('/');

    // Verify the page title
    await expect(page).toHaveTitle(/ParaBank/);

    // Verify Register link is visible
    await expect(
        page.getByRole('link', { name: 'Register' })
    ).toBeVisible();

});