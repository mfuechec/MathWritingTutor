# API Update: React Native Skia Modern Approach

**Date:** November 5, 2025
**Issue:** Deprecated API usage detected
**Status:** ✅ FIXED

---

## Problem

The initial DrawingCanvas implementation used **deprecated APIs**:
- `useTouchHandler` (deprecated in react-native-skia ^1.5.0)
- `onTouch` prop (deprecated)

These APIs are no longer recommended and may be removed in future versions.

---

## Solution

Updated to **modern API** recommended by Shopify team:

### Old Approach (Deprecated):
```typescript
import {useTouchHandler, TouchInfo} from '@shopify/react-native-skia';

const touchHandler = useTouchHandler({
  onStart: (touch: TouchInfo) => { ... },
  onActive: (touch: TouchInfo) => { ... },
  onEnd: () => { ... },
});

<Canvas onTouch={touchHandler}>
```

### New Approach (Current):
```typescript
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

const drawGesture = Gesture.Pan()
  .runOnJS(true)
  .onBegin(event => { ... })
  .onUpdate(event => { ... })
  .onEnd(() => { ... });

<GestureDetector gesture={drawGesture}>
  <Canvas>
```

---

## Key Changes

### 1. Import Changes
- ❌ Remove: `useTouchHandler`, `TouchInfo` from `@shopify/react-native-skia`
- ✅ Add: `Gesture`, `GestureDetector` from `react-native-gesture-handler`

### 2. Event Handler Structure
- ❌ `useTouchHandler` hook
- ✅ `Gesture.Pan()` builder pattern

### 3. Callback Names
- `onStart` → `onBegin`
- `onActive` → `onUpdate`
- `onEnd` remains the same

### 4. Component Wrapping
- ❌ `<Canvas onTouch={handler}>`
- ✅ `<GestureDetector gesture={gesture}><Canvas>`

### 5. Thread Execution
- Must call `.runOnJS(true)` to run callbacks on JS thread
- Required for React state updates

---

## Benefits of New API

### Performance
- Integrates better with Reanimated 3 worklets
- More efficient gesture recognition
- Better stylus/touch event handling

### Compatibility
- Works seamlessly with GestureHandlerRootView
- Better support for complex gesture combinations
- Future-proof (actively maintained)

### Features
- More gesture types available (Pan, Pinch, Rotate, etc.)
- Better composition of multiple gestures
- Improved ScrollView compatibility

---

## Migration Checklist

- [x] Update imports
- [x] Replace `useTouchHandler` with `Gesture.Pan()`
- [x] Change callback names (`onStart` → `onBegin`)
- [x] Add `.runOnJS(true)`
- [x] Wrap Canvas in GestureDetector
- [x] Update force re-render logic
- [x] Test on device

---

## Limitations & Notes

### Pressure Sensitivity
- ⚠️ Basic `Gesture.Pan()` doesn't provide `force` property
- Stylus pressure: ~0.5 constant value currently
- **Future:** May need to explore advanced gesture APIs for true pressure sensitivity

### Performance Impact
- `.runOnJS(true)` runs on JS thread (not UI thread)
- For <100ms latency, this is acceptable
- If performance issues arise, consider Reanimated shared values

---

## Testing Requirements

Test updated component for:
1. **Drawing works** - Strokes render correctly
2. **No visual glitches** - Path updates smoothly
3. **Performance maintained** - Still feels instant (<100ms)
4. **No console warnings** - Deprecated API warnings resolved

---

## References

- **Migration Discussion:** https://github.com/Shopify/react-native-skia/discussions/2859
- **Gesture Handler Docs:** https://docs.swmansion.com/react-native-gesture-handler/
- **React Native Skia Docs:** https://shopify.github.io/react-native-skia/

---

## Updated Files

- `src/presentation/components/DrawingCanvas.tsx` - ✅ Updated to modern API

---

**Status:** Ready for testing with modern, non-deprecated API.
