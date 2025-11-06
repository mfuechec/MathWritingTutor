/**
 * Math Tutor App - Enhanced UI Version
 *
 * All UI improvements implemented:
 * - Enhanced feedback cards with full GPT-4o response
 * - Better validation indicators on canvas
 * - Progress tracking with visual progress bar
 * - Animated checkmarks
 * - "Check Line X" button
 * - Improved problem display
 * - Loading states
 * - Empty states
 */

import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, View, Text, Dimensions, SafeAreaView,
  TouchableOpacity, ActivityIndicator, ScrollView, Animated
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Canvas, Path, Skia, SkPath, Line, Circle, Group } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { gpt4oValidationAPI } from './src/infrastructure/api/GPT4oValidationAPI';
import { CanvasImageCapture } from './src/utils/CanvasImageCapture';
import type { Problem, StepValidationResponse } from './src/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45; // Use 45% of screen height for canvas

const GUIDE_LINE_SPACING = 60;
const GUIDE_LINE_COLOR = '#E0E0E0';
const GUIDE_LINE_WIDTH = 1;

const COLORS = {
  BLACK: '#000000',
  BLUE: '#0066CC',
  RED: '#CC0000',
};

const COLOR_NAMES = {
  '#000000': 'Black',
  '#0066CC': 'Blue',
  '#CC0000': 'Red',
};

type ColoredStroke = {
  path: SkPath;
  color: string;
};

