#!/bin/bash

BASE_URL="http://localhost:3000/api/analytics"

echo "1. Testing Normal Event (Should Succeed)"
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "verification_test", "path": "/test-path", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "2. Testing Admin Event (Should Return 200 but BLOCK DB WRITE)"
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "admin_test", "path": "/admin/dashboard", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "3. Testing Invalid Payload (Should Fail 400)"
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "bad_test"}'
echo -e "\n"
