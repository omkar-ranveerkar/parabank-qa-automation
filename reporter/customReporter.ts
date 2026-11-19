
import type {
    FullResult,
    Reporter,
    TestCase,
    TestResult,
} from '@playwright/test/reporter';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface TestRecord {
    title: string;
    file: string;
    status: string;
    duration: number;
    error: string;
}

class CustomReporter implements Reporter {
    private results: TestRecord[] = [];

    onTestEnd(test: TestCase, result: TestResult) {
        this.results.push({
            title: test.titlePath().join(' › '),
            file: path.relative(process.cwd(), test.location.file),
            status: result.status,
            duration: result.duration,
            error: result.errors
                .map(error => error.message ?? '')
                .filter(Boolean)
                .join('\n'),
        });
    }

    async onEnd(result: FullResult) {
        const reportDirectory = path.resolve('reports');

        await mkdir(reportDirectory, { recursive: true });

        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r =>
            ['failed', 'timedOut', 'interrupted'].includes(r.status)
        ).length;
        const skipped = this.results.filter(r => r.status === 'skipped').length;

        const totalDuration = this.results.reduce(
            (sum, test) => sum + test.duration,
            0
        );

        const escapeHtml = (value: string) =>
            value.replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character]!);

        const rows = this.results.map(test => `
            <tr>
                <td>
                    <strong>${escapeHtml(test.title)}</strong>
                    <small>${escapeHtml(test.file)}</small>
                    ${test.error
                        ? `<pre>${escapeHtml(test.error)}</pre>`
                        : ''}
                </td>
                <td>
                    <span class="status ${escapeHtml(test.status)}">
                        ${escapeHtml(test.status)}
                    </span>
                </td>
                <td>${(test.duration / 1000).toFixed(2)}s</td>
            </tr>
        `).join('');

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParaBank QA Automation Dashboard</title>

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            min-height: 100vh;
            padding: 40px 6%;
            font-family: Inter, Segoe UI, Arial, sans-serif;
            color: #f8fafc;
            background:
                radial-gradient(circle at 10% 10%, #273449, transparent 40%),
                radial-gradient(circle at 90% 80%, #3b2635, transparent 40%),
                linear-gradient(135deg, #0f172a, #111827);
        }

        .container {
            max-width: 1200px;
            margin: auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
            margin-bottom: 35px;
        }

        h1 {
            font-size: clamp(24px, 4vw, 34px);
            margin-bottom: 8px;
        }

        .accent {
            color: #F48031;
        }

        .subtitle {
            color: #94a3b8;
            font-size: 14px;
        }

        .overall {
            padding: 12px 20px;
            border-radius: 30px;
            background: rgba(244, 128, 49, 0.13);
            border: 1px solid rgba(244, 128, 49, 0.4);
            color: #ffad72;
            font-weight: 600;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 18px;
            margin-bottom: 30px;
        }

        .card, .panel {
            background: rgba(255, 255, 255, 0.07);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 18px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
        }

        .card {
            padding: 24px;
        }

        .card p {
            color: #94a3b8;
            font-size: 13px;
            margin-bottom: 12px;
        }

        .card h2 {
            font-size: 32px;
        }

        .passed-text { color: #4ade80; }
        .failed-text { color: #f87171; }
        .skipped-text { color: #facc15; }
        .accent-text { color: #F48031; }

        .panel {
            padding: 26px;
            overflow-x: auto;
        }

        .panel h2 {
            font-size: 19px;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 650px;
            text-align: left;
        }

        th, td {
            padding: 16px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.09);
            font-size: 13px;
            vertical-align: top;
        }

        th {
            color: #94a3b8;
            font-weight: 500;
        }

        td small {
            display: block;
            color: #94a3b8;
            margin-top: 6px;
        }

        .status {
            display: inline-block;
            padding: 6px 11px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .passed {
            color: #4ade80;
            background: rgba(74, 222, 128, 0.12);
        }

        .failed, .timedOut, .interrupted {
            color: #f87171;
            background: rgba(248, 113, 113, 0.12);
        }

        .skipped {
            color: #facc15;
            background: rgba(250, 204, 21, 0.12);
        }

        pre {
            white-space: pre-wrap;
            color: #fca5a5;
            margin-top: 10px;
            max-width: 500px;
        }

        footer {
            margin-top: 25px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }

        @media (max-width: 600px) {
            body { padding: 25px 4%; }
            .panel { padding: 16px; }
        }
    </style>
</head>

<body>
    <main class="container">
        <header>
            <div>
                <h1>ParaBank <span class="accent">QA Dashboard</span></h1>
                <p class="subtitle">Playwright Automation Execution Report</p>
            </div>

            <div class="overall">
                ${escapeHtml(result.status.toUpperCase())}
            </div>
        </header>

        <section class="cards">
            <div class="card">
                <p>Total Tests</p>
                <h2>${total}</h2>
            </div>

            <div class="card">
                <p>Passed</p>
                <h2 class="passed-text">${passed}</h2>
            </div>

            <div class="card">
                <p>Failed</p>
                <h2 class="failed-text">${failed}</h2>
            </div>

            <div class="card">
                <p>Skipped</p>
                <h2 class="skipped-text">${skipped}</h2>
            </div>

            <div class="card">
                <p>Execution Duration</p>
                <h2 class="accent-text">${(totalDuration / 1000).toFixed(1)}s</h2>
            </div>
        </section>

        <section class="panel">
            <h2>Test Execution Details</h2>

            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Duration</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows || '<tr><td colspan="3">No tests executed.</td></tr>'}
                </tbody>
            </table>
        </section>

        <footer>
            Generated automatically by the ParaBank Custom Playwright Reporter
        </footer>
    </main>
</body>
</html>
        `;

        await writeFile(
            path.join(reportDirectory, 'index.html'),
            html,
            'utf8'
        );

        console.log(`Custom report generated: ${path.join(reportDirectory, 'index.html')}`);
    }
}

export default CustomReporter;
