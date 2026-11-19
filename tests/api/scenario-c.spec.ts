
import { test, expect } from '@playwright/test';
import { generateUser } from '../../utils/testData.js';

interface Transaction {
    id: number;
    accountId: number;
    type: string;
    date: number;
    amount: number;
    description: string;
}

test('Scenario C: Create customer, deposit funds and verify transaction history through API', async ({ request }) => {

    const user = generateUser();

    // 1. Establish a session by visiting the registration page
    const registrationPageResponse = await request.get('/parabank/register.htm');

    expect(registrationPageResponse.ok()).toBeTruthy();

    // 2. Register customer through a headless HTTP form submission
    const registrationResponse = await request.post('/parabank/register.htm', {
        form: {
            'customer.firstName': user.firstName,
            'customer.lastName': user.lastName,
            'customer.address.street': user.address,
            'customer.address.city': user.city,
            'customer.address.state': user.state,
            'customer.address.zipCode': user.zipCode,
            'customer.phoneNumber': user.phone,
            'customer.ssn': user.ssn,
            'customer.username': user.username,
            'customer.password': user.password,
            repeatedPassword: user.password
        },
        headers: {
            Referer: 'https://parabank.parasoft.com/parabank/register.htm'
        }
    });

    const registrationBody = await registrationResponse.text();

    expect(
        registrationResponse.ok(),
        `Registration failed with HTTP ${registrationResponse.status()}`
    ).toBeTruthy();

    expect(registrationBody).toContain(
        'Your account was created successfully'
    );

    // 3. Login through REST API to retrieve customer ID
    const loginResponse = await request.get(
        `/parabank/services/bank/login/${user.username}/${user.password}`,
        { headers: { Accept: 'application/json' } }
    );

    expect(loginResponse.ok()).toBeTruthy();

    const customer = await loginResponse.json();

    expect(customer.id).toBeTruthy();

    // 4. Retrieve customer's account
    const accountsResponse = await request.get(
        `/parabank/services/bank/customers/${customer.id}/accounts`,
        { headers: { Accept: 'application/json' } }
    );

    expect(accountsResponse.ok()).toBeTruthy();

    const accounts = await accountsResponse.json();

    expect(accounts.length).toBeGreaterThan(0);

    const accountId = accounts[0].id;

    // 5. Deposit funds through REST API
    const depositAmount = 75.25;

    const depositResponse = await request.post(
        '/parabank/services/bank/deposit',
        {
            params: {
                accountId: String(accountId),
                amount: depositAmount.toFixed(2)
            },
            headers: { Accept: 'application/json' }
        }
    );

    expect(depositResponse.ok()).toBeTruthy();

    // 6. Retrieve transaction history
    const transactionsResponse = await request.get(
        `/parabank/services/bank/accounts/${accountId}/transactions`,
        { headers: { Accept: 'application/json' } }
    );

    expect(transactionsResponse.ok()).toBeTruthy();

    const transactions: Transaction[] = await transactionsResponse.json();

    // 7. Verify transaction history is an array
    expect(Array.isArray(transactions)).toBeTruthy();

    // Validate the structure of every transaction
    for (const transaction of transactions) {
        expect(typeof transaction.id).toBe('number');
        expect(typeof transaction.accountId).toBe('number');
        expect(typeof transaction.type).toBe('string');
        expect(typeof transaction.date).toBe('number');
        expect(typeof transaction.amount).toBe('number');
        expect(typeof transaction.description).toBe('string');
    }

    // 8. Verify the deposit transaction exists
    const depositTransaction = transactions.find(
        transaction =>
            transaction.description === 'Deposit via Web Service'
    );

    expect(depositTransaction).toBeDefined();

    // 9. Verify transaction fields and values
    expect(depositTransaction).toMatchObject({
        accountId,
        type: 'Credit',
        amount: depositAmount,
        description: 'Deposit via Web Service'
    });

    expect(depositTransaction!.id).toEqual(expect.any(Number));
    expect(depositTransaction!.date).toEqual(expect.any(Number));

    // Verify deposited amount using integer cents
    expect(Math.round(depositTransaction!.amount * 100))
        .toBe(Math.round(depositAmount * 100));

    console.log('Scenario C API transaction verification successful!');
});
