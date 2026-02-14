#!/bin/bash
# =============================================================================
# Test script for Teacher Endpoints
# Usage: ./scripts/test-teacher-endpoints.sh [PORT]
# Default port: 3001
# =============================================================================

PORT=${1:-3001}
BASE_URL="http://localhost:$PORT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing Teacher Endpoints"
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
# Test 1: Login as teacher
# =============================================================================
echo -e "\n${YELLOW}Test 1: Login as teacher${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "Teacher123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Teacher login successful"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: Teacher login failed"
  echo "   Response: $LOGIN_RESPONSE"
  echo ""
  echo "   Did you run 'npm run prisma:seed'?"
  ((FAILED++))
  exit 1
fi

# =============================================================================
# Test 2: GET /teacher/institutions
# =============================================================================
echo -e "\n${YELLOW}Test 2: GET /teacher/institutions${NC}"
RESPONSE=$(curl -s "$BASE_URL/teacher/institutions" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Returns institutions array" '"institutions"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Contains Test Institution" '"Test Institution"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Contains role_context" '"role_context"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 3: GET /teacher/classrooms
# =============================================================================
echo -e "\n${YELLOW}Test 3: GET /teacher/classrooms${NC}"
RESPONSE=$(curl -s "$BASE_URL/teacher/classrooms" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Returns classrooms array" '"classrooms"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Contains Math 101" '"Math 101 - Section A"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Contains role: teacher" '"role":"teacher"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
if run_test "Contains subject info" '"subject"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 4: GET /teacher/classrooms with institution_id filter
# =============================================================================
echo -e "\n${YELLOW}Test 4: GET /teacher/classrooms?institution_id=...${NC}"

# Get institution ID from previous response
INST_ID=$(curl -s "$BASE_URL/teacher/institutions" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.institutions[0].id // empty')

if [ -n "$INST_ID" ]; then
  RESPONSE=$(curl -s "$BASE_URL/teacher/classrooms?institution_id=$INST_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if run_test "Filter by institution_id works" '"classrooms"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
else
  echo -e "${RED}❌ FAIL${NC}: Could not get institution ID for filter test"
  ((FAILED++))
fi

# =============================================================================
# Test 5: Validation - invalid UUID
# =============================================================================
echo -e "\n${YELLOW}Test 5: Validation - invalid UUID${NC}"
RESPONSE=$(curl -s "$BASE_URL/teacher/classrooms?institution_id=invalid-uuid" \
  -H "Authorization: Bearer $TOKEN")

if run_test "Returns 400 for invalid UUID" '"institution_id must be a valid UUID"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 6: Unauthorized access (no token)
# =============================================================================
echo -e "\n${YELLOW}Test 6: Unauthorized access (no token)${NC}"
RESPONSE=$(curl -s "$BASE_URL/teacher/institutions")

if run_test "Returns 401 without token" '"Unauthorized"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi

# =============================================================================
# Test 7: Student cannot access teacher endpoints
# =============================================================================
echo -e "\n${YELLOW}Test 7: Non-teacher role access${NC}"

# First, check if we have a student user, if not skip this test
STUDENT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "student@test.com", "password": "Student123!"}')

STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | jq -r '.access_token // empty')

if [ -n "$STUDENT_TOKEN" ]; then
  RESPONSE=$(curl -s "$BASE_URL/teacher/institutions" \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  
  if run_test "Student gets 403 Forbidden" '"Teacher access required"' "$RESPONSE"; then ((PASSED++)); else ((FAILED++)); fi
else
  echo -e "${YELLOW}⏭️  SKIP${NC}: No student user for role test (add one to seed if needed)"
fi

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
