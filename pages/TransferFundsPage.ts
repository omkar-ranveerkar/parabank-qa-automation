
import { type Page, expect } from '@playwright/test';

export class TransferFundsPage {
    constructor(private readonly page: Page) {}

    async transferFunds(
        amount: string,
        fromAccountId: number,
        toAccountId: number
    ) {
        await this.page.goto('/parabank/transfer.htm');

        const fromAccount = this.page.locator('#fromAccountId');
        const toAccount = this.page.locator('#toAccountId');

        // Wait for account dropdowns to load
        await expect(fromAccount.locator('option')).not.toHaveCount(0);
        await expect(toAccount.locator('option')).not.toHaveCount(0);

        // Enter transfer details
        await this.page.locator('#amount').fill(amount);
        await fromAccount.selectOption(String(fromAccountId));
        await toAccount.selectOption(String(toAccountId));

        // Submit transfer
        await this.page.locator('input[value="Transfer"]').click();

        // Verify transfer completion
        await expect(this.page.locator('body')).toContainText(
            /Transfer Complete!/i
        );
    }
}
