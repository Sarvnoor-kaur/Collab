# 📮 Postman Testing Guide for CollabSphere

## Setup Postman Collection

### 1. Create New Collection
- Open Postman
- Click "New" → "Collection"
- Name it "CollabSphere API"

### 2. Set Collection Variables
- Click on your collection → "Variables" tab
- Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:5000 | http://localhost:5000 |
| token | | (will be set automatically) |

## API Endpoints Testing

### 1️⃣ Register New User

**Request:**
```
Method: POST
URL: {{base_url}}/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTFiMmMzZDRlNWY2ZzdoOGk5ajBrMSIsImlhdCI6MTcwNTMxNDAwMCwiZXhwIjoxNzA1OTE4ODAwfQ.signature",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Tests Script (add in "Tests" tab):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.collectionVariables.set("token", response.token);
    pm.test("Registration successful", () => {
        pm.expect(response.success).to.be.true;
        pm.expect(response.token).to.exist;
    });
}
```

**Error Cases:**

Duplicate Email (400):
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

Validation Error (400):
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Password must be at least 6 characters",
      "param": "password"
    }
  ]
}
```

---

### 2️⃣ Login User

**Request:**
```
Method: POST
URL: {{base_url}}/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Tests Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set("token", response.token);
    pm.test("Login successful", () => {
        pm.expect(response.success).to.be.true;
        pm.expect(response.user.email).to.eql("john@example.com");
    });
}
```

**Error Cases:**

Invalid Credentials (401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 3️⃣ Get Current User (Protected)

**Request:**
```
Method: GET
URL: {{base_url}}/api/auth/me
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Tests Script:**
```javascript
pm.test("User data retrieved", () => {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data).to.have.property("email");
});
```

**Error Cases:**

No Token (401):
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

Invalid Token (401):
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

### 4️⃣ Logout User

**Request:**
```
Method: GET
URL: {{base_url}}/api/auth/logout
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

**Tests Script:**
```javascript
pm.test("Logout successful", () => {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.collectionVariables.set("token", "");
});
```

---

## 🔄 Complete Test Flow

### Scenario 1: New User Registration & Login

1. **Register** → Save token automatically
2. **Get Me** → Verify user data
3. **Logout** → Clear token
4. **Get Me** → Should fail (401)
5. **Login** → Get new token
6. **Get Me** → Should succeed

### Scenario 2: Validation Testing

1. **Register with short password** → Should fail
2. **Register with invalid email** → Should fail
3. **Register with missing fields** → Should fail
4. **Login with wrong password** → Should fail
5. **Login with non-existent email** → Should fail

---

## 🎯 Postman Pre-request Script (Collection Level)

Add this to your collection's "Pre-request Script" tab:

```javascript
// Log request details
console.log(`Making ${pm.request.method} request to ${pm.request.url}`);

// Add timestamp
pm.collectionVariables.set("timestamp", new Date().toISOString());
```

---

## 🧪 Postman Test Script (Collection Level)

Add this to your collection's "Tests" tab:

```javascript
// Log response time
console.log(`Response time: ${pm.response.responseTime}ms`);

// Check response time
pm.test("Response time is less than 2000ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Check response format
pm.test("Response is JSON", () => {
    pm.response.to.be.json;
});
```

---

## 📊 Environment Setup

Create two environments:

### Development Environment
```json
{
  "base_url": "http://localhost:5000",
  "environment": "development"
}
```

### Production Environment
```json
{
  "base_url": "https://your-production-url.com",
  "environment": "production"
}
```

---

## 🔐 Authorization Setup

### Method 1: Collection-level Authorization
1. Click on collection → "Authorization" tab
2. Type: Bearer Token
3. Token: `{{token}}`
4. This applies to all requests in the collection

### Method 2: Individual Request Authorization
1. Click on request → "Authorization" tab
2. Type: Bearer Token
3. Token: `{{token}}`

---

## 📝 Sample Test Users

```json
// Admin User
{
  "name": "Admin User",
  "email": "admin@collabsphere.com",
  "password": "admin123",
  "role": "admin"
}

// Regular User 1
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "alice123"
}

// Regular User 2
{
  "name": "Bob Smith",
  "email": "bob@example.com",
  "password": "bob123"
}
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution:** Ensure backend server is running on port 5000

### Issue: "Token expired"
**Solution:** Login again to get a new token

### Issue: "CORS error"
**Solution:** Check CORS configuration in backend

### Issue: "MongoDB connection failed"
**Solution:** Ensure MongoDB is running

---

## 💡 Pro Tips

1. **Use Collection Runner** for automated testing
2. **Export collection** to share with team
3. **Use environments** to switch between dev/prod
4. **Save responses** as examples for documentation
5. **Use pre-request scripts** for dynamic data generation
6. **Chain requests** using collection variables

---

## 📥 Import Ready-Made Collection

Save this as `CollabSphere.postman_collection.json`:

```json
{
  "info": {
    "name": "CollabSphere API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Import this file into Postman to get started quickly!
