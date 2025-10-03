# 🚀 IMMEDIATE SOLUTION: Clear Your Session

## **Quick Fix (Copy & Paste into Browser Console):**

1. **Open your browser's Developer Tools** (Press F12)
2. **Go to the Console tab**
3. **Copy and paste this code:**

```javascript
// Clear all authentication data
localStorage.clear();
sessionStorage.clear();
console.log('✅ Session cleared! Refreshing page...');
window.location.reload();
```

4. **Press Enter** - The page will refresh and you can log in again

## **Alternative Method:**

1. **Open Developer Tools** (F12)
2. **Go to Application/Storage tab**
3. **Click "Clear storage"** or manually delete:
   - `token`
   - `refreshToken` 
   - `user`
4. **Refresh the page**

## **What This Does:**
- ✅ Clears all old JWT tokens from your browser
- ✅ Forces a fresh login with new secure tokens
- ✅ Resolves the "logged out when switching tabs" issue
- ✅ One-time fix - you won't need to do this again

## **After Clearing:**
1. You'll be redirected to the login page
2. Log in with your credentials
3. Everything will work normally with secure authentication
4. No more logout issues when switching tabs!

---

**This is a one-time security update. After logging in again, everything will work perfectly!** 🎉

