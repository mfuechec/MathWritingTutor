# 🚀 Quick Start - Access Test Screen

## ✅ What I Just Did:

1. ✅ Changed `index.ts` to load `TestWolframAPI` instead of `App`
2. ✅ Started Metro bundler with clear cache
3. ✅ Ready for you to access the test screen

---

## 📱 How to See the Test Screen:

### Option 1: iOS Simulator (Mac only)
```bash
# In the terminal where Expo is running, press:
i
```

### Option 2: Android Emulator
```bash
# In the terminal where Expo is running, press:
a
```

### Option 3: Physical Device (iPhone/Android)
1. Install **Expo Go** app from App Store / Play Store
2. Open Expo Go
3. Scan the QR code from the terminal

---

## 🎯 What You'll See:

The screen will show:
- **Title**: "🧪 WolframAlpha API Test"
- **Three sections**:
  - Step 1: Get Your AppID
  - Step 2: Add to .env
  - Step 3: Test Connection
- **Two buttons**:
  - ⚡ Quick Test (2+2)
  - 🧪 Full Test Suite

---

## ⚠️ Before Testing:

You need to add your WolframAlpha AppID first!

### Get AppID:
1. Go to: https://developer.wolframalpha.com/
2. Click "Get an AppID"
3. Copy your AppID

### Add to .env:
```bash
# Open .env file
nano .env

# Find this line:
WOLFRAM_API_KEY=

# Change to (paste your AppID):
WOLFRAM_API_KEY=YOUR-APPID-HERE

# Save: Ctrl+X, then Y, then Enter
```

### Restart App:
```bash
# Stop expo (Ctrl+C in terminal)
# Start again:
npx expo start --clear
```

---

## 🧪 Run the Test:

1. App loads → You see test screen
2. Press **"⚡ Quick Test"** button
3. Wait 2-3 seconds
4. Should see: **✅ API Connection Successful!**

If you see ✅ success → API is working!
If you see ❌ failed → Check your AppID in .env

---

## 🔄 Switch Back to Main App:

Once API works, edit `index.ts`:

```typescript
// Change this line:
import App from './TestWolframAPI';

// Back to:
import App from './App';
```

Then restart:
```bash
npx expo start --clear
```

---

## 📍 Where Are You Now:

```
Terminal → Expo is running at http://localhost:8081
Next → Press 'i' for iOS or 'a' for Android
Then → You'll see the test screen
```

---

## 🆘 Troubleshooting:

### "Cannot find module 'TestWolframAPI'"
→ Run: `npx expo start --clear`

### "Network request failed"
→ Add your WOLFRAM_API_KEY to .env first

### "API key not configured"
→ Check .env file has: WOLFRAM_API_KEY=YOUR-APPID

### Expo won't start
→ Check no other Metro is running
→ Run: `pkill -f "expo start"` then restart

---

**Current Status:**
- ✅ Test screen code created
- ✅ index.ts updated to show test screen
- ✅ Metro bundler started
- ⏳ Waiting for you to: Get AppID → Add to .env → Press 'i' or 'a'

