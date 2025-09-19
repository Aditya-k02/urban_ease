# Middleware Documentation - Community Management System
## For Viva and Presentation

---

## 🏗️ Overview

This project uses **12 key middlewares** to handle authentication, authorization, validation, security, and performance optimization.

---

## 1. **RBAC Middleware (Role-Based Access Control)**

### 📍 **Location**: `Server/middleware/rbac.js`

### **Purpose**:
- Implements fine-grained permission-based access control
- Controls what each role can do (read, write, delete operations)
- Provides granular permissions beyond simple role checking

### **Key Features**:
```javascript
// Permission Matrix
- 'super-admin': ['*'] // All permissions
- 'admin': ['read:communities', 'write:communities', 'delete:users', etc.]
- 'support': ['read:communities', 'write:issues', 'write:applications']
```

### **Main Functions**:
- `hasPermission(role, permission)` - Checks if a role has specific permission
- `requirePermission(permission)` - Express middleware to enforce permissions

### **Usage in Code**:
```javascript
// File: Server/routes/adminRouter.js (Lines 50-60)
AdminRouter.get('/api/communities', requirePermission('read:communities'), getAllCommunities);
AdminRouter.post('/api/communities', requirePermission('write:communities'), createCommunity);
AdminRouter.delete('/api/communities/:id', requirePermission('delete:critical'), deleteCommunity);
```

### **Key Permissions**:
| Permission | Role | Purpose |
|-----------|------|---------|
| `read:communities` | admin, support | View community data |
| `write:communities` | admin | Create/update communities |
| `delete:critical` | super-admin only | Delete critical resources |
| `read:analytics` | admin | Access analytics dashboard |
| `read:payments` | admin | View payment records |

---

## 2. **Authorization Middleware**

### 📍 **Location**: `Server/controllers/authorization.js`

### **Purpose**:
- Verifies user type/role for route access
- Handles role-specific authorization
- Redirects unauthorized users to login pages

### **Main Functions**:
```javascript
// Specific role authorizers
- authorizeA → Authorizes 'admin' users
- authorizeR → Authorizes 'Resident' users
- authorizeS → Authorizes 'Security' users
- authorizeW → Authorizes 'Worker' users
- authorizeC → Authorizes 'CommunityManager' users

// Generic role authorizer
- authorizeRoles(['admin', 'CommunityManager']) → Multi-role authorization
```

### **Usage in Code**:
```javascript
// File: Server/server.js (Lines 245-251)
app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, residentRouter);
app.use("/security", auth, authorizeS, securityRouter);
app.use("/worker", auth, authorizeW, workerRouter);
app.use("/manager", auth, authorizeC, managerRouter);
```

### **How it Works**:
1. Checks `req.user.userType` 
2. Compares against required role
3. Returns 403 JSON (for API) or redirects to login page

---

## 3. **Validation Middleware**

### 📍 **Location**: `Server/middleware/validation.js`

### **Purpose**:
- Validates incoming request data using `express-validator`
- Sanitizes user inputs to prevent injection attacks
- Returns structured error messages

### **Main Validators**:

#### **validateCommunity** (Lines 23-45):
```javascript
- Community name: 3-100 characters, escaped
- Email: Must be valid email, normalized
- Location: 5-200 characters, escaped
- Contact: Must be valid 10-digit phone number
```

#### **validateUser** (Lines 50-66):
```javascript
- Name: 2-100 characters (optional)
- Email: Valid email, normalized
- Contact: Valid 10-digit phone number (optional)
```

#### **validateLogin** (Lines 71-81):
```javascript
- Email: Valid email required
- Password: Minimum 6 characters
```

#### **validatePasswordChange** (Lines 86-102):
```javascript
- Current password: Required
- New password: Min 8 characters
  - Must contain uppercase letter
  - Must contain lowercase letter
  - Must contain number or special character (!@#$%^&*)
```

### **Usage in Code**:
```javascript
// File: Server/routes/adminRouter.js
AdminRouter.post('/api/communities', 
  requirePermission('write:communities'), 
  validateCommunity,  // Validation applied here
  createCommunity
);
```

### **Error Handling**:
Returns 400 status with structured errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {"field": "email", "message": "Valid email is required"}
  ]
}
```

---

## 4. **Subscription Status Middleware**

### 📍 **Location**: `Server/middleware/subcriptionStatus.js`

### **Purpose**:
- Checks if a community's subscription is active
- Blocks access to features if subscription is inactive/expired
- Allows admins and managers to bypass the check

### **Key Features**:
```javascript
// Excludes routes:
- /login, /logout, /subscription-expired
- Static assets: /css/, /js/, /images/

