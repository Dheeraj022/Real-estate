# How to Access Admin Dashboard

## Step 1: Create an Admin User

If you don't have an admin account yet, create one:

### Method 1: Using the Script (Recommended)

1. **Open Command Prompt or PowerShell**
2. **Navigate to backend folder:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   ```
3. **Run the admin creation script:**
   ```cmd
   node scripts/create-admin.js
   ```
4. **Enter details when prompted:**
   - Admin name: (e.g., "Admin User")
   - Admin email: (e.g., "admin@example.com")
   - Admin password: (choose a strong password)
5. **Note your credentials** - you'll need them to login!

### Method 2: Using Prisma Studio

1. **Open Command Prompt in backend folder**
2. **Run:**
   ```cmd
   npm run prisma:studio
   ```
3. **Prisma Studio opens in browser**
4. **Go to User table**
5. **Click "Add record"**
6. **Fill in:**
   - `name`: Your admin name
   - `email`: Your admin email
   - `password`: (You need to hash it with bcrypt - use script instead)
   - `role`: `admin`
   - `level`: `0`
   - `referralCode`: (Will be auto-generated)
7. **Save**

**Note:** Method 1 is easier because it hashes the password automatically.

---

## Step 2: Make Sure Backend Server is Running

1. **Open Command Prompt**
2. **Navigate to backend:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   ```
3. **Start server:**
   ```cmd
   npm run dev
   ```
4. **You should see:** `Server running on port 5000`
5. **Keep this window open!**

---

## Step 3: Make Sure Frontend Server is Running

1. **Open a NEW Command Prompt window**
2. **Navigate to frontend:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\frontend"
   ```
3. **Start frontend:**
   ```cmd
   npm run dev
   ```
4. **You should see:** `Ready on http://localhost:3000`
5. **Keep this window open too!**

---

## Step 4: Login as Admin

1. **Open your browser**
2. **Go to:** `http://localhost:3000/login`
3. **Enter your admin credentials:**
   - Email: (the email you used when creating admin)
   - Password: (the password you set)
4. **Click "Login"**
5. **You'll be automatically redirected to:** `/admin/dashboard`

---

## Step 5: Access Admin Dashboard

Once logged in, you'll see the **Admin Dashboard** with:

### Main Dashboard (`/admin/dashboard`)
- Statistics cards showing:
  - Total Agents
  - Total Properties
  - Total Sales
  - Pending Sales
  - Total Commissions
  - Pending Commissions
  - Total Withdrawals
  - Pending Withdrawals

### Admin Panel Sections (Left Sidebar):

1. **📊 Dashboard** - Overview statistics
2. **🏠 Properties** - Manage properties (Add, Edit, Delete)
3. **👥 Agents** - View all agents
4. **🌳 MLM Tree** - View full MLM hierarchy
5. **💰 Sales** - Approve/reject sales
6. **💵 Commissions** - Approve/reject commissions
7. **💸 Withdrawals** - Approve/reject withdrawal requests

---

## Quick Access URLs

Once logged in as admin, you can directly access:

- **Dashboard:** `http://localhost:3000/admin/dashboard`
- **Properties:** `http://localhost:3000/admin/properties`
- **Agents:** `http://localhost:3000/admin/users`
- **MLM Tree:** `http://localhost:3000/admin/mlm-tree`
- **Sales:** `http://localhost:3000/admin/sales`
- **Commissions:** `http://localhost:3000/admin/commissions`
- **Withdrawals:** `http://localhost:3000/admin/withdrawals`

---

## To Manage Properties

1. **Click "Properties" in the left sidebar**
   OR
   **Go to:** `http://localhost:3000/admin/properties`

2. **You'll see:**
   - List of all properties
   - "Add Property" button at the top

3. **To add a property:**
   - Click "Add Property" button
   - Fill in the form:
     - Property name
     - Location
     - Price
     - Description
     - Commission percentages (Seller %, Level 1 %, Level 2 %)
     - Status (active/inactive)
   - Click "Create"

4. **To edit a property:**
   - Click "Edit" button on any property card
   - Modify the details
   - Click "Update"

5. **To delete a property:**
   - Click "Delete" button on any property card
   - Confirm deletion

---

## Troubleshooting

### "Access denied" or redirected to agent dashboard
- Make sure you're logged in with an admin account
- Check that the user's `role` is set to `admin` in the database

### Can't login
- Verify backend server is running
- Check email and password are correct
- Try creating admin again with the script

### Properties page not loading
- Check backend server is running
- Check browser console for errors (F12)
- Verify you're logged in as admin

---

## Summary

1. ✅ Create admin user: `node scripts/create-admin.js`
2. ✅ Start backend: `npm run dev` (in backend folder)
3. ✅ Start frontend: `npm run dev` (in frontend folder)
4. ✅ Login at: `http://localhost:3000/login`
5. ✅ Access admin dashboard automatically
6. ✅ Click "Properties" to manage properties

