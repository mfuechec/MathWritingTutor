# OpenAI GPT-4o Vision Setup Guide

## 🎯 Why GPT-4o Vision?

We chose GPT-4o Vision as the **all-in-one solution** for:
- ✅ Handwriting OCR (vision capabilities)
- ✅ Mathematical correctness validation
- ✅ **Usefulness assessment** (the unique pedagogical feature!)
- ✅ Graduated hint generation
- ✅ Natural language feedback

**Replaces:** Mathpix OCR + WolframAlpha + custom logic
**Cost:** ~$0.007 per validation (cheaper than alternatives!)

---

## 📋 Setup Steps

### Step 1: Get Your OpenAI API Key

1. **Go to**: https://platform.openai.com/signup
2. **Sign up** or **sign in** to your OpenAI account
3. **Navigate to**: API Keys section
   - URL: https://platform.openai.com/api-keys
4. **Click**: "Create new secret key"
5. **Name it**: "Math Tutor App"
6. **Copy the key**: `sk-proj-...` (starts with `sk-`)
   - ⚠️ **Save it now** - you won't see it again!

### Step 2: Add Credits (if needed)

**Free Tier:**
- New accounts get **$5 free credits**
- Enough for ~700 validations (testing)

**Paid Tier:**
- Add payment method at: https://platform.openai.com/account/billing
- Recommended: Start with **$10-20** for development
- Set usage limits to prevent unexpected charges

**Cost Estimates:**
- GPT-4o Vision: ~$0.005-0.01 per image request
- For 10,000 validations/month: ~$70-100
- Per student per problem: ~$0.01

### Step 3: Configure Environment Variables

Open your `.env` file and add your API key:

```bash
# Edit .env
nano .env

# Add your key:
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
OPENAI_API_URL=https://api.openai.com/v1

# Save: Ctrl+X, Y, Enter
```

**Your `.env` should look like:**
```
# OpenAI GPT-4o Vision (Primary - for OCR + Validation)
OPENAI_API_KEY=sk-proj-abcd1234...
OPENAI_API_URL=https://api.openai.com/v1

# Wolfram Alpha API (Optional - for verification)
WOLFRAM_API_KEY=XUP5YWWAVQ
WOLFRAM_API_URL=https://api.wolframalpha.com/v2

# Development Settings
NODE_ENV=development
API_TIMEOUT=10000
```

### Step 4: Test the Connection

**Option A: Use the test function** (coming soon)

**Option B: Manual test with curl:**
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Say OK"}],
    "max_tokens": 10
  }'
```

Should return: `{"choices": [{"message": {"content": "OK"}}]}`

---

## 🔐 Security Best Practices

### 1. Never Commit Your API Key
✅ Already configured: `.env` is in `.gitignore`

### 2. Use Environment Variables Only
❌ Don't hardcode: `const key = "sk-proj-..."`
✅ Use: `import { OPENAI_API_KEY } from '@env'`

### 3. Set Usage Limits
- Go to: https://platform.openai.com/account/limits
- Set monthly budget (e.g., $50/month)
- Enable email notifications

### 4. Monitor Usage
- Dashboard: https://platform.openai.com/usage
- Check daily/weekly spend
- Review unexpected spikes

---

## 📊 How It Works

### Single API Call Does Everything:

```typescript
// Input: Canvas image + problem context
const request = {
  canvasImageBase64: "iVBORw0KGgo...", // PNG of handwriting
  problem: {
    content: "Solve for x: 2x + 3 = 7",
    goalState: { type: 'ISOLATE_VARIABLE', variable: 'x' }
  },
  previousSteps: ["2x + 3 = 7"], // What student wrote before
  currentStepNumber: 2
};

// GPT-4o Vision processes:
const response = await gpt4oValidationAPI.validateStep(request);

