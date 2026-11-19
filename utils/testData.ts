import { randomUUID } from 'node:crypto';

export function generateUser() {

    const uniqueId = randomUUID().replaceAll('-', '');

    return {
        firstName: 'QA',
        lastName: 'Automation',
        address: '100 Test Street',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411001',
        phone: '9876543210',
        ssn: `SSN${uniqueId.slice(0,9)}`,
        username: `qa_${uniqueId.slice(0,12)}`,
        password: 'Test@12345'
    };

}