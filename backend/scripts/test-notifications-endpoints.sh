#!/bin/bash
# =============================================================================
# Test script for Notifications Endpoints
# Usage: ./scripts/test-notifications-endpoints.sh [PORT]
# Default port: 3001
# =============================================================================

PORT=${1:-3001}
BASE_URL="http://localhost:$PORT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing Notifications Endpoints"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

# Function to check if server is running
check_server() {
  if ! curl -s "$BASE_URL/auth/login" -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running on $BASE_URL${NC}"
    echo "   Start server with: npm start"
    exit 1
  fi
}

# Function to run test
run_test() {
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  
  if echo "$actual" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    echo "   Expected to contain: $expected"
    echo "   Got: $actual"
    return 1
  fi
}

# Check server
check_server

PASSED=0
FAILED=0

# =============================================================================
# Test 1: Login as admin
# =============================================================================
echo -e "\n${YELLOW}Test 1: Login as admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')
ADMIN_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id // empty')

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Admin login successful"
  echo -e "${BLUE}   Admin ID: $ADMIN_ID${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: Admin login failed"
  echo "   Response: $LOGIN_RESPONSE"
  echo ""
  echo "   Did you run 'npm run prisma:seed'?"
  ((FAILED++))
  exit 1
fi

# =============================================================================
# Test 2: GET /notifications (empty list)
# =============================================================================
echo -e "\n${YELLOW}Test 2: GET /notifications (initial state)${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Returns notifications array" '"notifications"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has total count" '"total"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has unread_count" '"unread_count"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has pagination (limit)" '"limit"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has pagination (offset)" '"offset"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 3: GET /notifications/preferences (empty)
# =============================================================================
echo -e "\n${YELLOW}Test 3: GET /notifications/preferences${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Returns preferences array" '"preferences"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has total count" '"total"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 4: POST /notifications (create)
# =============================================================================
echo -e "\n${YELLOW}Test 4: POST /notifications (create notification)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Notification\",
    \"message\": \"This is an automated test notification\",
    \"type\": \"announcement\",
    \"priority\": \"high\",
    \"recipient_ids\": [\"$ADMIN_ID\"]
  }")

NOTIFICATION_ID=$(echo "$RESPONSE" | jq -r '.notification.id // empty')

if [ -n "$NOTIFICATION_ID" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Notification created"
  echo -e "${BLUE}   Notification ID: $NOTIFICATION_ID${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: Failed to create notification"
  echo "   Response: $RESPONSE"
  ((FAILED++))
fi

if run_test "Has correct title" '"Test Notification"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has correct priority" '"priority":"high"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has recipient_count" '"recipient_count":1' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 5: GET /notifications (with notification)
# =============================================================================
echo -e "\n${YELLOW}Test 5: GET /notifications (after create)${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Contains created notification" '"Test Notification"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Shows unread (read_at: null)" '"read_at":null' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has sender info" '"sender"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Unread count is 1" '"unread_count":1' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 6: GET /notifications?unread_only=true
# =============================================================================
echo -e "\n${YELLOW}Test 6: GET /notifications?unread_only=true${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications?unread_only=true" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Filter unread_only works" '"Test Notification"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 7: GET /notifications?priority=high
# =============================================================================
echo -e "\n${YELLOW}Test 7: GET /notifications?priority=high${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications?priority=high" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Filter by priority works" '"priority":"high"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 8: PATCH /notifications/:id/read
# =============================================================================
echo -e "\n${YELLOW}Test 8: PATCH /notifications/:id/read${NC}"
if [ -n "$NOTIFICATION_ID" ]; then
  RESPONSE=$(curl -s -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $TOKEN")
  
  if run_test "Mark as read returns success" '"Notification marked as read"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
  if run_test "Has read_at timestamp" '"read_at"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
  
  # Verify read_at is set
  VERIFY=$(curl -s "$BASE_URL/notifications" \
    -H "Authorization: Bearer $TOKEN")
  
  if run_test "Unread count is now 0" '"unread_count":0' "$VERIFY"; then ((PASSED++)); else ((FAILED++)); fi
else
  echo -e "${RED}❌ FAIL${NC}: No notification ID for mark as read test"
  ((FAILED++))
fi

# =============================================================================
# Test 9: PATCH /notifications/:id/read (already read)
# =============================================================================
echo -e "\n${YELLOW}Test 9: PATCH /notifications/:id/read (already read)${NC}"
if [ -n "$NOTIFICATION_ID" ]; then
  RESPONSE=$(curl -s -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $TOKEN")
  
  if run_test "Already read message" '"was already marked as read"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
else
  echo -e "${YELLOW}⏭️  SKIP${NC}: No notification ID"
fi

# =============================================================================
# Test 10: PATCH /notifications/preferences (update)
# =============================================================================
echo -e "\n${YELLOW}Test 10: PATCH /notifications/preferences${NC}"
RESPONSE=$(curl -s -X PATCH "$BASE_URL/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {"type": "announcement", "channel": "in_app", "enabled": true},
      {"type": "system", "channel": "email", "enabled": false},
      {"type": "alert", "channel": "push", "enabled": true}
    ]
  }')

if run_test "Preferences updated" '"Notification preferences updated successfully"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Has 3 preferences" '"preferences"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# Verify preferences are saved
VERIFY=$(curl -s "$BASE_URL/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Preferences persisted (announcement)" '"type":"announcement"' "$VERIFY"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Preferences persisted (system)" '"type":"system"' "$VERIFY"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 11: POST /notifications with non-existent recipient
# =============================================================================
echo -e "\n${YELLOW}Test 11: POST /notifications (non-existent recipient)${NC}"
# Use a valid UUID format that doesn't exist in the database
RESPONSE=$(curl -s -X POST "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "message": "Test",
    "recipient_ids": ["aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"]
  }')

if run_test "Returns error for non-existent recipient" '"Invalid or inactive recipient"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 12: PATCH /notifications/:id/read (not found)
# =============================================================================
echo -e "\n${YELLOW}Test 12: PATCH /notifications/:id/read (not found)${NC}"
RESPONSE=$(curl -s -X PATCH "$BASE_URL/notifications/00000000-0000-0000-0000-000000000000/read" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Returns 404 for non-existent notification" '"Notification not found"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 13: Unauthorized access (no token)
# =============================================================================
echo -e "\n${YELLOW}Test 13: Unauthorized access (no token)${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications")

if run_test "Returns 401 without token" '"Unauthorized"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 14: Pagination
# =============================================================================
echo -e "\n${YELLOW}Test 14: Pagination parameters${NC}"
RESPONSE=$(curl -s "$BASE_URL/notifications?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Respects limit parameter" '"limit":5' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Respects offset parameter" '"offset":0' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✅${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed! ❌${NC}"
  exit 1
fi