// Output: Everything you need!
{
  recognizedExpression: "2x = 4",           // OCR
  mathematicallyCorrect: true,              // Validation
  useful: true,                              // Usefulness!
  progressScore: 0.7,                        // How close to solution
  feedbackMessage: "Great! You subtracted 3 from both sides correctly.",
  nudgeMessage: null,                        // Only if not useful
  suggestedHint: null                        // Only if student stuck
}
```

### The Magic: Pedagogical Intelligence

**Traditional APIs:**
```
Mathpix: "2x = 4" (just OCR)
WolframAlpha: "correct" (just validation)
YOU: ??? (usefulness logic is HARD to code!)
```

**GPT-4o Vision:**
```
"The step '2x = 4' is mathematically correct after subtracting 3 from both sides.
This is a USEFUL step because it isolates the variable term, moving closer to solving for x.
Progress: 70% toward solution."
```

---

## 🎓 Pedagogical Prompts

The system prompt defines how GPT-4o evaluates student work:

### Core Principles:
1. **Encourage productive struggle** (don't give away answers)
2. **Recognize creative approaches** (multiple valid paths exist)
3. **Growth mindset language** ("Keep thinking", not "Wrong")
4. **Pedagogical usefulness** (correct ≠ useful!)

### Example Scenarios:

**Scenario 1: Correct & Useful**
- Student: `2x = 4` (from `2x + 3 = 7`)
- GPT-4o: ✅ Correct, ✅ Useful
- Feedback: "Excellent! You subtracted 3 from both sides."

**Scenario 2: Correct but NOT Useful**
- Student: `2x + 4 = 8` (from `2x + 3 = 7`)
- GPT-4o: ✅ Correct, ❌ Not Useful
- Feedback: "This is correct math, but does adding 1 to both sides help you solve for x?"
- **This is the killer feature!**

**Scenario 3: Incorrect**
- Student: `2x = 10` (from `2x + 3 = 7`)
- GPT-4o: ❌ Incorrect
- Feedback: "Check your subtraction. What do you get when you subtract 3 from 7?"
- Hint Level 1: "Remember: we want to isolate x by removing the +3"

---

## 💡 Advanced Configuration

### Adjust Temperature (Consistency)
```typescript
temperature: 0.1  // Low = more consistent (default)
temperature: 0.7  // Higher = more creative hints
```

### Token Limits
```typescript
max_tokens: 1000  // Default (allows detailed feedback)
max_tokens: 500   // Reduce cost, shorter responses
```

### Response Format
```typescript
response_format: { type: 'json_object' }  // Enforces JSON
```

---

## 🐛 Troubleshooting

### Error: "Invalid API Key"
- Check you copied the full key (starts with `sk-`)
- No extra spaces in `.env`
- Restart Metro: `npx expo start --clear`

### Error: "Insufficient Credits"
- Add payment method or credits
- Check usage: https://platform.openai.com/usage

### Error: "Rate Limit Exceeded"
- Free tier: 3 requests/minute
- Paid tier: 10,000 requests/minute
- Add payment method to increase limits

### Slow Responses (>3 seconds)
- Normal for vision + reasoning
- Target: 1-2 seconds per validation
- If >5 seconds, check network/API status

### Low Recognition Accuracy
- Ensure image is clear (not blurry)
- Check canvas-to-image rendering
- Verify image is being sent correctly
- Try adjusting image quality/size

---

## 📈 Monitoring & Optimization

### Track Performance:
1. **Latency**: Response time per validation
2. **Accuracy**: Recognition confidence scores
3. **Cost**: Tokens used per request
4. **Quality**: Feedback relevance (user ratings)

### Optimization Tips:
1. **Batch requests** when possible (future feature)
2. **Cache common problems** (reduce API calls)
3. **Adjust token limits** based on needs
4. **Use temperature=0** for consistency

---

## 🚀 Next Steps

Once your API key is configured:

1. ✅ OpenAI API key in `.env`
2. ✅ GPT-4oValidationAPI client created
3. ✅ Canvas-to-image rendering ready
4. → Integrate with drawing canvas
5. → Add visual feedback (checkmarks, nudges)
6. → Test end-to-end validation flow

---

## 📚 Resources

**OpenAI Documentation:**
- API Keys: https://platform.openai.com/api-keys
- GPT-4o Vision Guide: https://platform.openai.com/docs/guides/vision
- Pricing: https://openai.com/api/pricing/
- Usage Dashboard: https://platform.openai.com/usage

**Project Files:**
- API Client: `src/infrastructure/api/GPT4oValidationAPI.ts`
- Image Capture: `src/utils/CanvasImageCapture.ts`
- Type Definitions: `src/types/index.ts`

---

**Ready to validate some math!** 🎉

Add your OpenAI API key to `.env` and we'll integrate it with the drawing canvas.

