/**
 * Math Tutor App - Enhanced Version
 * Sprint 5-6: Multiple Problems + Problem Generator + Speech + Mastery Tracking
 */

import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, View, Text, Dimensions, SafeAreaView,
  TouchableOpacity, ActivityIndicator, ScrollView, Animated, Modal
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Canvas, Path, Skia, SkPath, Line, Group, Circle } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gpt4oValidationAPI } from './src/infrastructure/api/GPT4oValidationAPI';
import { CanvasImageCapture } from './src/utils/CanvasImageCapture';
import { LatexToSpeech } from './src/utils/LatexToSpeech';
import type { Problem, StepValidationResponse } from './src/types';
import { EASY_PROBLEMS, MEDIUM_PROBLEMS, HARD_PROBLEMS, getSimilarProblem, getHarderProblem } from './src/data/problemLibrary';
import { StepProgressIndicator } from './src/components/StepProgressIndicator';
import { masteryService } from './src/services/MasteryService';
import type { MasteryState, ProblemAttempt } from './src/types/mastery';
import { problemGenerator } from './src/services/ProblemGeneratorService';
import type { DifficultyLevel } from './src/services/ProblemGeneratorService';
import { useVoiceCommands } from './src/hooks/useVoiceCommands';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45;

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

export default function App() {
  // Canvas state
  const [pathStrings, setPathStrings] = useState<string[]>([]);
  const [pathColors, setPathColors] = useState<string[]>([]);
  const [pathLineNumbers, setPathLineNumbers] = useState<number[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [currentColor, setCurrentColor] = useState<string>(COLORS.BLACK);
  const [showGuideLines, setShowGuideLines] = useState<boolean>(true);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState<string>('');
  const [validationResults, setValidationResults] = useState<{ [lineNumber: number]: StepValidationResponse }>({});
  const [previousSteps, setPreviousSteps] = useState<string[]>([]);
  const [stepCorrectness, setStepCorrectness] = useState<boolean[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem>(EASY_PROBLEMS[0]);
  const [feedbackExpanded, setFeedbackExpanded] = useState(true);
  const [autoValidate, setAutoValidate] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [totalStepsEstimate, setTotalStepsEstimate] = useState<number | null>(null); // null = unknown, number = estimated total
  const lastValidatedLineRef = useRef<number>(-1);
  const isValidatingRef = useRef<boolean>(false);

  // Hint state
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState<number>(0);
  const [showHintSuggestion, setShowHintSuggestion] = useState<boolean>(false);
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  // Problem completion state
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionCelebration, setCompletionCelebration] = useState<string>('');

  // Problem selection state
  const [showProblemSelector, setShowProblemSelector] = useState<boolean>(false);

  // Mastery state
  const [masteryState, setMasteryState] = useState<MasteryState | null>(null);

  // Animation refs
  const checkmarkAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pathRef = useRef<SkPath | null>(null);
  const colorRef = useRef<string>(COLORS.BLACK);
  const startYRef = useRef<number>(0);
  const isErasingRef = useRef<boolean>(false);

  // Theme colors
  const theme = darkMode ? {
    background: '#1e1e1e',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#404040',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  } : {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  };

  // Load dark mode preference
  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('darkMode');
        if (stored !== null) {
          setDarkMode(stored === 'true');
        }
      } catch (error) {
        console.error('Failed to load dark mode preference:', error);
      }
    };
    loadDarkMode();
  }, []);

  // Load mastery state
  useEffect(() => {
    const loadMastery = async () => {
      const state = await masteryService.loadMasteryState();
      setMasteryState(state);
    };
    loadMastery();
  }, [currentProblem.id]);

  // Debug: Track totalStepsEstimate changes
  useEffect(() => {
    console.log('🔔 STATE UPDATE: totalStepsEstimate =', totalStepsEstimate);
  }, [totalStepsEstimate]);

  // Debug: Track currentStep changes
  useEffect(() => {
    console.log('🔔 STATE UPDATE: currentStep =', currentStep);
  }, [currentStep]);

  // Initialize total steps estimate when problem changes
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 PROBLEM CHANGED - Initializing Step Estimate');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Problem ID:', currentProblem.id);
    console.log('📊 Problem Difficulty:', currentProblem.difficulty);
    console.log('🎯 Problem expectedSteps:', currentProblem.expectedSteps);

    // Use problem's expectedSteps, or fall back to default based on difficulty
    const getDefaultSteps = (difficulty: string): number => {
      switch (difficulty) {
        case 'easy': return 2;
        case 'medium': return 3;
        case 'hard': return 4;
        default: return 3;
      }
    };

    const estimate = currentProblem.expectedSteps || getDefaultSteps(currentProblem.difficulty);
    console.log('✅ Setting totalStepsEstimate to:', estimate);
    console.log('   (from:', currentProblem.expectedSteps ? 'problem.expectedSteps' : 'difficulty default', ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setTotalStepsEstimate(estimate);
  }, [currentProblem.id, currentProblem.expectedSteps, currentProblem.difficulty]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      await AsyncStorage.setItem('darkMode', String(newMode));
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  }, [darkMode]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Speak problem introduction when problem changes
  useEffect(() => {
    if (voiceFeedback && currentProblem.introductionText) {
      const speakableText = LatexToSpeech.convert(currentProblem.introductionText);
      Speech.speak(speakableText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });
    }
  }, [currentProblem.id, voiceFeedback]);

  const speakFeedback = useCallback((message: string) => {
    if (!voiceFeedback) return;
    try {
      const speakableText = LatexToSpeech.convert(message);
      Speech.speak(speakableText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('Speech failed:', error);
    }
  }, [voiceFeedback]);

  const speakHint = useCallback((hint: string) => {
    if (!voiceFeedback) return;
    try {
      const speakableText = LatexToSpeech.convert(hint);
      Speech.speak(speakableText, {
        language: 'en-US',
        pitch: 0.95,
        rate: 0.85,
      });
    } catch (error) {
      console.error('Hint speech failed:', error);
    }
  }, [voiceFeedback]);

  // Voice commands integration
  const {
    isListening,
    startListening,
    stopListening,
    error: voiceError
  } = useVoiceCommands({
    handlers: {
      onHint: () => {
        console.log('📢 Voice command: Request hint');
        if (currentProblem.hintLibrary) {
          setShowHintSuggestion(true);
          const hintKey = Object.keys(currentProblem.hintLibrary)[0];
          if (hintKey) {
            const hints = currentProblem.hintLibrary[hintKey];
            const levelKey = `level${hintLevel}` as keyof typeof hints;
            const hint = hints[levelKey];
            if (hint) {
              setCurrentHint(hint);
              speakHint(hint);
            }
          }
        } else {
          speakFeedback("I don't have a hint library for this problem yet.");
        }
      },
      onExplain: async () => {
        console.log('📢 Voice command: Request explanation');
        if (previousSteps.length === 0) {
          speakFeedback("Let's start by writing your first step!");
          return;
        }

        const lastStep = previousSteps[previousSteps.length - 1];
        try {
          const explanation = await gpt4oValidationAPI.requestExplanation({
            problem: currentProblem,
            previousSteps: previousSteps.slice(0, -1),
            currentStep: lastStep,
            prompt: "Why does this step work? Explain the mathematical reasoning."
          });
          speakFeedback(explanation);
        } catch (error) {
          console.error('Explanation request failed:', error);
          speakFeedback("I'm having trouble generating an explanation right now.");
        }
      },
      onNewProblem: () => {
        console.log('📢 Voice command: New problem');
        setShowProblemSelector(true);
        speakFeedback("Opening problem selector");
      },
      onReadProblem: () => {
        console.log('📢 Voice command: Read problem');
        const problemText = LatexToSpeech.convert(currentProblem.content);
        const intro = currentProblem.introductionText ? LatexToSpeech.convert(currentProblem.introductionText) : '';
        Speech.speak(`${intro} The problem is: ${problemText}`, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
        });
      },
      onClear: () => {
        console.log('📢 Voice command: Clear canvas');
        clearCanvas();
        speakFeedback("Canvas cleared");
      },
    },
    enableAnswerMode: false,
    contextualStrings: ['algebra', 'equation', 'solve', 'x', 'variable'],
  });

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      console.error('Voice recognition error:', voiceError);
      if (voiceError.includes('permission')) {
        speakFeedback("Microphone permission is required for voice commands.");
      }
    }
  }, [voiceError, speakFeedback]);

  const getLineNumber = (y: number): number => Math.floor(y / GUIDE_LINE_SPACING);

  const addCompletedStroke = useCallback((pathString: string, color: string, lineNumber: number) => {
    setPathStrings(prev => [...prev, pathString]);
    setPathColors(prev => [...prev, color]);
    setPathLineNumbers(prev => [...prev, lineNumber]);
  }, []);

  const eraseStrokesAtPoint = useCallback((x: number, y: number) => {
    const ERASER_RADIUS = 30; // Radius in pixels for eraser

    // Find strokes to keep (those NOT touched by eraser)
    const strokesToKeep: number[] = [];

    pathStrings.forEach((pathString, index) => {
      const path = Skia.Path.MakeFromSVGString(pathString);
      if (!path) {
        strokesToKeep.push(index);
        return;
      }

      // Check if eraser point is within ERASER_RADIUS of any point on the path
      let shouldErase = false;
      const bounds = path.getBounds();

      // Quick bounds check first
      if (
        x >= bounds.x - ERASER_RADIUS &&
        x <= bounds.x + bounds.width + ERASER_RADIUS &&
        y >= bounds.y - ERASER_RADIUS &&
        y <= bounds.y + bounds.height + ERASER_RADIUS
      ) {
        // More detailed check: sample points along the path
        const pathLength = path.length();
        const samples = 20; // Number of points to check

        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const point = path.getPoint(t * pathLength);
          const distance = Math.sqrt(
            Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
          );

          if (distance <= ERASER_RADIUS) {
            shouldErase = true;
            break;
          }
        }
      }

      if (!shouldErase) {
        strokesToKeep.push(index);
      }
    });

    // Update state to keep only non-erased strokes
    if (strokesToKeep.length < pathStrings.length) {
      setPathStrings(prev => strokesToKeep.map(i => prev[i]));
      setPathColors(prev => strokesToKeep.map(i => prev[i]));
      setPathLineNumbers(prev => strokesToKeep.map(i => prev[i]));
      console.log(`🧹 Erased ${pathStrings.length - strokesToKeep.length} stroke(s)`);
    }
  }, [pathStrings]);

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
      if (!lineGroups[lineNum]) lineGroups[lineNum] = [];
      lineGroups[lineNum].push(index);
    });
    return lineGroups;
  }, [pathLineNumbers]);

  const strokesByLine = getStrokesByLine();

  const clearCanvas = useCallback((problem?: Problem) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 CLEAR CANVAS Called');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Problem passed as parameter?', problem ? 'YES' : 'NO');
    if (problem) {
      console.log('   Parameter Problem ID:', problem.id);
      console.log('   Parameter Problem Difficulty:', problem.difficulty);
      console.log('   Parameter Problem expectedSteps:', problem.expectedSteps);
    }
    console.log('📦 Current Problem (from closure):');
    console.log('   Current Problem ID:', currentProblem.id);
    console.log('   Current Problem Difficulty:', currentProblem.difficulty);
    console.log('   Current Problem expectedSteps:', currentProblem.expectedSteps);

    setPathStrings([]);
    setPathColors([]);
    setPathLineNumbers([]);
    setValidationResults({});
    setPreviousSteps([]);
    setStepCorrectness([]);
    setCurrentStep(1);
    setCompletedSteps([]);

    // Reset total steps estimate with fallback to difficulty-based defaults
    // Use provided problem or fall back to current problem
    const prob = problem || currentProblem;
    const getDefaultSteps = (difficulty: string): number => {
      switch (difficulty) {
        case 'easy': return 2;
        case 'medium': return 3;
        case 'hard': return 4;
        default: return 3;
      }
    };
    const estimate = prob.expectedSteps || getDefaultSteps(prob.difficulty);
    console.log('🎯 Using problem for estimate:', prob.id);
    console.log('✅ Setting totalStepsEstimate to:', estimate);
    console.log('   (from:', prob.expectedSteps ? 'problem.expectedSteps' : 'difficulty default', ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setTotalStepsEstimate(estimate);

    setConsecutiveIncorrect(0);
    setShowHintSuggestion(false);
    setHintLevel(1);
    setCurrentHint(null);
    lastValidatedLineRef.current = -1;
  }, [currentProblem]);

  const toggleEraser = useCallback(() => {
    const newErasingState = !isErasing;
    setIsErasing(newErasingState);
    isErasingRef.current = newErasingState;
    console.log('🖍️ Eraser mode:', newErasingState ? 'ON' : 'OFF');
  }, [isErasing]);

  const getCurrentLineNumber = () => {
    const lineNumbers = Object.keys(strokesByLine).map(Number).sort((a, b) => b - a);
    return lineNumbers.length > 0 ? lineNumbers[0] : null;
  };

  const currentLineNumber = getCurrentLineNumber();
  const hasUnvalidatedStrokes = currentLineNumber !== null && !validationResults[currentLineNumber];

  const calculateProgress = () => {
    const maxProgress = Math.max(0, ...Object.values(validationResults).map(r => r.progressScore || 0));
    return Math.round(maxProgress * 100);
  };

  const progress = calculateProgress();

  // Check if problem is complete
  const isProblemComplete = progress >= 95 || Object.values(validationResults).some(
    r => r.progressScore && r.progressScore >= 0.95
  );

  // Show completion modal when problem is complete
  useEffect(() => {
    if (isProblemComplete && !showCompletionModal && previousSteps.length > 0) {
      const celebration = ['🎉', '🎊', '🌟', '✨', '🏆'][Math.floor(Math.random() * 5)];
      setCompletionCelebration(celebration);
      setShowCompletionModal(true);

      // Record completion in mastery service
      const attempt: ProblemAttempt = {
        problemId: currentProblem.id,
        difficulty: currentProblem.difficulty,
        solved: true,
        timeSpent: 0,
        hintsUsed: hintLevel > 1 ? hintLevel - 1 : 0,
        incorrectAttempts: consecutiveIncorrect,
        timestamp: new Date(),
      };

      // Update mastery state asynchronously
      (async () => {
        const currentState = await masteryService.loadMasteryState();
        const newState = masteryService.updateMasteryState(currentState, attempt);
        await masteryService.saveMasteryState(newState);
        setMasteryState(newState);
      })();

      if (voiceFeedback) {
        Speech.speak("Excellent work! You've solved the problem!", {
          language: 'en-US',
          pitch: 1.1,
          rate: 0.9,
        });
      }
    }
  }, [isProblemComplete, showCompletionModal, previousSteps.length, currentProblem.id, voiceFeedback, hintLevel]);

  const handleTrySimilar = useCallback(() => {
    const similarProblem = getSimilarProblem(currentProblem.id);
    setCurrentProblem(similarProblem);
    clearCanvas(similarProblem); // Pass new problem to avoid stale closure
    setShowCompletionModal(false);
  }, [currentProblem.id, clearCanvas]);

  const handleTryHarder = useCallback(() => {
    const harderProblem = getHarderProblem(currentProblem.id);
    setCurrentProblem(harderProblem);
    clearCanvas(harderProblem); // Pass new problem to avoid stale closure
    setShowCompletionModal(false);
  }, [currentProblem.id, clearCanvas]);

  const validateCurrentLine = async (manualTrigger = false) => {
    if (isValidatingRef.current) {
      console.log('Validation already in progress, skipping...');
      return;
    }

    if (!currentLineNumber || validationResults[currentLineNumber]) {
      return;
    }

    if (!manualTrigger && !autoValidate) {
      return;
    }

    try {
      isValidatingRef.current = true;
      setValidating(true);
      setValidationProgress('Reading your handwriting...');

      // Convert ALL path strings to Skia paths and send full canvas to OCR
      const allStrokes = pathStrings.map((pathString, idx) => {
        const path = Skia.Path.MakeFromSVGString(pathString);
        return { path: path!, color: pathColors[idx] };
      });

      const imageBase64 = await CanvasImageCapture.captureStrokesAsBase64(
        allStrokes,
        { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
      );

      setValidationProgress('Checking your math...');

      const response = await gpt4oValidationAPI.validateStep({
        canvasImageBase64: imageBase64,
        problem: currentProblem,
        previousSteps,
        currentStepNumber: previousSteps.length + 1,
        expectedSolutionSteps: currentProblem.expectedSolutionSteps,
      });

      setValidationProgress('Done!');

      if (!checkmarkAnimations.current[currentLineNumber]) {
        checkmarkAnimations.current[currentLineNumber] = new Animated.Value(0);
      }
      Animated.spring(checkmarkAnimations.current[currentLineNumber], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      setValidationResults(prev => ({ ...prev, [currentLineNumber]: response }));

      if (response.mathematicallyCorrect) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ STEP VALIDATED - CORRECT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Expression:', response.recognizedExpression);
        console.log('📊 Progress Score:', response.progressScore);
        console.log('🎯 Estimated Steps Remaining:', response.estimatedStepsRemaining);
        console.log('🔢 Current Step (before increment):', currentStep);

        setPreviousSteps(prev => [...prev, response.recognizedExpression]);
        setStepCorrectness(prev => [...prev, true]);
        setCompletedSteps(prev => [...prev, currentStep]);
        setCurrentStep(prev => {
          console.log('   Incrementing currentStep from', prev, 'to', prev + 1);
          return prev + 1;
        });
        setConsecutiveIncorrect(0);
        setShowHintSuggestion(false);

        // Update total steps estimate based on GPT-4o's remaining steps estimate
        if (response.estimatedStepsRemaining !== undefined) {
          const newTotal = currentStep + response.estimatedStepsRemaining;
          console.log('🔄 Updating Total Steps Estimate:');
          console.log('   Current Step:', currentStep);
          console.log('   Estimated Remaining:', response.estimatedStepsRemaining);
          console.log('   Calculated New Total:', newTotal);

          setTotalStepsEstimate(prev => {
            console.log('   Previous Total Estimate:', prev);
            if (prev === null) {
              console.log('   ✅ Setting to new total:', newTotal);
              return newTotal;
            }
            const finalTotal = Math.max(prev, newTotal);
            console.log('   ✅ Setting to max(prev, newTotal):', finalTotal);
            return finalTotal;
          });
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        speakFeedback(response.feedbackMessage);
      } else {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ STEP VALIDATED - INCORRECT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Expression:', response.recognizedExpression);
        console.log('🎯 Validation Confidence:', response.validationConfidence);
        console.log('❓ Error Type:', response.errorType);
        console.log('📂 Error Category:', response.errorCategory);
        console.log('💬 Feedback:', response.feedbackMessage);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        setStepCorrectness(prev => [...prev, false]);
        const newConsecutive = consecutiveIncorrect + 1;
        setConsecutiveIncorrect(newConsecutive);

        if (newConsecutive >= 2 && currentProblem.hintLibrary) {
          setShowHintSuggestion(true);
          const hintKey = Object.keys(currentProblem.hintLibrary)[0];
          if (hintKey) {
            const hints = currentProblem.hintLibrary[hintKey];
            const levelKey = `level${hintLevel}` as keyof typeof hints;
            const hint = hints[levelKey];
            if (hint) {
              setCurrentHint(hint);
              speakHint(hint);
            }
          }
        } else {
          speakFeedback(response.feedbackMessage);
        }
      }

      setFeedbackExpanded(true);
      lastValidatedLineRef.current = currentLineNumber;
      setTimeout(() => {
        setValidating(false);
        isValidatingRef.current = false;
      }, 500);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationProgress('');
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setValidating(false);
      isValidatingRef.current = false;
    }
  };

  // Debug: Log available touch/stylus properties
  const logTouchProperties = useCallback((event: any) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖊️ TOUCH EVENT PROPERTIES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('touchType:', event.touchType);
    console.log('pointerType:', event.pointerType);
    console.log('altitudeAngle:', event.altitudeAngle);
    console.log('azimuthAngle:', event.azimuthAngle);
    console.log('force:', event.force);
    console.log('maximumPossibleForce:', event.maximumPossibleForce);
    console.log('All properties:', Object.keys(event));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, []);

  const handleGenerateProblem = async (difficulty: DifficultyLevel) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎲 GENERATE PROBLEM Requested');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Requested Difficulty:', difficulty);
      console.log('⏳ Calling problemGenerator.generateProblem()...');

      setShowProblemSelector(false);
      const newProblem = await problemGenerator.generateProblem(difficulty);

      console.log('✅ Problem Generated:');
      console.log('   ID:', newProblem.id);
      console.log('   Content:', newProblem.content);
      console.log('   Difficulty:', newProblem.difficulty);
      console.log('   Expected Steps:', newProblem.expectedSteps);
      console.log('   Expected Solution Steps:', newProblem.expectedSolutionSteps);
      console.log('🔄 Setting currentProblem state...');

      setCurrentProblem(newProblem);

      console.log('🧹 Calling clearCanvas with new problem...');
      clearCanvas(newProblem); // Pass new problem to avoid stale closure
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ Problem generation failed:', error);
      alert('Failed to generate problem. Please try again.');
    }
  };

  const drawGesture = useMemo(() =>
    Gesture.Pan()
      .averageTouches(true)
      .maxPointers(1)
      .onBegin((e) => {
        'worklet';
        if (isErasingRef.current) {
          // Eraser mode
          runOnJS(setEraserPosition)({ x: e.x, y: e.y });
          runOnJS(eraseStrokesAtPoint)(e.x, e.y);
        } else {
          // Draw mode
          const path = Skia.Path.Make();
          path.moveTo(e.x, e.y);
          pathRef.current = path;
          startYRef.current = e.y;
          runOnJS(setCurrentPath)(path);
        }
      })
      .onUpdate((e) => {
        'worklet';
        if (isErasingRef.current) {
          // Eraser mode - continuous erasing while dragging
          runOnJS(setEraserPosition)({ x: e.x, y: e.y });
          runOnJS(eraseStrokesAtPoint)(e.x, e.y);
        } else {
          // Draw mode
          if (pathRef.current) {
            pathRef.current.lineTo(e.x, e.y);
            runOnJS(setCurrentPath)(pathRef.current.copy());
          }
        }
      })
      .onEnd(() => {
        'worklet';
        if (isErasingRef.current) {
          // Eraser mode - clear eraser position indicator
          runOnJS(setEraserPosition)(null);
        } else {
          // Draw mode
          if (pathRef.current) {
            const pathString = pathRef.current.toSVGString();
            const strokeColor = colorRef.current;
            const lineNumber = Math.floor(startYRef.current / GUIDE_LINE_SPACING);
            runOnJS(addCompletedStroke)(pathString, strokeColor, lineNumber);
          }
          pathRef.current = null;
          runOnJS(setCurrentPath)(null);
        }
      })
  , [addCompletedStroke, eraseStrokesAtPoint]);

  const getValidationIcon = (result: StepValidationResponse) => {
    // If mathematically correct, always show green checkmark
    // (even if not "useful" - correctness is what matters)
    if (result.mathematicallyCorrect) return '✅';
    return '❌';
  };

  const getValidationColor = (result: StepValidationResponse) => {
    // If mathematically correct, always show success color
    if (result.mathematicallyCorrect) return theme.success;
    return theme.error;
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={darkMode ? "light" : "dark"} />

        {/* Problem Display */}
        <View style={[styles.problemContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.problemHeader}>
            <View style={styles.problemHeaderLeft}>
              <Text style={[styles.problemLabel, { color: theme.textSecondary }]}>
                Solve for {currentProblem.goalState.variable}:
              </Text>
              <View style={[styles.difficultyBadge, {
                backgroundColor: currentProblem.difficulty === 'easy' ? '#4CAF50' :
                  currentProblem.difficulty === 'medium' ? '#FFC107' : '#F44336'
              }]}>
                <Text style={styles.difficultyText}>{currentProblem.difficulty}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.changeProblemButton} onPress={() => setShowProblemSelector(true)}>
              <Text style={styles.changeProblemButtonText}>📝</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.problemText, { color: theme.text }]}>{currentProblem.content}</Text>

          {/* Progress Bar - Shows total from problem or dynamically adjusts */}
          <StepProgressIndicator
            currentStep={currentStep}
            totalSteps={totalStepsEstimate || currentStep} // Show current if unknown
            completedSteps={completedSteps}
          />
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: theme.surface }]}>
          <View style={styles.colorPicker}>
            <Text style={[styles.colorLabel, { color: theme.textSecondary }]}>Ink:</Text>
            <View style={styles.colorButtons}>
              {Object.entries(COLORS).map(([name, color]) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    currentColor === color && !isErasing && styles.colorButtonSelected,
                  ]}
                  onPress={() => {
                    setCurrentColor(color);
                    colorRef.current = color;
                    // Deactivate eraser when selecting a color
                    if (isErasing) {
                      setIsErasing(false);
                      isErasingRef.current = false;
                    }
                  }}
                >
                  {currentColor === color && !isErasing && <View style={styles.checkmark} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              isErasing && styles.colorButtonSelected
            ]}
            onPress={toggleEraser}
          >
            <Text style={styles.toggleButtonText}>🧹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
            <Text style={styles.clearButtonText}>🗑️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, !showGuideLines && styles.toggleButtonOff]}
            onPress={() => setShowGuideLines(!showGuideLines)}
          >
            <Text style={styles.toggleButtonText}>📏</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, !autoValidate && styles.toggleButtonOff]}
            onPress={() => setAutoValidate(!autoValidate)}
          >
            <Text style={styles.toggleButtonText}>⚡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, !voiceFeedback && styles.toggleButtonOff]}
            onPress={() => {
              setVoiceFeedback(!voiceFeedback);
              if (voiceFeedback) Speech.stop();
            }}
          >
            <Text style={styles.toggleButtonText}>{voiceFeedback ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              isListening && styles.microphoneListening
            ]}
            onPress={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
          >
            <Text style={styles.toggleButtonText}>🎤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, !darkMode && styles.toggleButtonOff]}
            onPress={toggleDarkMode}
          >
            <Text style={styles.toggleButtonText}>{darkMode ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <GestureDetector gesture={drawGesture}>
          <View style={[styles.canvasContainer, { backgroundColor: theme.surface }]}>
            {pathStrings.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  ✏️ Write your first step here!
                </Text>
              </View>
            )}
            {isListening && (
              <View style={styles.listeningIndicator}>
                <View style={styles.listeningBadge}>
                  <Text style={styles.listeningText}>🎤 Listening...</Text>
                </View>
              </View>
            )}
            <Canvas style={styles.canvas}>
              {showGuideLines && guideLines.map((line) => (
                <Line
                  key={line.key}
                  p1={{ x: 0, y: line.y }}
                  p2={{ x: CANVAS_WIDTH, y: line.y }}
                  color={GUIDE_LINE_COLOR}
                  strokeWidth={GUIDE_LINE_WIDTH}
                />
              ))}

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

              {currentPath && !isErasing && (
                <Path
                  path={currentPath}
                  color={currentColor}
                  style="stroke"
                  strokeWidth={2.5}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}

              {/* Eraser indicator */}
              {isErasing && eraserPosition && (
                <>
                  {/* Outer circle - eraser boundary */}
                  <Circle
                    cx={eraserPosition.x}
                    cy={eraserPosition.y}
                    r={30}
                    color="rgba(255, 100, 100, 0.3)"
                    style="stroke"
                    strokeWidth={2}
                  />
                  {/* Inner circle - center dot */}
                  <Circle
                    cx={eraserPosition.x}
                    cy={eraserPosition.y}
                    r={3}
                    color="rgba(255, 100, 100, 0.6)"
                  />
                </>
              )}
            </Canvas>
          </View>
        </GestureDetector>

        {/* Hint Banner */}
        {showHintSuggestion && currentHint && (
          <View style={[styles.hintBanner, { backgroundColor: theme.warning }]}>
            <View style={styles.hintHeader}>
              <Text style={styles.hintIcon}>💡</Text>
              <Text style={styles.hintLabel}>Need a hint? (Level {hintLevel})</Text>
              <TouchableOpacity
                style={styles.hintCloseButton}
                onPress={() => setShowHintSuggestion(false)}
              >
                <Text style={styles.hintCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>{currentHint}</Text>
          </View>
        )}

        {/* Validation Button */}
        {hasUnvalidatedStrokes && !autoValidate && (
          <Animated.View style={{ transform: [{ scale: validating ? 1 : pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.validateButton, validating && styles.validateButtonDisabled]}
              onPress={() => validateCurrentLine(true)}
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
                  <Text style={styles.validateButtonText}>Check My Work</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Feedback Section */}
        {Object.keys(validationResults).length > 0 && (
          <View style={[styles.feedbackSection, { backgroundColor: theme.surface }]}>
            <View style={[styles.feedbackHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.feedbackHeaderText, { color: theme.text }]}>
                Feedback ({Object.keys(validationResults).length})
              </Text>
            </View>

            <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
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
                      <Text style={styles.feedbackIcon}>{getValidationIcon(result)}</Text>
                      <View style={styles.feedbackTitleContainer}>
                        <Text style={[styles.feedbackTitle, { color: theme.text }]}>
                          {result.mathematicallyCorrect && result.useful
                            ? 'Correct & Useful!'
                            : result.mathematicallyCorrect
                            ? 'Think About It'
                            : 'Not Quite Right'}
                        </Text>
                        <Text style={[styles.feedbackLine, { color: theme.textSecondary }]}>
                          Line {parseInt(lineNum) + 1}
                        </Text>
                      </View>
                    </View>

                    {result.recognizedExpression && (
                      <View style={styles.recognizedContainer}>
                        <Text style={styles.recognizedLabel}>You wrote:</Text>
                        <Text style={styles.recognizedText}>{result.recognizedExpression}</Text>
                      </View>
                    )}

                    <Text style={[styles.feedbackMessage, { color: theme.text }]}>
                      {result.feedbackMessage}
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Problem Selector Modal */}
        <Modal
          visible={showProblemSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProblemSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Choose a Problem</Text>

              <ScrollView style={styles.problemList}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Library Problems</Text>
                <View style={styles.difficultyGroup}>
                  <Text style={[styles.difficultyGroupTitle, { color: theme.text }]}>Easy</Text>
                  {EASY_PROBLEMS.map(problem => (
                    <TouchableOpacity
                      key={problem.id}
                      style={[styles.problemItem, { borderColor: theme.border }]}
                      onPress={() => {
                        setCurrentProblem(problem);
                        clearCanvas(problem); // Pass problem to avoid stale closure
                        setShowProblemSelector(false);
                      }}
                    >
                      <Text style={[styles.problemItemText, { color: theme.text }]}>
                        {problem.content}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.difficultyGroup}>
                  <Text style={[styles.difficultyGroupTitle, { color: theme.text }]}>Medium</Text>
                  {MEDIUM_PROBLEMS.map(problem => (
                    <TouchableOpacity
                      key={problem.id}
                      style={[styles.problemItem, { borderColor: theme.border }]}
                      onPress={() => {
                        setCurrentProblem(problem);
                        clearCanvas(problem); // Pass problem to avoid stale closure
                        setShowProblemSelector(false);
                      }}
                    >
                      <Text style={[styles.problemItemText, { color: theme.text }]}>
                        {problem.content}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.difficultyGroup}>
                  <Text style={[styles.difficultyGroupTitle, { color: theme.text }]}>Hard</Text>
                  {HARD_PROBLEMS.map(problem => (
                    <TouchableOpacity
                      key={problem.id}
                      style={[styles.problemItem, { borderColor: theme.border }]}
                      onPress={() => {
                        setCurrentProblem(problem);
                        clearCanvas(problem); // Pass problem to avoid stale closure
                        setShowProblemSelector(false);
                      }}
                    >
                      <Text style={[styles.problemItemText, { color: theme.text }]}>
                        {problem.content}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Generate New</Text>
                <View style={styles.generateButtons}>
                  <TouchableOpacity
                    style={[styles.generateButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleGenerateProblem('easy')}
                  >
                    <Text style={styles.generateButtonText}>Easy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.generateButton, { backgroundColor: '#FFC107' }]}
                    onPress={() => handleGenerateProblem('medium')}
                  >
                    <Text style={styles.generateButtonText}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.generateButton, { backgroundColor: '#F44336' }]}
                    onPress={() => handleGenerateProblem('hard')}
                  >
                    <Text style={styles.generateButtonText}>Hard</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProblemSelector(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Completion Modal */}
        <Modal
          visible={showCompletionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCompletionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <Text style={styles.celebrationEmoji}>{completionCelebration}</Text>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Problem Complete!</Text>
              <Text style={[styles.completionMessage, { color: theme.textSecondary }]}>
                You solved it in {previousSteps.length} steps!
              </Text>

              {masteryState && (
                <View style={styles.masteryInfo}>
                  <Text style={[styles.masteryText, { color: theme.textSecondary }]}>
                    Mastery: {(masteryState.masteryLevels[currentProblem.difficulty] * 100).toFixed(0)}%
                  </Text>
                </View>
              )}

              <View style={styles.completionButtons}>
                <TouchableOpacity
                  style={[styles.completionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={handleTrySimilar}
                >
                  <Text style={styles.completionButtonText}>Try Similar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.completionButton, { backgroundColor: '#F44336' }]}
                  onPress={handleTryHarder}
                >
                  <Text style={styles.completionButtonText}>Try Harder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.completionButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => setShowCompletionModal(false)}
                >
                  <Text style={styles.completionButtonText}>Choose Problem</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  problemContainer: {
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
  problemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  problemLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyBadge: {
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
  changeProblemButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeProblemButtonText: {
    fontSize: 20,
  },
  problemText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
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
  microphoneListening: {
    backgroundColor: '#FF5722',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleButtonText: {
    fontSize: 20,
  },
  canvasContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
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
  },
  listeningIndicator: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  listeningBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  listeningText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  hintBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  hintLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hintCloseButton: {
    padding: 4,
  },
  hintCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
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
    borderBottomWidth: 1,
  },
  feedbackHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackScroll: {
    maxHeight: 300,
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
  },
  feedbackLine: {
    fontSize: 12,
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
  feedbackMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  problemList: {
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  difficultyGroup: {
    marginBottom: 20,
  },
  difficultyGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  problemItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  problemItemText: {
    fontSize: 16,
  },
  generateButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  generateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  celebrationEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  completionMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  masteryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  masteryText: {
    fontSize: 14,
  },
  completionButtons: {
    gap: 12,
  },
  completionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  completionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
