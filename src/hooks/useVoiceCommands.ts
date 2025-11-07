/**
 * Voice Commands Hook
 * Handles speech recognition for voice-based user interactions
 * Supports push-to-talk activation with on-device recognition
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';
import * as Speech from 'expo-speech';

export type VoiceCommand =
  | 'hint'
  | 'help'
  | 'stuck'
  | 'explain'
  | 'why'
  | 'new_problem'
  | 'read_problem'
  | 'clear'
  | 'unknown';

export interface VoiceCommandHandlers {
  onHint: () => void;
  onExplain: () => void;
  onNewProblem?: () => void;
  onReadProblem?: () => void;
  onClear?: () => void;
  onAnswer?: (answer: string) => void; // For answering prompts
}

export interface VoiceRecognitionResult {
  command: VoiceCommand;
  transcript: string;
  confidence: number;
}

interface UseVoiceCommandsOptions {
  handlers: VoiceCommandHandlers;
  enableAnswerMode?: boolean; // If true, capture open-ended answers instead of commands
  contextualStrings?: string[]; // Additional words to help recognition
}

export const useVoiceCommands = ({
  handlers,
  enableAnswerMode = false,
  contextualStrings = [],
}: UseVoiceCommandsOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedCommand, setRecognizedCommand] = useState<VoiceRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  /**
   * Request microphone and speech recognition permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (result.granted) {
        setPermissionStatus('granted');
        console.log('✅ Speech recognition permissions granted');
        return true;
      } else {
        setPermissionStatus('denied');
        setError('Microphone permission denied. Please enable it in Settings.');
        console.warn('⚠️ Speech recognition permissions denied');
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setError('Failed to request permissions');
      return false;
    }
  }, []);

  /**
   * Check if permissions are granted
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      const granted = result.granted;
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }, []);

  /**
   * Parse command from transcript
   */
  const parseCommand = useCallback((transcript: string): VoiceCommand => {
    const lower = transcript.toLowerCase().trim();

    // Check for hint/help/stuck commands
    if (lower.includes('hint') || lower.includes('help') || lower.includes('stuck')) {
      return 'hint';
    }

    // Check for explanation commands
    if (lower.includes('explain') || lower.includes('why')) {
      return 'explain';
    }

    // Check for new problem commands
    if (lower.includes('new problem') || lower.includes('different problem')) {
      return 'new_problem';
    }

    // Check for read problem commands
    if (lower.includes('read') || lower.includes('repeat')) {
      return 'read_problem';
    }

    // Check for clear commands
    if (lower.includes('clear')) {
      return 'clear';
    }

    return 'unknown';
  }, []);

  /**
   * Handle recognition results
   */
  useSpeechRecognitionEvent('result', (event) => {
    console.log('🎤 Recognition result:', event);

    if (!event.results || event.results.length === 0) {
      return;
    }

    const result = event.results[0];
    const transcript = result.transcript;
    const confidence = result.confidence || 0.5;

    console.log('📝 Transcript:', transcript);
    console.log('🎯 Confidence:', confidence);

    // If in answer mode, pass raw transcript to handler
    if (enableAnswerMode && handlers.onAnswer) {
      handlers.onAnswer(transcript);
      setRecognizedCommand({
        command: 'unknown',
        transcript,
        confidence,
      });
      return;
    }

    // Otherwise, parse as command
    const command = parseCommand(transcript);

    setRecognizedCommand({
      command,
      transcript,
      confidence,
    });

    // Execute command handler
    switch (command) {
      case 'hint':
      case 'help':
      case 'stuck':
        handlers.onHint();
        break;
      case 'explain':
      case 'why':
        handlers.onExplain();
        break;
      case 'new_problem':
        handlers.onNewProblem?.();
        break;
      case 'read_problem':
        handlers.onReadProblem?.();
        break;
      case 'clear':
        handlers.onClear?.();
        break;
      default:
        console.warn('⚠️ Unrecognized command:', transcript);
        setError(`Didn't recognize that command. Try "hint", "explain", or "new problem".`);
    }
  });

  /**
   * Handle recognition errors
   */
  useSpeechRecognitionEvent('error', (event) => {
    console.error('🚨 Speech recognition error:', event);

    const errorMessages: Record<ExpoSpeechRecognitionErrorCode, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone error. Please check your device settings.',
      'not-allowed': 'Microphone permission denied.',
      'network': 'Network error. Voice recognition requires internet on some devices.',
      'service-not-allowed': 'Speech recognition service not available.',
      'aborted': 'Recognition was stopped.',
      'language-not-supported': 'Language not supported.',
      'busy': 'Recognition service is busy. Please try again.',
      'unknown': 'An unknown error occurred.',
    };

    setError(errorMessages[event.error] || 'Voice recognition failed');
    setIsListening(false);
  });

  /**
   * Handle recognition end
   */
  useSpeechRecognitionEvent('end', () => {
    console.log('🔚 Speech recognition ended');
    setIsListening(false);
  });

  /**
   * Handle recognition start
   */
  useSpeechRecognitionEvent('start', () => {
    console.log('🎙️ Speech recognition started');
    setIsListening(true);
    setError(null);
  });

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(async () => {
    try {
      // Check permissions first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }

      // Stop any ongoing speech output
      await Speech.stop();

      // Wait a brief moment for TTS to fully stop
      await new Promise(resolve => setTimeout(resolve, 200));

      // Build contextual strings
      const defaultContextual = [
        'hint',
        'help',
        'stuck',
        'explain',
        'why',
        'new problem',
        'different problem',
        'read problem',
        'repeat',
        'clear',
      ];

      const allContextual = [...defaultContextual, ...contextualStrings];

      // Start speech recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false, // Only final results
        continuous: false, // Single command per session
        maxAlternatives: 1,
        contextualStrings: allContextual,
        requiresOnDeviceRecognition: false, // Allow cloud for better accuracy
        androidIntentLookbackMillis: 0,
        iosTaskHint: 'dictation',
        recordingOptions: {
          persist: false, // Don't save audio files
        },
      });

      setIsListening(true);
      setError(null);
      setRecognizedCommand(null); // Clear previous command
    } catch (error) {
      console.error('Failed to start listening:', error);
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  }, [checkPermissions, requestPermissions, contextualStrings]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to stop listening:', error);
      setIsListening(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear recognized command
   */
  const clearRecognizedCommand = useCallback(() => {
    setRecognizedCommand(null);
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    isListening,
    recognizedCommand,
    error,
    permissionStatus,
    startListening,
    stopListening,
    requestPermissions,
    clearError,
    clearRecognizedCommand,
  };
};