const SAMPLE_PROBLEM: Problem = {
  id: 'sample-1',
  content: '2x + 3 = 7',
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
  const [validationProgress, setValidationProgress] = useState<string>('');
  const [validationResults, setValidationResults] = useState<{ [lineNumber: number]: StepValidationResponse }>({});
  const [previousSteps, setPreviousSteps] = useState<string[]>([]);
  const [currentProblem] = useState<Problem>(SAMPLE_PROBLEM);
  const [feedbackExpanded, setFeedbackExpanded] = useState(true);

  // Animation values
  const checkmarkAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pathRef = useRef<SkPath | null>(null);
  const colorRef = useRef<string>(COLORS.BLACK);
  const startYRef = useRef<number>(0);

  // Pulse animation for validate button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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
    const numLines = Math.floor(CANVAS_HEIGHT / GUIDE_LINE_SPACING);
    for (let i = 1; i <= numLines; i++) {
      lines.push({ key: `guide-${i}`, y: i * GUIDE_LINE_SPACING, number: i });
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
  }, []);

  // Get current line number (most recent)
  const getCurrentLineNumber = () => {
    const lineNumbers = Object.keys(strokesByLine).map(Number).sort((a, b) => b - a);
    return lineNumbers.length > 0 ? lineNumbers[0] : null;
  };

  const currentLineNumber = getCurrentLineNumber();
  const hasUnvalidatedStrokes = currentLineNumber !== null && !validationResults[currentLineNumber];

  // Calculate progress based on GPT-4o's assessment
  const calculateProgress = () => {
    // Check if any validation marked the problem as complete
    const isComplete = Object.values(validationResults).some(r =>
      r.feedbackMessage?.toLowerCase().includes('solved') ||
      r.feedbackMessage?.toLowerCase().includes('correct!') &&
      r.progressScore >= 0.95
    );

    if (isComplete) {
      return 100;
    }

    // Use the highest progress score from all validations
    const maxProgress = Math.max(
      0,
      ...Object.values(validationResults).map(r => r.progressScore || 0)
    );

    return Math.round(maxProgress * 100);
  };

  const progress = calculateProgress();

  /**
   * Validate the current line
   */
  const validateCurrentLine = async () => {
    if (!currentLineNumber || validationResults[currentLineNumber]) {
      return;
    }

    try {
      setValidating(true);
      setValidationProgress('Reading your handwriting...');

      const strokeIndices = strokesByLine[currentLineNumber];
      const lineStrokes: ColoredStroke[] = strokeIndices.map(idx => {
        const pathString = pathStrings[idx];
        const path = Skia.Path.MakeFromSVGString(pathString);
        return { path: path!, color: pathColors[idx] };
      });

      // Capture image
      const imageBase64 = await CanvasImageCapture.captureLineAsBase64(
        lineStrokes,
        currentLineNumber,
        GUIDE_LINE_SPACING,
        { width: CANVAS_WIDTH, height: GUIDE_LINE_SPACING }
      );

      setValidationProgress('Checking your math...');

      // Call GPT-4o
      const response = await gpt4oValidationAPI.validateStep({
        canvasImageBase64: imageBase64,
        problem: currentProblem,
        previousSteps,
        currentStepNumber: previousSteps.length + 1,
      });

      setValidationProgress('Done!');

      // Animate checkmark appearance
      if (!checkmarkAnimations.current[currentLineNumber]) {
        checkmarkAnimations.current[currentLineNumber] = new Animated.Value(0);
      }
      Animated.spring(checkmarkAnimations.current[currentLineNumber], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Store result
      setValidationResults(prev => ({
        ...prev,
        [currentLineNumber]: response,
      }));

      // Add to previous steps for context
      // Include ALL mathematically correct expressions, not just useful ones
      // This gives GPT-4o better context for validating subsequent steps
      if (response.mathematicallyCorrect) {
        setPreviousSteps(prev => [...prev, response.recognizedExpression]);
      }

      setFeedbackExpanded(true);
      setTimeout(() => setValidating(false), 500);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationProgress('');
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setValidating(false);
    }
  };

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

  const getLineValidation = (lineNumber: number) => validationResults[lineNumber];

  const getValidationIcon = (result: StepValidationResponse) => {
    if (result.mathematicallyCorrect && result.useful) return '✅';
    if (result.mathematicallyCorrect) return '⚠️';
    return '❌';
  };

  const getValidationColor = (result: StepValidationResponse) => {
    if (result.mathematicallyCorrect && result.useful) return '#4CAF50';
    if (result.mathematicallyCorrect) return '#FFC107';
    return '#F44336';
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />

        {/* Enhanced Problem Display */}
        <View style={styles.problemContainer}>
          <View style={styles.problemHeader}>
            <Text style={styles.problemLabel}>Solve for {currentProblem.goalState.variable}:</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{currentProblem.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.problemText}>{currentProblem.content}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
          </View>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.colorPicker}>
            <Text style={styles.colorLabel}>Ink:</Text>
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
            {currentColor && (
              <Text style={styles.colorName}>{COLOR_NAMES[currentColor as keyof typeof COLOR_NAMES]}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
            <Text style={styles.clearButtonText}>🗑️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, !showGuideLines && styles.toggleButtonOff]}
            onPress={() => setShowGuideLines(!showGuideLines)}
          >
            <Text style={styles.toggleButtonText}>📏</Text>
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <GestureDetector gesture={drawGesture}>
          <View style={styles.canvasContainer}>
            {pathStrings.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>✏️ Write your first step here!</Text>
                <Text style={styles.emptyStateHint}>Use your finger or stylus to write</Text>
              </View>
            )}
            <Canvas style={styles.canvas}>
              {/* Guide lines with numbers */}
              {showGuideLines && guideLines.map((line) => (
                <Group key={line.key}>
                  <Line
                    p1={{ x: 0, y: line.y }}
                    p2={{ x: CANVAS_WIDTH, y: line.y }}
                    color={GUIDE_LINE_COLOR}
                    strokeWidth={GUIDE_LINE_WIDTH}
                  />
                </Group>
              ))}

              {/* User strokes */}
              {pathStrings.map((pathString, index) => {
                const path = Skia.Path.MakeFromSVGString(pathString);
                if (!path) return null;
                return (
                  <Path
                    key={index}
                    path={path}
                    color={pathColors[index] || COLORS.BLACK}
                    style="stroke"
                    strokeWidth={2.5}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                );
              })}

              {/* Current path */}
              {currentPath && (
                <Path
                  path={currentPath}
                  color={currentColor}
                  style="stroke"
                  strokeWidth={2.5}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}

              {/* Validation indicators */}
              {Object.entries(validationResults).map(([lineNumStr, result]) => {
                const lineNum = parseInt(lineNumStr);
                const y = (lineNum + 0.5) * GUIDE_LINE_SPACING;
                const x = CANVAS_WIDTH - 50;
                const color = getValidationColor(result);

                return (
                  <Group key={`validation-${lineNum}`}>
                    <Circle
                      cx={x}
                      cy={y}
                      r={20}
                      color={color}
                      opacity={0.9}
                    />
                  </Group>
                );
              })}
            </Canvas>
          </View>
        </GestureDetector>

        {/* Enhanced Validation Button */}
        {hasUnvalidatedStrokes && (
          <Animated.View style={{ transform: [{ scale: validating ? 1 : pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.validateButton, validating && styles.validateButtonDisabled]}
              onPress={validateCurrentLine}
              disabled={validating}
            >
              {validating ? (
                <View style={styles.validatingContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.validateButtonText}>{validationProgress}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.validateButtonIcon}>✓</Text>
                  <Text style={styles.validateButtonText}>
                    Check Line {currentLineNumber + 1}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Enhanced Feedback Section */}
        {Object.keys(validationResults).length > 0 && (
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackHeaderText}>
                Feedback ({Object.keys(validationResults).length})
              </Text>
            </View>

            <ScrollView
              style={styles.feedbackScroll}
              contentContainerStyle={styles.feedbackScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {Object.entries(validationResults)
                .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                .map(([lineNum, result]) => (
                  <View
                    key={`feedback-${lineNum}`}
                    style={[
                      styles.feedbackCard,
                      result.mathematicallyCorrect && result.useful
                        ? styles.feedbackCorrect
                        : result.mathematicallyCorrect
                        ? styles.feedbackNudge
                        : styles.feedbackIncorrect,
                    ]}
                  >
                    <View style={styles.feedbackCardHeader}>
                      <Text style={styles.feedbackIcon}>
                        {getValidationIcon(result)}
                      </Text>
                      <View style={styles.feedbackTitleContainer}>
                        <Text style={styles.feedbackTitle}>
                          {result.mathematicallyCorrect && result.useful
                            ? 'Correct & Useful!'
                            : result.mathematicallyCorrect
                            ? 'Think About It'
                            : 'Not Quite Right'}
                        </Text>
                        <Text style={styles.feedbackLine}>Line {parseInt(lineNum) + 1}</Text>
                      </View>
                    </View>

                    {result.recognizedExpression && (
                      <View style={styles.recognizedContainer}>
                        <Text style={styles.recognizedLabel}>You wrote:</Text>
                        <Text style={styles.recognizedText}>{result.recognizedExpression}</Text>
                        <Text style={styles.confidenceText}>
                          Confidence: {Math.round(result.recognitionConfidence * 100)}%
                        </Text>
                      </View>
                    )}

                    <Text style={styles.feedbackMessage}>{result.feedbackMessage}</Text>

                    {result.nudgeMessage && (
                      <View style={styles.nudgeContainer}>
                        <Text style={styles.nudgeIcon}>💭</Text>
                        <Text style={styles.nudgeMessage}>{result.nudgeMessage}</Text>
                      </View>
                    )}

                    {result.suggestedHint && (
                      <View style={styles.hintContainer}>
                        <Text style={styles.hintIcon}>💡</Text>
                        <View>
                          <Text style={styles.hintLevel}>Hint (Level {result.suggestedHint.level}):</Text>
                          <Text style={styles.hintText}>{result.suggestedHint.text}</Text>
                        </View>
                      </View>
                    )}

                    {result.progressScore !== undefined && (
                      <View style={styles.stepProgressContainer}>
                        <Text style={styles.stepProgressLabel}>Step Progress:</Text>
                        <View style={styles.stepProgressBar}>
                          <View
                            style={[
                              styles.stepProgressFill,
                              { width: `${result.progressScore * 100}%` }
                            ]}
                          />
                        </View>
                        <Text style={styles.stepProgressText}>
                          {Math.round(result.progressScore * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Info Bar */}
        <View style={styles.infoContainer}>
          <Text style={styles.info}>
            Steps: {previousSteps.length} | Strokes: {pathStrings.length}
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
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  problemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  difficultyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  problemText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    gap: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  colorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  colorName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#f44336',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
  },
  toggleButton: {
    backgroundColor: '#666',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonOff: {
    backgroundColor: '#ccc',
  },
  toggleButtonText: {
    fontSize: 20,
  },
  canvasContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 14,
    color: '#bbb',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  validateButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  validateButtonDisabled: {
    backgroundColor: '#9E9E9E',
    shadowColor: '#000',
  },
  validateButtonIcon: {
    fontSize: 24,
    color: '#fff',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  validatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackSection: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  feedbackHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedbackHeaderIcon: {
    fontSize: 12,
    color: '#666',
  },
  feedbackScroll: {
    maxHeight: 400,
    minHeight: 150,
  },
  feedbackScrollContent: {
    paddingBottom: 20,
  },
  feedbackCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedbackCorrect: {
    backgroundColor: '#f1f8f4',
  },
  feedbackNudge: {
    backgroundColor: '#fffbf0',
  },
  feedbackIncorrect: {
    backgroundColor: '#fef5f5',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  feedbackTitleContainer: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  feedbackLine: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recognizedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recognizedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  confidenceText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  feedbackMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  nudgeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  nudgeIcon: {
    fontSize: 20,
  },
  nudgeMessage: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
  },
  hintContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#1976D2',
  },
  stepProgressContainer: {
    marginTop: 12,
  },
  stepProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stepProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  stepProgressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  infoContainer: {
    padding: 12,
    alignItems: 'center',
  },
  info: {
    fontSize: 12,
    color: '#999',
  },
});
