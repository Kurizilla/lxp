#!/bin/bash

# Test script for M09 Calendar and Modo Clase endpoints
# Usage: ./scripts/test-calendar-modo-clase-endpoints.sh [port]

PORT=${1:-3001}
BASE_URL="http://localhost:$PORT"

echo "============================================"
echo "Testing M09 Calendar & Modo Clase Endpoints"
echo "Base URL: $BASE_URL"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0

check_result() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$expected" == "$actual" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name (HTTP $actual)"
        PASSED=$((PASSED+1))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name (Expected $expected, got $actual)"
        FAILED=$((FAILED+1))
    fi
}

# Step 1: Login as teacher
echo -e "${YELLOW}Step 1: Login as teacher${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "Teacher123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
TEACHER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Teacher login successful"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}❌ FAIL${NC}: Teacher login failed"
    echo "Response: $LOGIN_RESPONSE"
    echo "Make sure the server is running and seed data exists (npm run db:setup)"
    exit 1
fi
echo ""

# Get classroom ID from teacher's classrooms
echo -e "${YELLOW}Step 2: Get teacher's classrooms${NC}"
CLASSROOMS_RESPONSE=$(curl -s "$BASE_URL/teacher/classrooms" \
  -H "Authorization: Bearer $TOKEN")

CLASSROOM_ID=$(echo $CLASSROOMS_RESPONSE | jq -r '.classrooms[0].id // empty')

if [ -n "$CLASSROOM_ID" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Got classroom ID: $CLASSROOM_ID"
    PASSED=$((PASSED+1))
else
    echo -e "${YELLOW}⚠️ WARN${NC}: No classrooms found. Creating test data..."
    # Get institution ID first
    INST_RESPONSE=$(curl -s "$BASE_URL/teacher/institutions" \
      -H "Authorization: Bearer $TOKEN")
    INSTITUTION_ID=$(echo $INST_RESPONSE | jq -r '.institutions[0].id // empty')
    
    if [ -z "$INSTITUTION_ID" ]; then
        echo -e "${RED}❌ FAIL${NC}: No institutions found. Run npm run db:setup first."
        exit 1
    fi
fi
echo ""

# ============================================
# CALENDAR TESTS
# ============================================
echo -e "${YELLOW}========== CALENDAR TESTS ==========${NC}"
echo ""

# Test: Assign calendar to classroom
echo -e "${YELLOW}Test: POST /m09/calendar/assign${NC}"
CALENDAR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/calendar/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"classroom_id\": \"$CLASSROOM_ID\",
    \"name\": \"Test Calendar\",
    \"description\": \"Calendar for testing\",
    \"timezone\": \"America/Mexico_City\"
  }")

HTTP_CODE=$(echo "$CALENDAR_RESPONSE" | tail -n1)
BODY=$(echo "$CALENDAR_RESPONSE" | sed '$d')
CALENDAR_ID=$(echo $BODY | jq -r '.calendar.id // empty')

# Accept 201 (created) or 409 (already exists)
if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "409" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Assign calendar (HTTP $HTTP_CODE)"
    PASSED=$((PASSED+1))
    
    if [ "$HTTP_CODE" == "409" ]; then
        # Calendar exists, get it
        CAL_BY_CLASSROOM=$(curl -s "$BASE_URL/m09/calendar/by-classroom?classroom_id=$CLASSROOM_ID" \
          -H "Authorization: Bearer $TOKEN")
        CALENDAR_ID=$(echo $CAL_BY_CLASSROOM | jq -r '.id // empty')
    fi
else
    check_result "201" "$HTTP_CODE" "Assign calendar"
fi
echo "Calendar ID: $CALENDAR_ID"
echo ""

# Test: Get calendar by classroom
echo -e "${YELLOW}Test: GET /m09/calendar/by-classroom${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/calendar/by-classroom?classroom_id=$CLASSROOM_ID" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "Get calendar by classroom"
echo ""

# Test: Update calendar
echo -e "${YELLOW}Test: PATCH /m09/calendar/:id${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/m09/calendar/$CALENDAR_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Calendar Name"}')
check_result "200" "$HTTP_CODE" "Update calendar"
echo ""

# Test: Create calendar event
echo -e "${YELLOW}Test: POST /m09/calendar/events${NC}"
START_TIME=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -v+1H +"%Y-%m-%dT%H:%M:%S.000Z")
END_TIME=$(date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -v+2H +"%Y-%m-%dT%H:%M:%S.000Z")

EVENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/calendar/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"Test Class Event\",
    \"description\": \"A test class session event\",
    \"event_type\": \"class_session\",
    \"start_time\": \"$START_TIME\",
    \"end_time\": \"$END_TIME\",
    \"location\": \"Room 101\"
  }")

HTTP_CODE=$(echo "$EVENT_RESPONSE" | tail -n1)
BODY=$(echo "$EVENT_RESPONSE" | sed '$d')
EVENT_ID=$(echo $BODY | jq -r '.event.id // empty')
check_result "201" "$HTTP_CODE" "Create calendar event"
echo "Event ID: $EVENT_ID"
echo ""

# Test: List events
echo -e "${YELLOW}Test: GET /m09/calendar/events${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/calendar/events?calendar_id=$CALENDAR_ID" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "List calendar events"
echo ""

