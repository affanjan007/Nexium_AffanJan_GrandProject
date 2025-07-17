#!/bin/bash

# Test API Script for AI-Powered Recipe Generator
# Make sure to replace YOUR_JWT_TOKEN with the actual token from the test page

echo "Testing API Endpoints"
echo "========================"

# Test 1: Check auth status without token
echo "1. Testing /api/auth without token:"
curl -s http://localhost:3000/api/auth | jq .
echo ""

# Test 2: Test recipes endpoint without token (should fail)
echo "2. Testing /api/recipes without token (should fail):"
curl -s http://localhost:3000/api/recipes | jq .
echo ""

# Test 3: Test with JWT token (replace YOUR_JWT_TOKEN)
echo "3. Testing /api/auth with JWT token:"
echo "Replace YOUR_JWT_TOKEN with the token from the test page"
curl -s http://localhost:3000/api/auth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
echo ""

# Test 4: Test recipes endpoint with JWT token
echo "4. Testing /api/recipes with JWT token:"
curl -s http://localhost:3000/api/recipes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
echo ""

# Test 5: Create a test recipe
echo "5. Creating a test recipe:"
curl -s -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Recipe",
    "description": "A test recipe created via API",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "steps": ["Step 1: Do something", "Step 2: Do something else", "Step 3: Enjoy!"]
  }' | jq .
echo ""

echo "API testing complete!"
echo ""
echo "To get your JWT token:"
echo "1. Go to http://localhost:3000/test-auth"
echo "2. Enter your email and click 'Send Magic Link'"
echo "3. Check your email and click the magic link"
echo "4. Copy the JWT token from the page"
echo "5. Replace 'YOUR_JWT_TOKEN' in this script with your actual token" 