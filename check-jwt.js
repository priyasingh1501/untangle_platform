#!/usr/bin/env node

const jwt = require('jsonwebtoken');

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.log('Usage: node check-jwt.js <token>');
  console.log('Example: node check-jwt.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

try {
  // Decode without verification
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded) {
    console.log('❌ Invalid token format');
    process.exit(1);
  }

  console.log('🔍 Token Analysis:');
  console.log('Header:', JSON.stringify(decoded.header, null, 2));
  console.log('Payload:', JSON.stringify(decoded.payload, null, 2));
  
  if (decoded.payload.exp) {
    const expDate = new Date(decoded.payload.exp * 1000);
    const isExpired = Date.now() > decoded.payload.exp * 1000;
    console.log('Expires:', expDate.toISOString());
    console.log('Is expired:', isExpired ? '❌ YES' : '✅ NO');
  }
  
  if (decoded.payload.iat) {
    const issuedDate = new Date(decoded.payload.iat * 1000);
    console.log('Issued at:', issuedDate.toISOString());
  }
  
  if (decoded.payload.iss) {
    console.log('Issuer:', decoded.payload.iss);
  }
  
  if (decoded.payload.aud) {
    console.log('Audience:', decoded.payload.aud);
  }

} catch (error) {
  console.error('❌ Error analyzing token:', error.message);
}