# Test: Update event
echo -e "${YELLOW}Test: PATCH /m09/calendar/events/:id${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/m09/calendar/events/$EVENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Event Title"}')
check_result "200" "$HTTP_CODE" "Update calendar event"
echo ""

# ============================================
# MODO CLASE (SESSION) TESTS
# ============================================
echo -e "${YELLOW}========== MODO CLASE TESTS ==========${NC}"
echo ""

# Test: Create session
echo -e "${YELLOW}Test: POST /m09/modo-clase/sessions${NC}"
SESSION_START=$(date -u -d "+30 minutes" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -v+30M +"%Y-%m-%dT%H:%M:%S.000Z")
SESSION_END=$(date -u -d "+90 minutes" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -v+90M +"%Y-%m-%dT%H:%M:%S.000Z")

SESSION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/modo-clase/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"classroom_id\": \"$CLASSROOM_ID\",
    \"title\": \"Test Live Session\",
    \"description\": \"A test modo clase session\",
    \"scheduled_start\": \"$SESSION_START\",
    \"scheduled_end\": \"$SESSION_END\",
    \"max_participants\": 30
  }")

HTTP_CODE=$(echo "$SESSION_RESPONSE" | tail -n1)
BODY=$(echo "$SESSION_RESPONSE" | sed '$d')
SESSION_ID=$(echo $BODY | jq -r '.session.id // empty')
check_result "201" "$HTTP_CODE" "Create class session"
echo "Session ID: $SESSION_ID"
echo ""

# Test: List sessions
echo -e "${YELLOW}Test: GET /m09/modo-clase/sessions${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/modo-clase/sessions?classroom_id=$CLASSROOM_ID" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "List class sessions"
echo ""

# Test: Get session by ID
echo -e "${YELLOW}Test: GET /m09/modo-clase/sessions/:id${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/modo-clase/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "Get session by ID"
echo ""

# Test: Start session
echo -e "${YELLOW}Test: POST /m09/modo-clase/sessions/start${NC}"
START_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/m09/modo-clase/sessions/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\"}")

HTTP_CODE=$(echo "$START_RESPONSE" | tail -n1)
BODY=$(echo "$START_RESPONSE" | sed '$d')
JOIN_CODE=$(echo $BODY | jq -r '.join_code // empty')
check_result "200" "$HTTP_CODE" "Start session"
echo "Join Code: $JOIN_CODE"
echo ""

# Test: Get session details (with participants)
echo -e "${YELLOW}Test: GET /m09/modo-clase/sessions/:id/details${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/modo-clase/sessions/$SESSION_ID/details" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "Get session details"
echo ""

# Test: Join session with code
echo -e "${YELLOW}Test: POST /m09/modo-clase/join${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/m09/modo-clase/join" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"join_code\": \"$JOIN_CODE\"}")
check_result "200" "$HTTP_CODE" "Join session"
echo ""

# Test: Pause session
echo -e "${YELLOW}Test: POST /m09/modo-clase/sessions/change-state (pause)${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/m09/modo-clase/sessions/change-state" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"new_state\": \"paused\", \"reason\": \"Break time\"}")
check_result "200" "$HTTP_CODE" "Pause session"
echo ""

# Test: Resume session
echo -e "${YELLOW}Test: POST /m09/modo-clase/sessions/change-state (resume)${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/m09/modo-clase/sessions/change-state" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"new_state\": \"active\"}")
check_result "200" "$HTTP_CODE" "Resume session"
echo ""

# Test: Get state history
echo -e "${YELLOW}Test: GET /m09/modo-clase/sessions/:id/state-history${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/modo-clase/sessions/$SESSION_ID/state-history" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "Get state history"
echo ""

# Test: End session
echo -e "${YELLOW}Test: POST /m09/modo-clase/sessions/change-state (end)${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/m09/modo-clase/sessions/change-state" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"new_state\": \"ended\", \"reason\": \"Session completed\"}")
check_result "200" "$HTTP_CODE" "End session"
echo ""

# Test: Delete calendar event (cleanup)
echo -e "${YELLOW}Test: DELETE /m09/calendar/events/:id${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/m09/calendar/events/$EVENT_ID" \
  -H "Authorization: Bearer $TOKEN")
check_result "200" "$HTTP_CODE" "Delete calendar event"
echo ""

# ============================================
# ERROR HANDLING TESTS
# ============================================
echo -e "${YELLOW}========== ERROR HANDLING TESTS ==========${NC}"
echo ""

# Test: 401 without token
echo -e "${YELLOW}Test: Unauthorized access (no token)${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/calendario/events")
check_result "401" "$HTTP_CODE" "Unauthorized access"
echo ""

# Test: 404 for non-existent session
echo -e "${YELLOW}Test: 404 for non-existent session${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/m09/modo-clase/sessions/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN")
check_result "404" "$HTTP_CODE" "Non-existent session"
echo ""

# Test: Invalid join code
echo -e "${YELLOW}Test: Invalid join code${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/m09/modo-clase/join" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"join_code": "INVALID"}')
check_result "404" "$HTTP_CODE" "Invalid join code"
echo ""

# ============================================
# SUMMARY
# ============================================
echo ""
echo "============================================"
echo "                 SUMMARY"
echo "============================================"
echo -e "Tests passed: ${GREEN}$PASSED${NC}"
echo -e "Tests failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED+FAILED))
echo "Total tests: $TOTAL"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}All tests passed! ✅${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}Some tests failed! ❌${NC}"
    exit 1
fi
