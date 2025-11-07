/**
 * Math Tutor App - With GPT-4o Validation Integration
 *
 * Features:
 * - Drawing canvas with multi-color support
 * - Math problem display
 * - GPT-4o Vision validation
 * - Visual feedback (checkmarks, nudges, errors)
 */

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Canvas, Path, Skia, SkPath, Line, Rect } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { gpt4oValidationAPI } from './src/infrastructure/api/GPT4oValidationAPI';
import { CanvasImageCapture } from './src/utils/CanvasImageCapture';
import type { Problem, StepValidationResponse } from './src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 40;

// Guide line configuration
const GUIDE_LINE_SPACING = 60;
const GUIDE_LINE_COLOR = '#E0E0E0';
const GUIDE_LINE_WIDTH = 1;

// Available ink colors
const COLORS = {
  BLACK: '#000000',
  BLUE: '#0066CC',
  RED: '#CC0000',
};

type ColoredStroke = {
  path: SkPath;
  color: string;
};

// Sample math problem
const SAMPLE_PROBLEM: Problem = {
  id: 'sample-1',
  content: 'Solve for x: 2x + 3 = 7',
  contentType: 'text',
  difficulty: 'easy',
  skillArea: 'algebra',
  goalState: {
    type: 'ISOLATE_VARIABLE',
    variable: 'x',
  },
  hintLibrary: {},
};

