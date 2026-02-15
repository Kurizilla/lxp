#!/bin/bash

# Test script for M09 Offline Sync endpoints
# Usage: ./scripts/test-offline-sync-endpoints.sh [port]

PORT=${1:-3001}
BASE_URL="http://localhost:$PORT"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Testing M09 Offline Sync Endpoints"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Counter for tests
PASSED=0
FAILED=0

# Helper function to check response
check_response() {
    local test_name="$1"
    local expected_code="$2"
    local actual_code="$3"
    local response_body="$4"
    
    if [ "$actual_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name (HTTP $actual_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo "  Expected: HTTP $expected_code, Got: HTTP $actual_code"
        echo "  Response: $response_body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Login as admin to get token
echo "1. Login as admin..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ PASS${NC}: Login successful"
    echo "  Token: ${TOKEN:0:30}..."
    echo "  User ID: $USER_ID"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: Login failed"
    echo "  Response: $BODY"
    FAILED=$((FAILED + 1))
    echo ""
    echo "=========================================="
    echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
    echo "=========================================="
    exit 1
fi

echo ""

# Test 2: Get sync status (should work with empty state)
echo "2. GET /m09/offline/status..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/m09/offline/status" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Get sync status" "200" "$HTTP_CODE" "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
    echo "  Response: $BODY"
fi

echo ""

# Test 3: Get conflicts (should be empty initially)
echo "3. GET /m09/offline/conflicts..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/m09/offline/conflicts" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Get conflicts (empty)" "200" "$HTTP_CODE" "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
    echo "  Response: $BODY"
fi

echo ""

# Test 4: Push sync with a create operation
echo "4. POST /m09/offline/push (create operation)..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/offline/push" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"operations\": [
      {
        \"entity_type\": \"whiteboard_element\",
        \"operation_type\": \"create\",
        \"payload\": {
          \"element_type\": \"text\",
          \"content\": \"Test element\",
          \"position_x\": 100,
          \"position_y\": 200
        },
        \"client_version\": 1,
        \"client_timestamp\": \"$TIMESTAMP\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Push sync (create)" "200" "$HTTP_CODE" "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
    echo "  Synced operations: $(echo "$BODY" | grep -o '"synced":\[[^]]*\]' | head -1)"
fi

echo ""

# Test 5: Push sync with multiple operations (both create, no entity_id needed)
echo "5. POST /m09/offline/push (multiple operations)..."
TIMESTAMP2=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/offline/push" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"operations\": [
      {
        \"entity_type\": \"calendar_event\",
        \"operation_type\": \"create\",
        \"payload\": {
          \"title\": \"Test Event\",
          \"start_time\": \"$TIMESTAMP2\"
        },
        \"client_version\": 1,
        \"client_timestamp\": \"$TIMESTAMP2\"
      },
      {
        \"entity_type\": \"whiteboard_element\",
        \"operation_type\": \"create\",
        \"payload\": {
          \"element_type\": \"shape\",
          \"content\": \"Rectangle shape\",
          \"position_x\": 300,
          \"position_y\": 400
        },
        \"client_version\": 1,
        \"client_timestamp\": \"$TIMESTAMP2\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Push sync (multiple)" "200" "$HTTP_CODE" "$BODY"

echo ""

# Test 6: Pull sync to get server changes
echo "6. POST /m09/offline/pull..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/offline/pull" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_types": ["whiteboard_element", "calendar_event"],
    "limit": 10
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Pull sync" "200" "$HTTP_CODE" "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
    CHANGES_COUNT=$(echo "$BODY" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "  Total changes: $CHANGES_COUNT"
fi

echo ""

# Test 7: Get sync status after operations
echo "7. GET /m09/offline/status (after operations)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/m09/offline/status" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Get sync status (after)" "200" "$HTTP_CODE" "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
    echo "  Response: $BODY"
fi

echo ""

# Test 8: Test without auth (should fail with 401)
echo "8. GET /m09/offline/status (no auth)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/m09/offline/status")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "No auth returns 401" "401" "$HTTP_CODE" "$BODY"

echo ""

# Test 9: Get conflicts with filter
echo "9. GET /m09/offline/conflicts?status=pending..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/m09/offline/conflicts?status=pending" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Get conflicts (filtered)" "200" "$HTTP_CODE" "$BODY"

echo ""

# Test 10: Pull sync with timestamp filter
echo "10. POST /m09/offline/pull (with timestamp filter)..."
PAST_TIMESTAMP=$(($(date +%s) - 3600))000  # 1 hour ago in milliseconds
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/offline/pull" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"last_sync_timestamp\": $PAST_TIMESTAMP,
    \"limit\": 5
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Pull sync (with timestamp)" "200" "$HTTP_CODE" "$BODY"

echo ""

# Test 11: Clear history
echo "11. DELETE /m09/offline/history..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/m09/offline/history" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
check_response "Clear history" "200" "$HTTP_CODE" "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
    echo "  Response: $BODY"
fi

echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
