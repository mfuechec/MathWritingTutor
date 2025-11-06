# API Setup Guide

## CameraMath API Registration

### Step 1: Register for API Access

1. Visit **CameraMath Developer Portal**:
   - Option 1: https://www.cameramath.com/api
   - Option 2: https://developer.cameramath.com/
   - Option 3: Contact them directly if no public portal

2. **Sign up** for an API account
   - You may need to describe your use case (educational tablet app)
   - Mention you're building a math tutoring application

3. **Get your API key** from the dashboard
   - Look for "API Keys" or "Credentials" section
   - Copy your API key

4. **Check documentation** for:
   - Handwriting recognition endpoint
   - Math validation endpoint
   - Rate limits
   - Image format requirements

### Step 2: Alternative APIs (if CameraMath isn't available)

#### Option A: Mathpix OCR API (Recommended Alternative)
- Website: https://mathpix.com/
- Sign up: https://accounts.mathpix.com/
- **Best for**: Handwriting OCR to LaTeX
- **Pricing**: Free tier: 1,000 requests/month
- **Quality**: Excellent for math handwriting

#### Option B: MyScript Math API
- Website: https://developer.myscript.com/
- **Best for**: Real-time math recognition
- **Pricing**: Free tier available
- **Quality**: Designed specifically for math input

#### Option C: Wolfram Alpha API
- Website: https://products.wolframalpha.com/api/
- **Best for**: Math validation (not OCR)
- **Pricing**: Free tier: 2,000 queries/month
- **Use**: Combine with Mathpix for OCR

### Step 3: Configure Environment Variables

Once you have your API key(s), add them to `.env`:

```bash
# Edit .env file
CAMERAMATH_API_KEY=your_actual_key_here
CAMERAMATH_API_URL=https://api.cameramath.com/v1

# Or if using Mathpix
MATHPIX_APP_ID=your_app_id
MATHPIX_APP_KEY=your_app_key
MATHPIX_API_URL=https://api.mathpix.com/v3
```

### Step 4: Test API Connection

After adding your keys, restart the development server:

```bash
# Stop current server (Ctrl+C)
# Clear Metro bundler cache
npx expo start --clear
```

---

## API Documentation Quick Reference

### CameraMath API (Expected Structure)

**Recognition Endpoint:**
```
POST https://api.cameramath.com/v1/recognize
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "image": "base64_encoded_image",
    "format": "latex"
  }
Response:
  {
    "latex": "2x + 3 = 7",
    "confidence": 0.95
  }
```

**Validation Endpoint:**
```
POST https://api.cameramath.com/v1/validate
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "expression": "2x = 4",
    "context": {
      "problem": "Solve for x: 2x + 3 = 7",
      "previousSteps": ["2x + 3 = 7"]
    }
  }
Response:
  {
    "correct": true,
    "errorType": null
  }
```

### Mathpix API (Alternative)

**Recognition Endpoint:**
```
POST https://api.mathpix.com/v3/text
Headers:
  app_id: YOUR_APP_ID
  app_key: YOUR_APP_KEY
  Content-Type: application/json
Body:
  {
    "src": "data:image/png;base64,iVBORw0KGgo...",
    "formats": ["latex_styled"]
  }
Response:
  {
    "latex_styled": "2x+3=7",
    "confidence": 0.987
  }
```

---

## Troubleshooting

### Issue: "API Key Invalid"
- Double-check you copied the entire key
- Ensure no extra spaces in .env file
- Restart Metro bundler: `npx expo start --clear`

### Issue: "CORS Error"
- APIs must be called from backend/Cloud Functions in production
- For development, some APIs allow mobile app origins

### Issue: "Rate Limit Exceeded"
- Check your API dashboard for limits
- Implement caching for repeated requests
- Consider upgrading plan if needed

### Issue: "Low Recognition Accuracy"
- Ensure image is high quality (300+ DPI)
- Check that strokes are properly rendered to image
- Try preprocessing: increase contrast, remove noise

---

## Next Steps After API Setup

1. ✅ API keys configured in `.env`
2. ✅ Environment variables working
3. → Build API client in `src/infrastructure/api/MathValidationAPI.ts`
4. → Test with sample handwriting images
5. → Integrate with drawing canvas

---

## Cost Estimates (Architecture.md Reference)

**CameraMath**:
- $10 free credits for testing
- ~$0.01-0.05 per validation request

**Mathpix**:
- 1,000 free requests/month
- $0.004 per request after

**Wolfram Alpha**:
- 2,000 free queries/month
- $0.005 per query after

**For MVP testing**: Free tiers are sufficient
**For production**: Budget ~$100-200/month for 10,000 validations

---

## Contact

If you need help with API access or have questions:
- Check API provider documentation
- Email API support teams
- Reference this is for an educational project (may get educational pricing)

