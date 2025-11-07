/**
 * Math Tutor App - Enhanced Version
 * Sprint 5-6: Multiple Problems + Problem Generator + Speech + Mastery Tracking
 */

import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, View, Text, Dimensions, SafeAreaView,
  TouchableOpacity, ActivityIndicator, ScrollView, Animated, Modal, Platform
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
import { useInactivityDetection, getCheckInMessage } from './src/hooks/useInactivityDetection';
import { socraticQuestionService } from './src/services/SocraticQuestionService';
import { dialogueManager } from './src/services/DialogueManager';

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

  // Answer mode state (for two-way dialogue)
  const [waitingForAnswer, setWaitingForAnswer] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);

  // AI speaking state
  const [isAISpeaking, setIsAISpeaking] = useState<boolean>(false);

  // Validated text animation state
  const [validatedTexts, setValidatedTexts] = useState<{
    [lineNum: number]: {
      text: string;
      animatedY: Animated.Value;
      animatedOpacity: Animated.Value;
      originalY: number;
    };
  }>({});

  // Animation refs
  const checkmarkAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const answerModePulseAnim = useRef(new Animated.Value(1)).current;
  const answerBadgeFadeAnim = useRef(new Animated.Value(0)).current;
  const soundBar1Anim = useRef(new Animated.Value(0.5)).current;
  const soundBar2Anim = useRef(new Animated.Value(0.5)).current;
  const soundBar3Anim = useRef(new Animated.Value(0.5)).current;
  const feedbackSlideAnim = useRef(new Animated.Value(10)).current;
  const pathRef = useRef<SkPath | null>(null);
  const colorRef = useRef<string>(COLORS.BLACK);
  const startYRef = useRef<number>(0);
  const isErasingRef = useRef<boolean>(false);

  // Theme colors - New design tokens
  const theme = darkMode ? {
    bg: '#0F1419',
    cardBg: '#1A1F2E',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    border: '#2D3748',
    canvasBg: '#1A1F2E',
    canvasLine: '#2D3748',
    primary: '#3B82F6',
    success: '#10B981',
    successBg: '#D1FAE5',
    successText: '#065F46',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    error: '#EF4444',
  } : {
    bg: '#F8F9FA',
    cardBg: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    canvasBg: '#FFFFFF',
    canvasLine: '#F3F4F6',
    primary: '#3B82F6',
    success: '#10B981',
    successBg: '#D1FAE5',
    successText: '#065F46',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    error: '#EF4444',
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

  // Configure dialogue manager based on voice feedback setting
  useEffect(() => {
    dialogueManager.updateConfig({
      mode: voiceFeedback ? 'conversational' : 'silent',
    });
  }, [voiceFeedback]);

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

  // Answer mode pulse animation for microphone button
  useEffect(() => {
    if (waitingForAnswer) {
      const answerPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(answerModePulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(answerModePulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      answerPulse.start();
      return () => answerPulse.stop();
    } else {
      // Reset to normal size
      Animated.timing(answerModePulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [waitingForAnswer, answerModePulseAnim]);

  // Fade animation for answer mode badge
  useEffect(() => {
    if (waitingForAnswer) {
      // Fade in
      Animated.timing(answerBadgeFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(answerBadgeFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [waitingForAnswer, answerBadgeFadeAnim]);

  // AI speaking sound bar animations
  useEffect(() => {
    if (isAISpeaking) {
      const createBarAnimation = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.5,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        );
      };

      const animations = Animated.parallel([
        createBarAnimation(soundBar1Anim, 0),
        createBarAnimation(soundBar2Anim, 200),
        createBarAnimation(soundBar3Anim, 400),
      ]);

      animations.start();

      return () => {
        animations.stop();
        soundBar1Anim.setValue(0.5);
        soundBar2Anim.setValue(0.5);
        soundBar3Anim.setValue(0.5);
      };
    }
  }, [isAISpeaking, soundBar1Anim, soundBar2Anim, soundBar3Anim]);

  // Feedback card slide-up animation
  useEffect(() => {
    if (Object.keys(validationResults).length > 0) {
      feedbackSlideAnim.setValue(10);
      Animated.timing(feedbackSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [validationResults, feedbackSlideAnim]);

  // Animate validated text to top corner
  useEffect(() => {
    const lineNums = Object.keys(validationResults).map(Number);

    lineNums.forEach((lineNum) => {
      // Skip if already animated
      if (validatedTexts[lineNum]) return;

      const result = validationResults[lineNum];
      if (!result.mathematically_correct || !result.transcribed_expression) return;

      const originalY = lineNum * GUIDE_LINE_SPACING + 32; // +32 for canvas padding
      const animatedY = new Animated.Value(originalY);
      const animatedOpacity = new Animated.Value(0);

      const stackIndex = Object.keys(validatedTexts).length;

      // Add to state first
      setValidatedTexts((prev) => ({
        ...prev,
        [lineNum]: {
          text: result.transcribed_expression,
          animatedY,
          animatedOpacity,
          originalY,
        },
      }));

      // Start animations
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(animatedOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animatedY, {
            toValue: 10 + (stackIndex * 35), // Stack validated expressions
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500); // Wait for feedback card to appear first
    });
  }, [validationResults, validatedTexts]);

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

      // Notify dialogue manager that speech is starting
      dialogueManager.onSpeechStart();
      setIsAISpeaking(true);

      Speech.speak(speakableText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          // Notify dialogue manager that speech has ended
          dialogueManager.onSpeechEnd();
          setIsAISpeaking(false);
        },
        onStopped: () => {
          // Also handle interruptions
          dialogueManager.onSpeechEnd();
          setIsAISpeaking(false);
        },
      });
    } catch (error) {
      console.error('Speech failed:', error);
      dialogueManager.onSpeechEnd();
      setIsAISpeaking(false);
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

  /**
   * Speak a question and optionally wait for student's verbal response
   */
  const speakQuestion = useCallback((question: string, expectsAnswer: boolean = false) => {
    speakFeedback(question);

    if (expectsAnswer) {
      // Set answer mode after a brief delay (to allow question to finish)
      setTimeout(() => {
        setWaitingForAnswer(true);
        setCurrentQuestion(question);
        console.log('🎤 Waiting for student answer...');
      }, 3000); // Wait 3s for question to finish speaking
    }
  }, [speakFeedback]);

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
      onAnswer: async (answer: string) => {
        console.log('📢 Student answer received:', answer);

        // Notify dialogue manager
        dialogueManager.onStudentResponse(answer);

        // Exit answer mode
        setWaitingForAnswer(false);
        const questionAsked = currentQuestion;
        setCurrentQuestion(null);

        // Validate the answer using Socratic service
        if (questionAsked) {
          try {
            const response = await socraticQuestionService.respondToStudentQuestion({
              studentQuestion: `You asked me: "${questionAsked}". My answer is: "${answer}"`,
              problem: currentProblem,
              previousSteps,
              currentStep: previousSteps[previousSteps.length - 1],
            });

            // Speak the validation response
            speakFeedback(response);
          } catch (error) {
            console.error('Failed to validate answer:', error);
            speakFeedback("Thanks for sharing your thoughts!");
          }
        } else {
          // No question context, just acknowledge
          speakFeedback("Thanks for sharing your thoughts!");
        }

        console.log('💭 Student said:', answer, 'in response to:', questionAsked);
      },
      onQuestion: async (question: string) => {
        console.log('💬 Conversational question received:', question);

        try {
          // Use Socratic service to generate a response
          const response = await socraticQuestionService.respondToStudentQuestion({
            studentQuestion: question,
            problem: currentProblem,
            previousSteps,
            currentStep: previousSteps[previousSteps.length - 1],
          });

          // Record the response in dialogue manager
          dialogueManager.onStudentResponse(question);

          // Speak the Socratic response
          speakFeedback(response);
        } catch (error) {
          console.error('Failed to generate conversational response:', error);
          speakFeedback("That's a great question! Let me think about the best way to guide you...");
        }
      },
    },
    enableAnswerMode: waitingForAnswer,
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

  // Inactivity detection with escalating check-ins
  const { resetInactivity } = useInactivityDetection({
    checkInIntervals: [45000, 75000, 105000], // 45s, 75s, 105s
    enabled: voiceFeedback, // Only when voice feedback is on
    onCheckIn: async (elapsedSeconds, level) => {
      console.log(`📞 Check-in triggered: Level ${level}, ${elapsedSeconds}s`);

      // Check with dialogue manager if we should respond to this check-in
      if (!dialogueManager.shouldRespondToCheckIn(elapsedSeconds * 1000, level)) {
        console.log('🎙️ Skipping check-in: dialogue manager advised against it');
        return;
      }

      const checkInMessage = getCheckInMessage(level, elapsedSeconds);
      speakFeedback(checkInMessage);

      // At higher levels, also generate a Socratic question
      if (level >= 2 && previousSteps.length > 0) {
        try {
          const question = await socraticQuestionService.generateQuestion({
            problem: currentProblem,
            previousSteps,
            questionType: 'on_pause',
          });

          // Record the question
          dialogueManager.recordQuestion(question.question, question.expectsAnswer);

          // Speak the question after a brief pause
          setTimeout(() => speakQuestion(question.question, question.expectsAnswer), 2000);
        } catch (error) {
          console.error('Failed to generate check-in question:', error);
        }
      }
    },
  });

  // Reset inactivity on any interaction
  const handleInteraction = useCallback(() => {
    resetInactivity();
    dialogueManager.onStudentActivity();
  }, [resetInactivity]);

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

    // Reset dialogue manager for new problem
    dialogueManager.reset();
    console.log('🎙️ Dialogue manager reset for new problem');

    // Reset answer mode
    setWaitingForAnswer(false);
    setCurrentQuestion(null);
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

      // Send entire canvas for better OCR context
      // AI will use sequential reading to identify the newest expression
      const allStrokes = pathStrings.map((pathString, idx) => {
        const path = Skia.Path.MakeFromSVGString(pathString);
        return { path: path!, color: pathColors[idx] };
      });

      console.log(`🎯 Validating with full canvas context (${allStrokes.length} total strokes)`);
      console.log(`📊 Previously validated: ${previousSteps.length} expressions`);

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

        // Generate Socratic question after correct step (if not complete)
        if (response.progressScore < 1.0 && voiceFeedback) {
          setTimeout(async () => {
            try {
              const updatedSteps = [...previousSteps, response.recognizedExpression];
              const isStrategicMoment = socraticQuestionService.detectStrategicMoment(
                currentProblem,
                updatedSteps
              );

              // Check with dialogue manager if we should ask a question
              if (dialogueManager.shouldAskQuestion({
                isStrategicMoment,
                isCorrectStep: true,
                consecutiveErrors: 0,
              })) {
                const question = await socraticQuestionService.generateQuestion({
                  problem: currentProblem,
                  previousSteps: updatedSteps,
                  questionType: 'after_correct',
                });

                // Record the question
                dialogueManager.recordQuestion(question.question, question.expectsAnswer);
                speakQuestion(question.question, question.expectsAnswer);
              }
            } catch (error) {
              console.error('Failed to generate Socratic question:', error);
            }
          }, 2000); // Wait 2s after feedback
        }
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

          // Generate Socratic question after incorrect step if student appears stuck
          if (newConsecutive >= 2 && voiceFeedback) {
            setTimeout(async () => {
              // Check with dialogue manager if we should ask a question
              if (dialogueManager.shouldAskQuestion({
                isStrategicMoment: false,
                isCorrectStep: false,
                consecutiveErrors: newConsecutive,
              })) {
                try {
                  const question = await socraticQuestionService.generateQuestion({
                    problem: currentProblem,
                    previousSteps,
                    currentStep: response.recognizedExpression,
                    questionType: 'after_incorrect',
                    attemptNumber: newConsecutive,
                    mistakePattern: response.errorType,
                  });

                  // Record the question
                  dialogueManager.recordQuestion(question.question, question.expectsAnswer);
                  speakQuestion(question.question, question.expectsAnswer);
                } catch (error) {
                  console.error('Failed to generate Socratic question after incorrect step:', error);
                }
              }
            }, 2500); // Wait 2.5s after feedback
          }
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
        // Reset inactivity timer on any interaction
        runOnJS(handleInteraction)();

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
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={darkMode ? "light" : "dark"} />

        {/* Problem Display */}
        <View style={[styles.problemContainer, { backgroundColor: theme.cardBg }]}>
          <View style={styles.problemHeader}>
            <Text style={[styles.problemLabel, { color: theme.textSecondary }]}>
              SOLVE FOR {currentProblem.goalState.variable?.toUpperCase()}
            </Text>

            {/* Step Indicators */}
            <View style={styles.stepIndicators}>
              {completedSteps.map((step) => (
                <View key={`step-${step}`} style={[styles.stepCircle, { backgroundColor: theme.success }]}>
                  <Text style={styles.stepCheckmark}>✓</Text>
                </View>
              ))}
              <View style={[styles.stepCircle, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepNumber}>{currentStep}</Text>
              </View>
              {totalStepsEstimate && Array.from({ length: Math.max(0, totalStepsEstimate - currentStep) }, (_, i) => (
                <View key={`upcoming-${currentStep + i + 1}`} style={[styles.stepCircle, { backgroundColor: theme.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.textSecondary }]}>{currentStep + i + 1}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.problemText, { color: theme.text }]}>{currentProblem.content}</Text>

          {/* AI Speaking Indicator */}
          {isAISpeaking && (
            <View style={[styles.aiSpeakingBanner, {
              backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
              borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
            }]}>
              <View style={styles.soundBars}>
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: soundBar1Anim }] }]} />
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: soundBar2Anim }] }]} />
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: soundBar3Anim }] }]} />
              </View>
              <Text style={styles.aiSpeakingText}>AI is speaking...</Text>
            </View>
          )}
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: theme.cardBg }]}>
          <View style={styles.toolsLeft}>
            {/* Pen Tool - Always active */}
            <TouchableOpacity
              style={[styles.toolButton, styles.penButton]}
              onPress={() => {
                if (isErasing) {
                  setIsErasing(false);
                  isErasingRef.current = false;
                }
              }}
            >
              <Text style={styles.toolButtonText}>✏️</Text>
            </TouchableOpacity>

            {/* Eraser */}
            <TouchableOpacity
              style={[
                styles.toolButton,
                isErasing && styles.toolButtonActive,
                { borderColor: theme.border }
              ]}
              onPress={toggleEraser}
            >
              <Text style={styles.toolButtonText}>🧹</Text>
            </TouchableOpacity>

            {/* Clear All */}
            <TouchableOpacity
              style={[styles.toolButton, { borderColor: theme.border }]}
              onPress={clearCanvas}
            >
              <Text style={styles.toolButtonText}>🗑️</Text>
            </TouchableOpacity>

            {/* Voice Feedback Toggle */}
            <TouchableOpacity
              style={[
                styles.toolButton,
                { borderColor: theme.border },
                !voiceFeedback && styles.toolButtonInactive
              ]}
              onPress={() => {
                setVoiceFeedback(!voiceFeedback);
                if (voiceFeedback) Speech.stop();
              }}
            >
              <Text style={styles.toolButtonText}>{voiceFeedback ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
          </View>

          {/* Voice Button */}
          <Animated.View
            style={{
              transform: [{ scale: waitingForAnswer ? answerModePulseAnim : 1 }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonListening,
                waitingForAnswer && styles.micButtonWaiting
              ]}
              onPress={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
            >
              <Text style={styles.micButtonIcon}>🎤</Text>
              <Text style={styles.micButtonText}>Tap to respond</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Canvas */}
        <GestureDetector gesture={drawGesture}>
          <View style={[styles.canvasContainer, { backgroundColor: theme.canvasBg }]}>
            {pathStrings.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  ✍️ Write your answer here
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
            {waitingForAnswer && !isListening && (
              <Animated.View
                style={[
                  styles.answerModeIndicator,
                  { opacity: answerBadgeFadeAnim }
                ]}
              >
                <View style={styles.answerModeBadge}>
                  <Text style={styles.answerModeText}>💭 Tap 🎤 to respond</Text>
                </View>
              </Animated.View>
            )}
            <Canvas style={styles.canvas}>
              {showGuideLines && guideLines.map((line) => (
                <Line
                  key={line.key}
                  p1={{ x: 0, y: line.y }}
                  p2={{ x: CANVAS_WIDTH, y: line.y }}
                  color={theme.canvasLine}
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

            {/* Validated Text Overlays - animated to top corner */}
            {Object.entries(validatedTexts).map(([lineNum, textData]) => (
              <Animated.View
                key={`validated-${lineNum}`}
                style={[
                  styles.validatedTextOverlay,
                  {
                    transform: [{ translateY: textData.animatedY }],
                    opacity: textData.animatedOpacity,
                  },
                ]}
              >
                <Text style={[styles.validatedText, { color: theme.text }]}>
                  {textData.text}
                </Text>
              </Animated.View>
            ))}
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

        {/* Feedback Card - appears above buttons */}
        {Object.keys(validationResults).length > 0 && (() => {
          const latestLineNum = Math.max(...Object.keys(validationResults).map(Number));
          const result = validationResults[latestLineNum];
          const isCorrect = result.mathematicallyCorrect;

          return (
            <Animated.View style={[styles.feedbackCardContainer, { transform: [{ translateY: feedbackSlideAnim }] }]}>
              <View style={[
                styles.feedbackCard,
                {
                  backgroundColor: isCorrect ? theme.successBg : theme.warningBg,
                  borderColor: isCorrect ? theme.success : theme.warning,
                }
              ]}>
                <View style={[styles.feedbackIconCircle, { backgroundColor: isCorrect ? theme.success : theme.warning }]}>
                  <Text style={styles.feedbackIconText}>{isCorrect ? '✓' : '?'}</Text>
                </View>
                <View style={styles.feedbackContent}>
                  <Text style={[styles.feedbackTitle, { color: isCorrect ? theme.successText : theme.warningText }]}>
                    {isCorrect ? 'Excellent work!' : 'Let\'s think about this...'}
                  </Text>
                  <Text style={[styles.feedbackMessage, { color: isCorrect ? '#047857' : '#92400E' }]}>
                    {result.feedback_message}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })()}

        {/* Check My Work Button */}
        {hasUnvalidatedStrokes && !autoValidate && (
          <Animated.View style={{ transform: [{ scale: validating ? 1 : pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.submitButton, validating && styles.submitButtonDisabled]}
              onPress={() => validateCurrentLine(true)}
              disabled={validating}
            >
              {validating ? (
                <View style={styles.validatingContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitButtonText}>{validationProgress}</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>✓ Check My Work</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Old Feedback Section - REMOVE THIS */}
        {false && Object.keys(validationResults).length > 0 && (
          <View style={[styles.feedbackSection, { backgroundColor: theme.cardBg }]}>
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
                      styles.oldFeedbackCard,
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
                        <Text style={[styles.oldFeedbackTitle, { color: theme.text }]}>
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
    padding: 28,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  problemLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  problemText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  aiSpeakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  soundBars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  soundBar: {
    width: 4,
    height: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  aiSpeakingText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  toolsLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  toolButtonText: {
    fontSize: 20,
  },
  penButton: {
    backgroundColor: '#3B82F6',
    borderWidth: 0,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toolButtonActive: {
    backgroundColor: '#3B82F6',
    borderWidth: 0,
  },
  toolButtonInactive: {
    opacity: 0.5,
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micButtonIcon: {
    fontSize: 18,
  },
  micButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  micButtonListening: {
    backgroundColor: '#10B981',
  },
  micButtonWaiting: {
    backgroundColor: '#F59E0B',
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
  microphoneWaiting: {
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
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
    marginTop: 16,
    borderRadius: 20,
    padding: 32,
    minHeight: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
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
    fontSize: 16,
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
  answerModeIndicator: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  answerModeBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  answerModeText: {
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
  // New feedback card styles
  feedbackCardContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
  },
  feedbackIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  // New action button styles
  submitButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
    shadowColor: '#000',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  validatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Validated text overlay styles
  validatedTextOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 100,
  },
  validatedText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'cursive',
  },
  // Old styles - keep for backward compatibility
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
