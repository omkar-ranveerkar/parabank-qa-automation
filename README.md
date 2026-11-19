# ParaBank QA Automation Framework

A UI and API test automation framework built using **Playwright and TypeScript** for the ParaBank application.

The framework covers customer registration, loan application, fund transfers, transaction history verification, and API-based transaction validation.

## Tech Stack

- Playwright
- TypeScript
- Node.js
- REST API testing
- Page Object Model (POM)
- Custom HTML test reporter

## Prerequisites

- Node.js
- npm
- Git

## Project Setup

Clone the repository:

```bash
git clone https://github.com/omkar-ranveerkar/parabank-qa-automation.git
cd parabank-qa-automation
```

Install dependencies:

```bash
npm ci
```

Install the Playwright Chromium browser:

```bash
npx playwright install chromium
```

## Running Tests

Run the complete test suite:

```bash
npx playwright test
```

Run tests in headed mode:

```bash
npx playwright test --headed
```

Run only the API test (Scenario C):

```bash
npx playwright test tests/api/scenario-c.spec.ts
```

Run only the UI test covering Scenarios A and B:

```bash
npx playwright test tests/ui/register.spec.ts
```

Run TypeScript type checking:

```bash
npx tsc --noEmit
```

The ParaBank loan-provider configuration test runs as a setup dependency before the main test project.

## Test Scenarios

### Scenario A: Customer Registration and Loan Application

- Configure the loan provider to Web Service.
- Register a customer with dynamically generated details.
- Retrieve customer and account information through REST APIs.
- Open an additional Checking account through the UI.
- Apply for a loan through the UI.
- Verify loan approval and the loan account number.
- Verify the loan amount deposited and the funding account deduction.

### Scenario B: Fund Transfers and Transaction Verification

- Perform three fund transfers between Checking accounts.
- Search transaction history through the UI.
- Extract and validate transfer amounts.
- Verify the total deductions against the expected amount.
- Verify the updated source account balance.

### Scenario C: API-Based Transaction Verification

- Register a customer through HTTP requests.
- Authenticate and retrieve customer account details.
- Deposit funds through the REST API.
- Retrieve transaction history.
- Validate transaction fields and deposited amount using a TypeScript interface.

## Custom HTML Report

A custom HTML reporter generates a dashboard at:

```text
reports/index.html
```

The dashboard includes:

- Total, passed, failed, and skipped test counts.
- Test execution duration.
- Individual test results.
- Failure details and error messages.

After running the test suite, open the report on Windows using:

```bash
start reports/index.html
```

## Framework Structure

```text
parabank-qa-automation/
├── pages/
│   ├── RegisterPage.ts
│   ├── OpenAccountPage.ts
│   └── TransferFundsPage.ts
├── reporter/
│   └── customReporter.ts
├── reports/
│   └── index.html
├── tests/
│   ├── api/
│   │   └── scenario-c.spec.ts
│   └── ui/
│       ├── admin-config.spec.ts
│       ├── home.spec.ts
│       └── register.spec.ts
├── utils/
│   └── testData.ts
├── .gitignore
├── DECISIONS.md
├── package.json
├── package-lock.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

## Design Decisions

Refer to [DECISIONS.md](DECISIONS.md) for details about framework architecture, test isolation, shared environment considerations, API/UI test strategy, dynamic waits, and monetary precision.