
import { type Page, expect } from '@playwright/test';

export class RegisterPage {

    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/parabank/register.htm');
    }

    async register(user: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string;
        ssn: string;
        username: string;
        password: string;
    }) {
        await this.page.locator('input[name="customer.firstName"]').fill(user.firstName);
        await this.page.locator('input[name="customer.lastName"]').fill(user.lastName);
        await this.page.locator('input[name="customer.address.street"]').fill(user.address);
        await this.page.locator('input[name="customer.address.city"]').fill(user.city);
        await this.page.locator('input[name="customer.address.state"]').fill(user.state);
        await this.page.locator('input[name="customer.address.zipCode"]').fill(user.zipCode);
        await this.page.locator('input[name="customer.phoneNumber"]').fill(user.phone);
        await this.page.locator('input[name="customer.ssn"]').fill(user.ssn);
        await this.page.locator('input[name="customer.username"]').fill(user.username);
        await this.page.locator('input[name="customer.password"]').fill(user.password);
        await this.page.locator('input[name="repeatedPassword"]').fill(user.password);

        await this.page.locator('input[value="Register"]').click();
    }

    async verifyRegistrationSuccess() {
        await expect(
            this.page.getByText(/Your account was created successfully/i)
        ).toBeVisible();
    }
}