// Skips check for:
- Unauthenticated users
- Admins
- Community Managers

// Blocks access for others with 402 status (Payment Required)
```

### **Usage in Code**:
```javascript
// File: Server/routes/residentRouter.js (Line 42)
residentRouter.use(checkSubscriptionStatus);
```

### **Response When Blocked**:
```json
{
  "success": false,
  "code": "SUBSCRIPTION_EXPIRED",
  "message": "Community subscription is inactive or expired",
  "subscriptionStatus": "inactive"
}
```

---

## 5. **Authentication Middleware**

### 📍 **Location**: `Server/controllers/auth.js`

### **Purpose**:
- Verifies JWT tokens in cookies or Authorization header
- Decodes and attaches user data to `req.user`
- Blocks access if token is invalid/missing

### **Token Structure**:
```javascript
{
  id: userId,
  email: userEmail,
  userType: "admin" | "Resident" | "CommunityManager" | "Worker" | "Security",
  community: communityId (optional)
}
```

### **Usage in Code**:
```javascript
// File: Server/server.js (Lines 245-251)
app.use("/admin", auth, authorizeA, AdminRouter);  // auth middleware applied first
app.use("/resident", auth, authorizeR, residentRouter);
```

### **Where It Attaches User Data**:
- `req.user` object is populated
- Used by RBAC and Authorization middlewares

---

## 6. **Rate Limiting Middleware**

### 📍 **Location**: `Server/server.js` (Lines 210-240)

### **Purpose**:
- Prevents brute force attacks on login endpoints
- Limits OTP requests to prevent spam
- Protects API from abuse

### **Two Rate Limiters**:

#### **AuthLimiter**:
```javascript
- Window: 15 minutes
- Max attempts: 5 login tries
- Applies to: Authentication endpoints
- Returns: 429 Too Many Requests
```

#### **OtpLimiter**:
```javascript
- Window: 5 minutes
- Max attempts: 3 OTP requests
- Applies to: OTP request endpoints
- Returns: 429 Too Many Requests
```

### **Usage in Code**:
```javascript
// File: Server/server.js (Line 300)
app.post("/resident-register/request-otp", otpLimiter, async (req, res) => {
  // OTP request logic
});
```

### **Response**:
```json
{
  "success": false,
  "message": "Too many login attempts, please try again after 15 minutes"
}
```

---

## 7. **Helmet Middleware (Security Headers)**

### 📍 **Location**: `Server/server.js` (Lines 235-238)

### **Purpose**:
- Adds security headers to all responses
- Protects against common web vulnerabilities
- Sets Content Security Policy, X-Frame-Options, etc.

### **Configuration**:
```javascript
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled for compatibility
  crossOriginEmbedderPolicy: false
}));
```

### **Headers Added**:
| Header | Purpose |
|--------|---------|
| `X-Frame-Options` | Prevents clickjacking |
| `X-Content-Type-Options` | Prevents MIME type sniffing |
| `Strict-Transport-Security` | Forces HTTPS |
| `X-XSS-Protection` | XSS attack protection |

---

## 8. **CORS Middleware (Cross-Origin Resource Sharing)**

### 📍 **Location**: `Server/server.js` (Lines 248-254)

### **Purpose**:
- Allows requests from frontend (React on localhost:5173)
- Controls which origins can access the API
- Enables credential/cookie sharing

### **Configuration**:
```javascript
app.use(cors({
  origin: "http://localhost:5173",  // Frontend URL
  credentials: true                 // Allow cookies
}));
```

### **Usage**:
- Frontend can make requests to backend
- Cookies are automatically sent with requests

---

## 9. **Compression Middleware**

### 📍 **Location**: `Server/server.js` (Line 233)

### **Purpose**:
- Compresses response bodies (gzip)
- Reduces bandwidth usage
- Improves response times

### **Configuration**:
```javascript
app.use(compression());
```

### **Effect**:
- Large JSON responses are automatically compressed
- Faster API responses
- Reduced data transfer

---

## 10. **Session Middleware**

### 📍 **Location**: `Server/server.js` (Lines 239-245)

### **Purpose**:
- Manages user sessions
- Stores session state

### **Configuration**:
```javascript
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
```

---

## 11. **Cookie Parser Middleware**

### 📍 **Location**: `Server/server.js` (Line 256)

### **Purpose**:
- Parses incoming cookies
- Makes cookies accessible via `req.cookies`
- Used to extract JWT tokens from httpOnly cookies

### **Configuration**:
```javascript
app.use(cookieParser());
```

### **Usage**:
```javascript
// JWT token extracted from cookies in auth middleware
const token = req.cookies.token;
```

---

## 12. **Multer Middleware (File Upload)**

### 📍 **Location**: 
- `Server/routes/adminRouter.js` (Lines 36-40)
- Used in various controllers

### **Purpose**:
- Handles file uploads (images, documents)
- Integrates with Cloudinary for storage
- Limits file sizes

### **Configuration in AdminRouter**:
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB limit
});
```