export default function App() {
  // Canvas state
  const [pathStrings, setPathStrings] = useState<string[]>([]);
  const [pathColors, setPathColors] = useState<string[]>([]);
  const [pathLineNumbers, setPathLineNumbers] = useState<number[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [currentColor, setCurrentColor] = useState<string>(COLORS.BLACK);
  const [showGuideLines, setShowGuideLines] = useState<boolean>(true);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{ [lineNumber: number]: StepValidationResponse }>({});
  const [previousSteps, setPreviousSteps] = useState<string[]>([]);
  const [currentProblem] = useState<Problem>(SAMPLE_PROBLEM);
  const [autoValidate, setAutoValidate] = useState<boolean>(true);
  const [voiceFeedback, setVoiceFeedback] = useState<boolean>(true);
  const lastValidatedLineRef = useRef<number>(-1);

  const pathRef = useRef<SkPath | null>(null);
  const colorRef = useRef<string>(COLORS.BLACK);
  const startYRef = useRef<number>(0);
  const canvasRef = useRef<any>(null);

  const getLineNumber = (y: number): number => {
    return Math.floor(y / GUIDE_LINE_SPACING);
  };

  const addCompletedStroke = useCallback((pathString: string, color: string, lineNumber: number) => {
    setPathStrings(prev => [...prev, pathString]);
    setPathColors(prev => [...prev, color]);
    setPathLineNumbers(prev => [...prev, lineNumber]);
  }, []);

  const generateGuideLines = () => {
    const lines = [];
    const numLines = Math.floor(CANVAS_SIZE / GUIDE_LINE_SPACING);
    for (let i = 1; i <= numLines; i++) {
      lines.push({ key: `guide-${i}`, y: i * GUIDE_LINE_SPACING });
    }
    return lines;
  };

  const guideLines = generateGuideLines();

  const getStrokesByLine = useCallback(() => {
    const lineGroups: { [lineNumber: number]: number[] } = {};
    pathLineNumbers.forEach((lineNum, index) => {
      if (!lineGroups[lineNum]) {
        lineGroups[lineNum] = [];
      }
      lineGroups[lineNum].push(index);
    });
    return lineGroups;
  }, [pathLineNumbers]);

  const strokesByLine = getStrokesByLine();

  const clearCanvas = useCallback(() => {
    setPathStrings([]);
    setPathColors([]);
    setPathLineNumbers([]);
    setValidationResults({});
    setPreviousSteps([]);
    lastValidatedLineRef.current = -1;
    Speech.stop(); // Stop any ongoing speech
  }, []);

  /**
   * Speak feedback message using text-to-speech
   */
  const speakFeedback = useCallback((message: string) => {
    if (!voiceFeedback) return;

    // Stop any ongoing speech first
    Speech.stop();

    // Speak the feedback
    Speech.speak(message, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9, // Slightly slower for clarity
    });
  }, [voiceFeedback]);

  /**
   * Validate the most recent line using GPT-4o Vision
   */
  const validateCurrentLine = async (manualTrigger = false) => {
    try {
      setValidating(true);

      // Find the most recent line number
      const lineNumbers = Object.keys(strokesByLine).map(Number).sort((a, b) => b - a);
      if (lineNumbers.length === 0) {
        if (manualTrigger) {
          alert('Please write something first!');
        }
        setValidating(false);
        return;
      }

      const currentLineNumber = lineNumbers[0];

      // Skip if already validated and not manually triggered
      if (!manualTrigger && lastValidatedLineRef.current === currentLineNumber) {
        setValidating(false);
        return;
      }

      const strokeIndices = strokesByLine[currentLineNumber];

      console.log(`Validating line ${currentLineNumber} with ${strokeIndices.length} strokes`);

      // Get strokes for this line
      const lineStrokes: ColoredStroke[] = strokeIndices.map(idx => {
        const pathString = pathStrings[idx];
        const path = Skia.Path.MakeFromSVGString(pathString);
        return {
          path: path!,
          color: pathColors[idx],
        };
      });

      // Capture line as image
      console.log('Capturing canvas image...');
      const imageBase64 = await CanvasImageCapture.captureLineAsBase64(
        lineStrokes,
        currentLineNumber,
        GUIDE_LINE_SPACING,
        { width: CANVAS_SIZE, height: GUIDE_LINE_SPACING }
      );

      console.log(`Image captured: ${imageBase64.length} bytes`);

      // Call GPT-4o validation
      console.log('Calling GPT-4o validation...');
      const response = await gpt4oValidationAPI.validateStep({
        canvasImageBase64: imageBase64,
        problem: currentProblem,
        previousSteps,
        currentStepNumber: previousSteps.length + 1,
      });

      console.log('Validation response:', response);

      // Store validation result
      setValidationResults(prev => ({
        ...prev,
        [currentLineNumber]: response,
      }));

      // Mark this line as validated
      lastValidatedLineRef.current = currentLineNumber;

      // If correct, add to previous steps
      if (response.mathematicallyCorrect && response.useful) {
        setPreviousSteps(prev => [...prev, response.recognizedExpression]);
      }

      // Speak the feedback
      speakFeedback(response.feedbackMessage);

      setValidating(false);
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (manualTrigger) {
        alert(errorMessage);
      }
      setValidating(false);
    }
  };

  /**
   * Auto-validate after a delay when new strokes are added
   */
  useEffect(() => {
    if (!autoValidate || validating || pathStrings.length === 0) {
      return;
    }

    // Debounce: wait 1.5 seconds after the last stroke before validating
    const timer = setTimeout(() => {
      validateCurrentLine(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathStrings.length, autoValidate, validating]);

  // Drawing gesture
  const drawGesture = useMemo(() =>
    Gesture.Pan()
      .averageTouches(true)
      .maxPointers(1)
      .onBegin((e) => {
        'worklet';
        const path = Skia.Path.Make();
        path.moveTo(e.x, e.y);
        pathRef.current = path;
        startYRef.current = e.y;
        runOnJS(setCurrentPath)(path);
      })
      .onUpdate((e) => {
        'worklet';
        if (pathRef.current) {
          pathRef.current.lineTo(e.x, e.y);
          runOnJS(setCurrentPath)(pathRef.current.copy());
        }
      })
      .onEnd(() => {
        'worklet';
        if (pathRef.current) {
          const pathString = pathRef.current.toSVGString();
          const strokeColor = colorRef.current;
          const lineNumber = Math.floor(startYRef.current / GUIDE_LINE_SPACING);
          runOnJS(addCompletedStroke)(pathString, strokeColor, lineNumber);
        }
        pathRef.current = null;
        runOnJS(setCurrentPath)(null);
      })
  , [addCompletedStroke]);

  // Get validation result for a line
  const getLineValidation = (lineNumber: number) => {
    return validationResults[lineNumber];
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />

        {/* Problem Display */}
        <View style={styles.problemContainer}>
          <Text style={styles.problemLabel}>Problem:</Text>
          <Text style={styles.problemText}>{currentProblem.content}</Text>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.colorPicker}>
            <Text style={styles.colorLabel}>Color:</Text>
            <View style={styles.colorButtons}>
              {Object.entries(COLORS).map(([name, color]) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    currentColor === color && styles.colorButtonSelected,
                  ]}
                  onPress={() => {
                    setCurrentColor(color);
                    colorRef.current = color;
                  }}
                >
                  {currentColor === color && <View style={styles.checkmark} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCanvas}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowGuideLines(!showGuideLines)}
          >
            <Text style={styles.toggleButtonText}>
              {showGuideLines ? '📏' : '📏'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, autoValidate && styles.toggleButtonActive]}
            onPress={() => setAutoValidate(!autoValidate)}
          >
            <Text style={styles.toggleButtonText}>
              {autoValidate ? '⚡' : '⚡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, voiceFeedback && styles.toggleButtonActive]}
            onPress={() => {
              setVoiceFeedback(!voiceFeedback);
              if (voiceFeedback) {
                Speech.stop();
              }
            }}
          >
            <Text style={styles.toggleButtonText}>
              {voiceFeedback ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <GestureDetector gesture={drawGesture}>
          <View style={styles.canvasContainer}>
            <Canvas style={styles.canvas} ref={canvasRef}>
              {/* Guide lines */}
              {showGuideLines && guideLines.map((line) => (
                <Line
                  key={line.key}
                  p1={{ x: 0, y: line.y }}
                  p2={{ x: CANVAS_SIZE, y: line.y }}
                  color={GUIDE_LINE_COLOR}
                  strokeWidth={GUIDE_LINE_WIDTH}
                />
              ))}

              {/* User strokes */}
              {Array.isArray(pathStrings) && pathStrings.map((pathString, index) => {
                const path = Skia.Path.MakeFromSVGString(pathString);
                if (!path) return null;

                const lineNumber = pathLineNumbers[index];
                const validation = getLineValidation(lineNumber);

                return (
                  <Path
                    key={index}
                    path={path}
                    color={pathColors[index] || COLORS.BLACK}
                    style="stroke"
                    strokeWidth={2}
                    strokeCap="round"
                    strokeJoin="round"
                    opacity={validation ? 0.7 : 1}
                  />
                );
              })}

              {/* Current path being drawn */}
              {currentPath && (
                <Path
                  path={currentPath}
                  color={currentColor}
                  style="stroke"
                  strokeWidth={2}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}

              {/* Validation indicators (checkmarks/crosses) */}
              {Object.entries(validationResults).map(([lineNumStr, result]) => {
                const lineNum = parseInt(lineNumStr);
                const y = (lineNum + 0.5) * GUIDE_LINE_SPACING;
                const x = CANVAS_SIZE - 40;

                return (
                  <Rect
                    key={`validation-${lineNum}`}
                    x={x}
                    y={y - 15}
                    width={30}
                    height={30}
                    color={
                      result.mathematicallyCorrect && result.useful
                        ? '#4CAF50'
                        : result.mathematicallyCorrect
                        ? '#FFC107'
                        : '#F44336'
                    }
                    style="fill"
                    opacity={0.8}
                  />
                );
              })}
            </Canvas>
          </View>
        </GestureDetector>

        {/* Validation Button */}
        <TouchableOpacity
          style={[styles.validateButton, validating && styles.validateButtonDisabled]}
          onPress={() => validateCurrentLine(true)}
          disabled={validating}
        >
          {validating ? (
            <>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.validateButtonText}>Validating...</Text>
            </>
          ) : (
            <Text style={styles.validateButtonText}>
              {autoValidate ? '🔄 Re-check' : '✓ Check My Work'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Feedback Display */}
        <ScrollView style={styles.feedbackContainer}>
          {Object.entries(validationResults)
            .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
            .map(([lineNum, result]) => (
              <View
                key={`feedback-${lineNum}`}
                style={[
                  styles.feedbackItem,
                  result.mathematicallyCorrect && result.useful
                    ? styles.feedbackCorrect
                    : result.mathematicallyCorrect
                    ? styles.feedbackNudge
                    : styles.feedbackIncorrect,
                ]}
              >
                <Text style={styles.feedbackTitle}>
                  {result.mathematicallyCorrect && result.useful
                    ? '✅ Correct!'
                    : result.mathematicallyCorrect
                    ? '⚠️ Think About It'
                    : '❌ Not Quite'}
                </Text>
                <Text style={styles.feedbackRecognized}>
                  Recognized: {result.recognizedExpression || 'Unable to read'}
                </Text>
                <Text style={styles.feedbackMessage}>{result.feedbackMessage}</Text>
                {result.nudgeMessage && (
                  <Text style={styles.feedbackNudgeText}>{result.nudgeMessage}</Text>
                )}
                {result.suggestedHint && (
                  <Text style={styles.feedbackHint}>
                    💡 Hint: {result.suggestedHint.text}
                  </Text>
                )}
              </View>
            ))}
        </ScrollView>

        <View style={styles.infoContainer}>
          <Text style={styles.info}>
            Steps: {previousSteps.length} | Strokes: {pathStrings?.length || 0}
          </Text>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  problemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  problemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  colorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorButtonSelected: {
    borderColor: '#0066CC',
    borderWidth: 3,
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: '#666',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    fontSize: 16,
  },
  canvasContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  validateButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  validateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    maxHeight: 150,
    marginHorizontal: 20,
    marginTop: 12,
  },
  feedbackItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  feedbackCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  feedbackNudge: {
    backgroundColor: '#fff3cd',
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  feedbackIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  feedbackRecognized: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
    color: '#666',
  },
  feedbackMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  feedbackNudgeText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#856404',
  },
  feedbackHint: {
    fontSize: 13,
    marginTop: 4,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
  },
  infoContainer: {
    padding: 12,
    alignItems: 'center',
  },
  info: {
    fontSize: 12,
    color: '#666',
  },
});
