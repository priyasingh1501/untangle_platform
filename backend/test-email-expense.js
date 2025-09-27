const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:5002';

async function testEmailExpenseFlow() {
  console.log('🧪 Testing Email Expense Flow...\n');

  try {
    // Test 1: Get forwarding email
    console.log('1. Testing forwarding email generation...');
    const forwardingResponse = await axios.get(`${API_BASE}/api/email-expense/forwarding-email`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Forwarding email:', forwardingResponse.data.forwardingEmail);

    // Test 2: Test email parsing with mock data
    console.log('\n2. Testing email parsing...');
    const mockEmailData = {
      subject: 'Receipt from Starbucks - ₹450',
      text: 'Thank you for your purchase at Starbucks. Amount: ₹450.00. Date: 2024-01-15. Payment: Credit Card',
      html: '<p>Thank you for your purchase at Starbucks. Amount: ₹450.00. Date: 2024-01-15. Payment: Credit Card</p>',
      attachments: []
    };

    const parseResponse = await axios.post(`${API_BASE}/api/email-expense/process-email`, mockEmailData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Email parsing result:', parseResponse.data);

    // Test 3: Test webhook endpoint (simulated)
    console.log('\n3. Testing webhook endpoint...');
    const webhookData = {
      from: 'receipts@starbucks.com',
      to: forwardingResponse.data.forwardingEmail,
      subject: 'Receipt from Starbucks - ₹450',
      text: 'Thank you for your purchase at Starbucks. Amount: ₹450.00. Date: 2024-01-15. Payment: Credit Card',
      html: '<p>Thank you for your purchase at Starbucks. Amount: ₹450.00. Date: 2024-01-15. Payment: Credit Card</p>',
      attachments: []
    };

    const webhookResponse = await axios.post(`${API_BASE}/api/email-expense/webhook`, webhookData);
    console.log('✅ Webhook response:', webhookResponse.data);

    // Test 4: Get email expenses
    console.log('\n4. Testing email expenses retrieval...');
    const expensesResponse = await axios.get(`${API_BASE}/api/email-expense/email-expenses`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Email expenses count:', expensesResponse.data.expenses.length);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmailExpenseFlow();
