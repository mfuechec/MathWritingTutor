# WolframAlpha API Setup - Complete Guide

## 🎯 Overview

This guide walks you through setting up WolframAlpha API for math validation in the Math Tutor app.

**Time Required:** 5-10 minutes
**Cost:** Free (2,000 queries/month)
**Difficulty:** Easy

---

## 📋 Prerequisites

- [ ] Internet connection
- [ ] Email address for registration
- [ ] Text editor (for editing .env file)

---

## 🚀 Step-by-Step Instructions

### Step 1: Register for WolframAlpha Developer Account

1. **Open your browser** and go to:
   ```
   https://developer.wolframalpha.com/
   ```

2. **Click "Sign Up"** or **"Get an AppID"** button
   - Usually located in the top-right corner

3. **Create Account**:
   - If you have a Wolfram account, sign in
   - If new, click "Create one" and fill out:
     - Email address
     - Password
     - First & Last name
     - Accept terms
     - Click "Create Wolfram ID"

4. **Verify Email** (if required):
   - Check your inbox
   - Click verification link
   - Return to developer portal

---

### Step 2: Get Your AppID (API Key)

1. **Once logged in**, you should see the Developer Portal dashboard

2. **Click "Get an AppID"** button

3. **Fill out the Application Form**:
   ```
   Application Name: Math Tutor App
   Application Description: Educational tablet application for K-12 math tutoring with handwriting recognition
   Purpose: Education / Non-Commercial
   What will you use this for: Student math practice and validation
   ```

4. **Accept Terms** and click **"Get AppID"**

