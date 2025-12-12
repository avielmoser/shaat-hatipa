#!/bin/bash

BASE_URL="http://localhost:3000/api/analytics"

echo "1. Testing Normal 'page_view' (Should Succeed)"
# 'wizard_viewed' is in taxonomy as page_view
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "wizard_viewed", "eventType": "page_view", "path": "/test-path", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "2. Testing ALLOWED 'action' (Should Succeed)"
# 'schedule_generation_failed' is in taxonomy as action
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "schedule_generation_failed", "eventType": "action", "path": "/test-path", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "3. Testing BLOCKED 'action' (Should Fail 400 - Type Mismatch or Not Allowlisted)"
# 'button_click' is NOT in taxonomy
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "button_click", "eventType": "action", "path": "/test-path", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "4. Testing Strict Type Mismatch (Should Fail 400)"
# 'wizard_viewed' is page_view, sending as action should fail
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "wizard_viewed", "eventType": "action", "path": "/test-path", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "5. Testing 'conversion' (Should Succeed)"
# 'schedule_generated' is in taxonomy as conversion
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "schedule_generated", "eventType": "conversion", "path": "/test-path", "sessionId": "verif-123"}'
echo -e "\n\n"

echo "6. Testing Admin Event (Should Return 200 but BLOCK DB WRITE)"
curl -v -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "wizard_viewed", "eventType": "page_view", "path": "/admin/dashboard", "sessionId": "verif-123"}'
echo -e "\n\n"
