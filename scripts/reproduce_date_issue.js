
const BASE_URL = 'http://localhost:3000';

async function run() {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const password = 'password123';
    const dob = '2002-07-14';

    console.log(`Creating user with DOB: ${dob}`);

    // 1. Signup
    const signupRes = await fetch(`${BASE_URL}/api/customer-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            CustomerName: `Test User ${timestamp}`,
            PhoneNumber: '555-0199',
            DOB: dob,
            Email: email,
            Password: password
        })
    });

    const signupData = await signupRes.json();
    if (!signupRes.ok) {
        console.error('Signup failed:', signupData);
        return;
    }
    console.log('Signup successful, ID:', signupData.customerId);

    // 2. Fetch Customer Details (mimic dashboard fetch)
    // We need the ID. The signup response returns it.
    const customerId = signupData.customerId;

    const customerRes = await fetch(`${BASE_URL}/api/customer/${customerId}`);
    const customerData = await customerRes.json();

    if (!customerRes.ok) {
        console.error('Fetch customer failed:', customerData);
        return;
    }

    const returnedDOB = customerData.customer.DOB;
    console.log(`Returned DOB from API: ${returnedDOB}`);

    // Check if it matches
    // returnedDOB is likely an ISO string like "2002-07-14T00:00:00.000Z"
    if (returnedDOB.startsWith(dob)) {
        console.log('SUCCESS: Date matches input.');
    } else {
        console.log('FAILURE: Date mismatch!');
        console.log(`Expected to start with: ${dob}`);
        console.log(`Got: ${returnedDOB}`);
    }
}

run().catch(console.error);