5. **Copy Your AppID**:
   - You'll see a string like: `XXXXXX-XXXXXXXXXX`
   - **Copy this entire string** (you'll need it in Step 3)
   - Keep this page open or save the AppID somewhere safe

---

### Step 3: Add AppID to Your Project

#### Option A: Using Terminal (Recommended)

```bash
# Navigate to your project
cd /Users/mfuechec/Desktop/Gauntlet\ Projects/MathWritingTutor/MathTutor

# Open .env file in nano editor
nano .env

# Find this line:
WOLFRAM_API_KEY=

# Replace with your AppID:
WOLFRAM_API_KEY=YOUR-APPID-HERE

# Save and exit:
# Press: Ctrl + X
# Press: Y (to confirm)
# Press: Enter
```

#### Option B: Using Visual Studio Code

1. Open VS Code
2. Open file: `.env`
3. Find line: `WOLFRAM_API_KEY=`
4. Add your AppID: `WOLFRAM_API_KEY=XXXXXX-XXXXXXXXXX`
5. Save file (Cmd+S)

#### Option C: Using Finder + TextEdit

1. Open Finder
2. Navigate to: `/Users/mfuechec/Desktop/Gauntlet Projects/MathWritingTutor/MathTutor/`
3. Find `.env` file (you may need to press Cmd+Shift+. to show hidden files)
4. Right-click → Open With → TextEdit
5. Add your AppID to the line: `WOLFRAM_API_KEY=YOUR-APPID-HERE`
6. Save (Cmd+S)

**Your .env should look like this:**
```bash
# Math Validation API Configuration
# DO NOT COMMIT THIS FILE - Add to .gitignore

# CameraMath API (Primary)
CAMERAMATH_API_KEY=
CAMERAMATH_API_URL=https://api.cameramath.com/v1

# Wolfram Alpha API (Backup)
WOLFRAM_API_KEY=XXXXXX-XXXXXXXXXX  # ← Your actual AppID here
WOLFRAM_API_URL=https://api.wolframalpha.com/v2

# Development Settings
NODE_ENV=development
API_TIMEOUT=5000
```

---

### Step 4: Test Your API Connection

#### 4.1 Temporarily Switch to Test Screen

```bash
# Open index.ts
# Change this line:
# import App from './App';

# To:
import App from './TestWolframAPI';
```

Or edit `index.ts`:

```typescript
import { registerRootComponent } from 'expo';

// Temporarily use test screen
import App from './TestWolframAPI';  // ← Change this

registerRootComponent(App);
```

#### 4.2 Restart Metro Bundler

```bash
# Stop current server (Ctrl+C in terminal)

# Clear cache and restart
npx expo start --clear
```

#### 4.3 Run the App

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Or scan QR code with Expo Go on your device

#### 4.4 Test the Connection

1. You'll see the **WolframAlpha API Test** screen
2. Press **"⚡ Quick Test (2+2)"** button
3. Wait 2-3 seconds
4. You should see:
   - ✅ **API Connection Successful!**
   - "Your WolframAlpha API is working!"

5. (Optional) Press **"🧪 Full Test Suite"** to test:
   - Simple math (2+2)
   - Solve equation (2x + 3 = 7)
   - Simplify expression (2x + 3x)
   - Check equation equivalence

#### 4.5 Check Console Logs

Open your terminal where Metro is running. You should see:
```
⚡ Quick API Test...
✅ WolframAlpha API is working!
```

Or for full test:
```
🧪 Testing WolframAlpha API Connection...

Test 1: Simple arithmetic (2 + 2)
Result: { success: true, result: '4' }
✅ Pass: true
---

Test 2: Solve equation (2x + 3 = 7)
Result: { success: true, result: 'x = 2' }
✅ Expected: x = 2
---
...
```

---

### Step 5: Switch Back to Main App

Once tests pass:

1. **Edit `index.ts` back**:
   ```typescript
   import App from './App';  // ← Back to main app
   ```

2. **Restart Metro**:
   ```bash
   npx expo start --clear
   ```

---

## ✅ Verification Checklist

- [ ] Registered at https://developer.wolframalpha.com/
- [ ] Got AppID from dashboard
- [ ] Added AppID to `.env` file
- [ ] Restarted Metro bundler with `--clear`
- [ ] Ran TestWolframAPI screen
- [ ] Saw "✅ API Connection Successful!"
- [ ] Full test suite passed (optional)
- [ ] Switched back to main app

---

## 🐛 Troubleshooting

### Error: "API key not configured"

**Solution:**
1. Check that `.env` file exists in project root
2. Verify `WOLFRAM_API_KEY=` has your AppID (no spaces)
3. Restart Metro with: `npx expo start --clear`
4. Make sure you're running from correct directory

### Error: "Invalid AppID"

**Solution:**
1. Double-check you copied the entire AppID
2. No extra spaces before or after the key
3. Log back into developer.wolframalpha.com to verify AppID is active
4. Try generating a new AppID

### Error: "Network request failed"

**Solution:**
1. Check your internet connection
2. Try accessing https://api.wolframalpha.com/v2/ in browser
3. Check if firewall/VPN is blocking API access
4. Increase timeout in `.env`: `API_TIMEOUT=10000`

### Error: "Query failed" or "No result found"

**Solution:**
1. This is normal for some queries
2. WolframAlpha might not understand the query format
3. Try different test queries
4. Check WolframAlpha status: https://www.wolframalpha.com/

### Tests fail but connection works

**Possible causes:**
- API response format changed
- Query syntax issues
- Don't worry! As long as basic connection works, you're good

---

## 📊 API Limits & Pricing

### Free Tier (Non-Commercial)
- **2,000 queries per month**
- **Resets monthly**
- **No credit card required**
- **Perfect for development & testing**

### Paid Tier
- **$0.005 per query** (~$5 per 1,000 queries)
- **Higher rate limits**
- **Commercial use allowed**

### For This Project:
- **MVP Testing:** Free tier is sufficient
- **Production Estimate:** ~$100-200/month for 10,000 validations
- **Cost per student:** ~$0.01-0.02 per problem

---

## 🔐 Security Notes

1. **Never commit .env to git**
   - Already added to `.gitignore`
   - Never share your AppID publicly

2. **API Key Storage**:
   - Keep `.env` file secure
   - Don't screenshot or share .env contents
   - In production, use environment variables or secret management

3. **Rate Limiting**:
   - Monitor usage at: https://developer.wolframalpha.com/
   - Implement caching to reduce API calls
   - Set up usage alerts

---

## 📚 Next Steps

Once API is working:

1. ✅ WolframAlpha API configured
2. → Build handwriting-to-math OCR (Mathpix or similar)
3. → Integrate validation engine with drawing canvas
4. → Implement usefulness assessment (custom logic)
5. → Add visual feedback (checkmarks, nudges)

---

## 🆘 Still Having Issues?

1. **Check API Status**: https://www.wolframalpha.com/
2. **Read Docs**: https://products.wolframalpha.com/api/documentation
3. **Contact Support**: Through developer portal
4. **Alternative**: Try Mathpix for OCR + Wolfram for validation

---

## 📞 Support

**WolframAlpha**:
- Developer Portal: https://developer.wolframalpha.com/
- Documentation: https://products.wolframalpha.com/api/documentation
- Support: Through developer portal contact form

**Project**:
- Check: `src/infrastructure/api/WolframAlphaAPI.ts` for implementation
- Run: `TestWolframAPI.tsx` for testing
- Logs: Check Metro bundler terminal for detailed errors

---

**Created:** 2025-11-05
**Last Updated:** 2025-11-05
**Status:** Ready for Use

