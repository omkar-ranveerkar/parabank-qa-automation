
import { type Page, expect } from '@playwright/test';

export class OpenAccountPage {
    constructor(private readonly page: Page) {}

    async openCheckingAccount(
        fundingAccountId: number
    ): Promise<string> {
        await this.page.goto('/parabank/openaccount.htm');

        const accountType = this.page.locator('#type');
        const fromAccount = this.page.locator('#fromAccountId');

        // Wait until the funding account appears in the dropdown
        await expect(fromAccount.locator('option')).not.toHaveCount(0);

        // Select Checking account
        await accountType.selectOption({ label: 'CHECKING' });

        // Select the dynamically retrieved funding account
        await fromAccount.selectOption(String(fundingAccountId));

        // Open the new account
        await this.page.getByRole('button', {
            name: 'Open New Account',
        }).click();

        // Verify account creation
        await expect(
            this.page.getByText(/Congratulations, your account is now open/i)
        ).toBeVisible();

        const newAccountId = await this.page.locator('#newAccountId').innerText();

        return newAccountId.trim();
    }
}


/*
import { type Page, expect } from '@playwright/test';

export class OpenAccountPage {

    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/parabank/openaccount.htm');
    }

    async openCheckingAccount(): Promise<string> {
        const accountType = this.page.locator('#type');
        const fromAccount = this.page.locator('#fromAccountId');

        console.log('Open account URL:', this.page.url());
        console.log('Page content:', await this.page.locator('body').innerText());

        console.log(
            'Account type options:',
            await accountType.locator('option').allInnerTexts()
        );

        console.log(
            'Source account options:',
            await fromAccount.locator('option').allInnerTexts()
        );

        await accountType.selectOption({ label: 'CHECKING' });

        return '';
    }
*/

    /*
    async openCheckingAccount(): Promise<string> {
        const accountType = this.page.locator('#type');
        const fromAccount = this.page.locator('#fromAccountId');

        //Select checking account
        await accountType.selectOption({ label: 'CHECKING' });

        // Wait until the source account options have loaded
        // No fixed sleep is required.
        await expect.poll( 
            () => fromAccount.locator('option').count()
        ).toBeGreaterThan(1);

        // Select the first available existing account
        await fromAccount.selectOption({ index: 1 });

        await this.page.getByRole('button', {
            name: 'Open New Account'
        }).click();

        // Wait for the new account number.
        const newAccountId = this.page.locator('#newAccountId');
        await expect(newAccountId).toBeVisible();

        const accountNumber = (await newAccountId.innerText()).trim();

        expect(accountNumber).not.toBe('');

        return accountNumber;
    }
        */