### **Usage**:
```javascript
// Applied to routes that accept file uploads
import upload from multer config
// router.post('/upload', upload.single('file'), controller);
```

---

## 📊 Middleware Chain Flow

```
Request comes in
    ↓
[Helmet] - Add security headers
    ↓
[Compression] - Prepare compression
    ↓
[CORS] - Check origin
    ↓
[Session] - Load session
    ↓
[CookieParser] - Parse cookies
    ↓
[Express.json/urlencoded] - Parse body
    ↓
[CacheControl] - Add cache headers
    ↓
[Auth] - Verify JWT token
    ↓
[Authorization] - Check user role
    ↓
[SubscriptionStatus] - Check subscription (selected routes)
    ↓
[Validation] - Validate input data
    ↓
[RBAC] - Check permissions
    ↓
[RateLimit] - Check rate limit (auth routes)
    ↓
[Controller] - Handle request
    ↓
Response sent
```

---

## 📍 Quick Reference: Middleware Location Map

| Middleware | File | Lines | Routes Used |
|-----------|------|-------|------------|
| Helmet | server.js | 235-238 | Global |
| Compression | server.js | 233 | Global |
| CORS | server.js | 248-254 | Global |
| Session | server.js | 239-245 | Global |
| CookieParser | server.js | 256 | Global |
| Auth | auth.js | - | /admin, /resident, /security, /worker, /manager |
| Authorization | authorization.js | - | /admin, /resident, /security, /worker, /manager |
| SubscriptionStatus | subcriptionStatus.js | - | residentRouter |
| RBAC | rbac.js | - | Admin routes |
| Validation | validation.js | - | Post/Put routes |
| RateLimit | server.js | 210-240 | /resident-register/request-otp |
| Multer | adminRouter.js | 36-40 | File upload routes |

---

## 🎯 Key Security Principles Implemented

1. **Defense in Depth**: Multiple layers of security (Auth → Authorization → RBAC → Validation)
2. **Rate Limiting**: Prevents brute force and spam attacks
3. **Input Validation**: All user inputs validated and sanitized
4. **Role-Based Access**: Fine-grained permission checks
5. **Security Headers**: Helmet protects against common web vulnerabilities
6. **Subscription Enforcement**: Blocks access for inactive subscriptions
7. **CORS Control**: Only allows requests from trusted frontend

---

## 💡 Interview Tips for Viva

### **Questions You May Be Asked**:

1. **"Why do you use multiple authorization layers?"**
   - Answer: Defense in depth - Auth verifies identity, Authorization checks role, RBAC checks specific permissions

2. **"How does RBAC differ from simple role checks?"**
   - Answer: RBAC provides granular permissions (read:communities vs write:communities), not just role-based access

3. **"What happens when subscription expires?"**
   - Answer: SubscriptionStatus middleware returns 402 Payment Required error, blocking further access

4. **"Why is rate limiting important?"**
   - Answer: Prevents brute force attacks and spam. Auth endpoints are limited to 5 attempts per 15 minutes

5. **"How are JWT tokens extracted?"**
   - Answer: From httpOnly cookies via Cookie Parser, then verified by Auth middleware, token attached to req.user

6. **"What's the purpose of validation middleware?"**
   - Answer: Sanitizes and validates all inputs before they reach controllers, preventing injection attacks

---

## 📝 Summary Table

| # | Middleware | Purpose | Priority | Response on Failure |
|---|-----------|---------|----------|-------------------|
| 1 | Helmet | Security headers | HIGH | Error headers added |
| 2 | Compression | Performance | MEDIUM | Compressed responses |
| 3 | CORS | Cross-origin control | HIGH | 403 Forbidden |
| 4 | Session | Session management | MEDIUM | Session created |
| 5 | CookieParser | Parse cookies | HIGH | Cookie extraction |
| 6 | Auth | JWT verification | CRITICAL | 401 Unauthorized |
| 7 | Authorization | Role check | CRITICAL | 403 Forbidden |
| 8 | SubscriptionStatus | Subscription check | HIGH | 402 Payment Required |
| 9 | Validation | Input validation | HIGH | 400 Bad Request |
| 10 | RBAC | Permission check | CRITICAL | 403 Permission Denied |
| 11 | RateLimit | Abuse prevention | MEDIUM | 429 Too Many Requests |
| 12 | Multer | File upload | LOW | 413 Payload Too Large |

