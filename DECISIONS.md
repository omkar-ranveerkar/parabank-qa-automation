
# Technical Decisions

## 1. Framework Architecture

The automation framework uses Playwright with TypeScript.

The Page Object Model (POM) design pattern is used to separate page-specific interactions from test scenarios.

The framework is organized into the following directories:

- `tests/ui` - UI automation scenarios.
- `tests/api` - API automation scenarios.
- `pages` - Page Object Model classes.
- `utils` - Reusable test data and utility functions.
- `reporter` - Custom HTML reporter.
- `reports` - Generated execution reports.

This structure improves maintainability, reusability and scalability.

## 2. Shared Sandbox and Test Concurrency

ParaBank is a publicly accessible demo application. Its backend database and application configuration are shared across users.

To reduce the possibility of test interference:

- Playwright runs with a single worker.
- `fullyParallel` is disabled.
- Each test generates a unique username using a UUID.
- The admin setup test runs before the regular test suite through Playwright project dependencies.

The database Clean and Initialize operations are intentionally not executed because they could delete or modify data belonging to other users of the shared environment.

The tests use independent customer accounts wherever possible.

## 3. Loan Provider Configuration

Scenario A requires the loan provider to be configured as Web Service.

The admin configuration test navigates to the ParaBank administration page, selects the Web Service loan provider and verifies the saved configuration.

This test is configured as a setup project dependency so that the required configuration is established before the other tests execute.

## 4. Dynamic Test Data and Account IDs

Customer details are generated dynamically for every execution.

The username and SSN are generated using Node.js UUID functionality to minimize duplicate-data conflicts.

Customer IDs and account IDs are retrieved from REST API responses rather than hardcoded.

The dynamically retrieved account IDs are then used in subsequent UI and API operations.

This makes the tests independent of previously generated account numbers.

## 5. Monetary Calculations and Floating-Point Precision

Financial calculations use integer cents instead of direct floating-point comparisons.

For example:

- $150.00 is represented as 15000 cents.
- $25.50 is represented as 2550 cents.
- $8.99 is represented as 899 cents.

The amounts are converted into cents using `Math.round(amount * 100)` before comparisons.

This avoids common floating-point precision issues in JavaScript.

## 6. UI and API Testing Strategy

UI interactions are used where the assignment requires validation of user-facing functionality.

Examples include:

- Customer registration.
- Opening a Checking account.
- Applying for a loan.
- Transferring funds.
- Searching transaction history.

API requests are used to retrieve customer and account IDs, validate account balances and verify backend transaction data.

Scenario C is implemented as a headless API test using Playwright's API request fixture.

It creates a customer, deposits funds and retrieves transaction history without launching a browser.

This approach provides a balance between end-to-end UI validation and faster backend verification.

## 7. Dynamic Waiting Strategy

The framework avoids fixed-duration sleeps such as `waitForTimeout()`.

Playwright's locator assertions and response waiting mechanisms are used instead.

Examples include:

- Waiting for account dropdown options to become available.
- Waiting for loan API responses.
- Waiting for successful UI confirmation messages.

This improves test reliability and reduces unnecessary waiting time.

## 8. Custom Reporting

A custom Playwright reporter generates an HTML dashboard at:

`reports/index.html`

The dashboard displays:

- Total tests.
- Passed tests.
- Failed tests.
- Skipped tests.
- Execution duration.
- Individual test results.
- Failure details when available.

The dashboard uses a responsive glassmorphism design with the accent color `#F48031`.

The built-in HTML and Allure reporters are not used.
