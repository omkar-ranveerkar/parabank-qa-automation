
import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage.js';
import { generateUser } from '../../utils/testData.js';
import { OpenAccountPage } from '../../pages/OpenAccountPage.js';
import { TransferFundsPage } from '../../pages/TransferFundsPage.js';

test('Scenario A and B: Register customer, apply for loan and verify fund transfers', async ({ page, request }) => {

    // Scenario A: Customer registration and loan application

    // 1. Generate unique customer details
    const user = generateUser();

    // 2. Register customer through the UI
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(user);
    await registerPage.verifyRegistrationSuccess();

    // 3. Retrieve customer details through the REST API
    const loginResponse = await request.get(
        `/parabank/services/bank/login/${encodeURIComponent(user.username)}/${encodeURIComponent(user.password)}`,
        {
            headers: { Accept: 'application/json' },
        }
    );

    expect(loginResponse.ok()).toBeTruthy();

    const customer = await loginResponse.json();

    expect(customer.id).toBeTruthy();

    // 4. Retrieve the customer's initial account
    const accountsResponse = await request.get(
        `/parabank/services/bank/customers/${customer.id}/accounts`,
        {
            headers: { Accept: 'application/json' },
        }
    );

    expect(accountsResponse.ok()).toBeTruthy();

    const accounts = await accountsResponse.json();

    expect(accounts.length).toBeGreaterThan(0);

    // Use the automatically created Checking account as the funding account
    const fundingAccountId = accounts[0].id;

    expect(accounts[0].type).toBe('CHECKING');

    // 5. Open another Checking account through the UI
    const openAccountPage = new OpenAccountPage(page);

    const newAccountId = await openAccountPage.openCheckingAccount(
        fundingAccountId
    );

    // 6. Navigate to the loan application page
    await page.goto('/parabank/requestloan.htm');

    await expect(page.locator('#amount')).toBeVisible();
    await expect(page.locator('#downPayment')).toBeVisible();
    await expect(page.locator('#fromAccountId')).toBeVisible();

    // 7. Fill in loan application details
    await page.locator('#amount').fill('100');
    await page.locator('#downPayment').fill('10');

    await page.locator('#fromAccountId').selectOption(
        String(fundingAccountId)
    );

    // Verify the entered values
    expect(await page.locator('#amount').inputValue()).toBe('100');
    expect(await page.locator('#downPayment').inputValue()).toBe('10');
    expect(await page.locator('#fromAccountId').inputValue())
        .toBe(String(fundingAccountId));

    // 8. Wait for the actual loan API response
    const loanResponsePromise = page.waitForResponse(response =>
        response.url().includes('/requestLoan') &&
        response.request().method() === 'POST'
    );

    // Apply for the loan
    await page.locator('input[value="Apply Now"]').click();

    const loanResponse = await loanResponsePromise;

    expect(loanResponse.ok()).toBeTruthy();

    // Define the expected loan response structure
    interface LoanResponse {
        responseDate: number;
        loanProviderName: string;
        approved: boolean;
        accountId: number;
    }

    const loanResult: LoanResponse = await loanResponse.json();

    // Verify loan approval
    expect(loanResult.approved).toBe(true);
    expect(loanResult.accountId).toBeTruthy();

    // Verify the configured loan provider
    expect(loanResult.loanProviderName).toContain('WSDL');

    // Verify UI confirmation
    await expect(page.locator('body')).toContainText(
        /Congratulations, your loan has been approved/i
    );

    // Verify the loan account number displayed in the UI
    await expect(page.locator('body')).toContainText(
        String(loanResult.accountId)
    );

    // 9. Retrieve the newly created loan account through REST API
    const loanAccountResponse = await request.get(
        `/parabank/services/bank/accounts/${loanResult.accountId}`,
        {
            headers: { Accept: 'application/json' },
        }
    );

    expect(loanAccountResponse.ok()).toBeTruthy();

    const loanAccount = await loanAccountResponse.json();

    // Verify that the loan amount was deposited
    const loanBalanceInCents = Math.round(loanAccount.balance * 100);

    expect(loanBalanceInCents).toBe(10000);

    // 10. Retrieve the original funding account
    const fundingAccountResponse = await request.get(
        `/parabank/services/bank/accounts/${fundingAccountId}`,
        {
            headers: { Accept: 'application/json' },
        }
    );

    expect(fundingAccountResponse.ok()).toBeTruthy();

    const fundingAccount = await fundingAccountResponse.json();

    // Verify the funding account deduction
    // ParaBank deducts the loan amount plus down payment
    const initialBalanceInCents = Math.round(
        accounts[0].balance * 100
    );

    const loanAmountInCents = 10000;
    const downPaymentInCents = 1000;

    const expectedFundingBalanceInCents =
        initialBalanceInCents - loanAmountInCents - downPaymentInCents;

    const actualFundingBalanceInCents = Math.round(
        fundingAccount.balance * 100
    );

    expect(actualFundingBalanceInCents).toBe(
        expectedFundingBalanceInCents
    );

    console.log('Scenario A: Loan application and balance verification successful!');

    // Scenario B: Transfer funds and verify transaction history

    // 11. Perform three transfers between Checking accounts
    const transferPage = new TransferFundsPage(page);

    const transferAmounts = ['150', '25.50', '8.99'];

    for (const amount of transferAmounts) {
        console.log(`Transferring $${amount}`);

        await transferPage.transferFunds(
            amount,
            fundingAccountId,
            Number(newAccountId)
        );
    }

    console.log('All three transfers completed successfully.');

    // 12. Calculate expected total transfer amount in cents
    const expectedTransferAmounts = transferAmounts.map(amount =>
        Math.round(Number(amount) * 100)
    );

    const totalTransferInCents = expectedTransferAmounts.reduce(
        (total, amount) => total + amount,
        0
    );

    expect(totalTransferInCents).toBe(18449);

    // 13. Retrieve source account balance after transfers
    const updatedFundingResponse = await request.get(
        `/parabank/services/bank/accounts/${fundingAccountId}`,
        {
            headers: { Accept: 'application/json' },
        }
    );

    expect(updatedFundingResponse.ok()).toBeTruthy();

    const updatedFundingAccount = await updatedFundingResponse.json();

    // Verify expected remaining balance
    const finalBalanceInCents = Math.round(
        updatedFundingAccount.balance * 100
    );

    expect(finalBalanceInCents).toBe(22101);

    console.log('Scenario B: Final account balance verification successful!');

    // 14. Search transactions for the source Checking account
    await page.goto('/parabank/findtrans.htm');

    await page.locator('#accountId').selectOption(String(fundingAccountId));

    // Use today's date in MM-DD-YYYY format
    const today = new Date();

    const todayFormatted = [
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
        today.getFullYear()
    ].join('-');

    await page.locator('#fromDate').fill(todayFormatted);
    await page.locator('#toDate').fill(todayFormatted);

    await page.locator('#findByDateRange').click();

    // Wait for transaction search results
    await page.waitForLoadState('networkidle');

    // 15. Extract transaction details from the results table
    const transactionRows = await page.locator('table tr').evaluateAll(rows =>
        rows.slice(1).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));

            return {
                description: cells[1]?.textContent?.trim() ?? '',
                debit: cells[2]?.textContent?.trim() ?? ''
            };
        })
    );

    // Extract only the three transfers performed in Scenario B
    const actualTransferAmounts = transactionRows
        .filter(row => row.description === 'Funds Transfer Sent')
        .map(row =>
            Math.round(
                Number(row.debit.replace('$', '').replace(',', '')) * 100
            )
        )
        .filter(amount => expectedTransferAmounts.includes(amount));

    // 16. Verify all three expected transfer amounts were found
    expect([...actualTransferAmounts].sort((a, b) => a - b))
        .toEqual([...expectedTransferAmounts].sort((a, b) => a - b));

    // Verify total transferred amount
    const actualTransferTotal = actualTransferAmounts.reduce(
        (total, amount) => total + amount,
        0
    );

    expect(actualTransferTotal).toBe(18449);

    console.log(
        `Scenario B: Transaction history verification successful. Total transferred: $${(actualTransferTotal / 100).toFixed(2)}`
    );
});
