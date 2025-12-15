# Admin Login Page Guide

## ✅ New Admin Login Page Created

A separate admin login page has been created at:
**`/admin/admin-login`**

## 🔗 Access URLs

### Admin Login
- **URL:** `http://localhost:3000/admin/admin-login`
- **Purpose:** Dedicated login page for admin users only
- **Features:**
  - Validates that user is admin before allowing access
  - Redirects to admin dashboard on success
  - Shows error if non-admin tries to login

### Agent Login (Regular)
- **URL:** `http://localhost:3000/login`
- **Purpose:** Login page for agents
  - If admin tries to login here, they'll be redirected to admin login page

## 📋 How to Use

### Step 1: Access Admin Login Page

1. **Open browser**
2. **Go to:** `http://localhost:3000/admin/admin-login`
3. **You'll see:** A dedicated admin login form

### Step 2: Login

1. **Enter admin email** (the email you used when creating admin)
2. **Enter admin password**
3. **Click "Login as Admin"**
4. **You'll be redirected to:** `/admin/dashboard`

### Step 3: Access Admin Features

Once logged in, you can access:
- **Dashboard:** `http://localhost:3000/admin/dashboard`
- **Properties:** `http://localhost:3000/admin/properties`
- **Agents:** `http://localhost:3000/admin/users`
- **MLM Tree:** `http://localhost:3000/admin/mlm-tree`
- **Sales:** `http://localhost:3000/admin/sales`
- **Commissions:** `http://localhost:3000/admin/commissions`
- **Withdrawals:** `http://localhost:3000/admin/withdrawals`

## 🔒 Security Features

- **Role Validation:** Only users with `admin` role can login
- **Automatic Redirect:** Non-admin users get error message
- **Separate Route:** Admin login is separate from agent login
- **Clear Indication:** Page clearly shows "Admin Login"

## 📝 Page Features

- Clean, professional design
- Clear "Admin Login" branding
- Link to agent login page
- Security notice about admin-only access
- Automatic redirect to admin dashboard on success

## 🔄 Flow Diagram

```
User visits /admin/admin-login
    ↓
Enter admin credentials
    ↓
System validates role = admin
    ↓
If admin → Redirect to /admin/dashboard
If not admin → Show error message
```

## 💡 Benefits

1. **Better Security:** Separate login page for admins
2. **Clear Separation:** Agents and admins have different login pages
3. **Professional:** Dedicated admin interface
4. **Easy Access:** Direct URL: `/admin/admin-login`

## 🚀 Quick Start

1. **Make sure servers are running:**
   - Backend: `npm run dev` (in backend folder)
   - Frontend: `npm run dev` (in frontend folder)

2. **Go to admin login:**
   ```
   http://localhost:3000/admin/admin-login
   ```

3. **Login with admin credentials**

4. **Start managing properties!**

