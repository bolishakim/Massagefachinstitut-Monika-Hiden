#!/usr/bin/env node

// Simple test script to debug n8n webhook responses
const https = require('https');
const http = require('http');

const webhookUrl = 'https://sterling-infinitely-dogfish.ngrok-free.app/webhook-test/assistant';

const testPayload = {
  message: "Test message from curl",
  messageType: "text",
  userContext: {
    userId: "test-123",
    userName: "Test User",
    userEmail: "test@example.com",
    userRole: "USER",
    sessionId: "test_session_123",
    timestamp: new Date().toISOString()
  }
};

console.log('🧪 Testing n8n webhook...');
console.log('📍 URL:', webhookUrl);
console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
console.log('\n🚀 Sending request...\n');

const url = new URL(webhookUrl);
const isHttps = url.protocol === 'https:';
const httpModule = isHttps ? https : http;

const postData = JSON.stringify(testPayload);

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'n8n-webhook-test/1.0'
  }
};

const req = httpModule.request(options, (res) => {
  console.log('📊 Response Status:', res.statusCode);
  console.log('📋 Response Headers:');
  Object.entries(res.headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  console.log('\n📄 Response Body:');

  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Raw body length:', body.length);
    console.log('Raw body content:', JSON.stringify(body));
    
    if (body.trim()) {
      try {
        const parsed = JSON.parse(body);
        console.log('✅ Parsed JSON:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('❌ JSON Parse Error:', e.message);
        console.log('📄 Body as text:', body);
      }
    } else {
      console.log('⚠️ Empty response body');
    }
    
    console.log('\n🏁 Test complete!');
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

// Send the request
req.write(postData);
req.end();