/**
 * Voice Testing Screen
 * Internal testing interface for voice interactions
 * Includes logging, metrics, and session management
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { useVoiceCommands, VoiceRecognitionResult } from '../hooks/useVoiceCommands';
import * as Speech from 'expo-speech';

// Test session log entry
interface TestLogEntry {
  timestamp: Date;
  type: 'user_utterance' | 'transcription' | 'ai_response' | 'command_triggered' | 'error' | 'note';
  content: string;
  metadata?: {
    confidence?: number;
    latency?: number;
    command?: string;
    [key: string]: any;
  };
}

// Test metrics
interface TestMetrics {
  totalUtterances: number;
  totalCommands: number;
  exactMatches: number;
  minorErrors: number;
  majorErrors: number;
  failures: number;
  avgConfidence: number;
  avgLatency: number;
  sessionStartTime: Date | null;
  sessionEndTime: Date | null;
}

export const VoiceTestingScreen: React.FC = () => {
  // Test session state
  const [testSessionId, setTestSessionId] = useState<string>('');
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [testLogs, setTestLogs] = useState<TestLogEntry[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [testerNotes, setTesterNotes] = useState<string>('');

  // Current test state
  const [currentProblem, setCurrentProblem] = useState<string>('Solve for x: 2x + 7 = 15');
  const [lastAIResponse, setLastAIResponse] = useState<string>('');
  const [lastUtterance, setLastUtterance] = useState<string>('');
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState<TestMetrics>({
    totalUtterances: 0,
    totalCommands: 0,
    exactMatches: 0,
    minorErrors: 0,
    majorErrors: 0,
    failures: 0,
    avgConfidence: 0,
    avgLatency: 0,
    sessionStartTime: null,
    sessionEndTime: null,
  });

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    controls: true,
    currentState: true,
    logs: true,
    metrics: true,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const confidenceSum = useRef<number>(0);
  const latencySum = useRef<number>(0);

  // Voice command handlers
  const voiceHandlers = {
    onHint: useCallback(() => {
      addLog('command_triggered', 'Hint command triggered', { command: 'hint' });

      // Simulate AI response (in real app, this would call GPT-4o)
      const mockResponse = 'What operation could help you isolate the variable?';
      handleAIResponse(mockResponse);
    }, []),

    onExplain: useCallback(() => {
      addLog('command_triggered', 'Explain command triggered', { command: 'explain' });

      const mockResponse = 'To solve this equation, we need to isolate x by using inverse operations.';
      handleAIResponse(mockResponse);
    }, []),

    onNewProblem: useCallback(() => {
      addLog('command_triggered', 'New problem command triggered', { command: 'new_problem' });

      const newProblem = 'Solve for x: 5x - 8 = 17';
      setCurrentProblem(newProblem);

      const response = `Here's your next problem: ${newProblem}`;
      handleAIResponse(response);
      Speech.speak(response);
    }, []),

    onReadProblem: useCallback(() => {
      addLog('command_triggered', 'Read problem command triggered', { command: 'read_problem' });

      const response = `The problem is: ${currentProblem}`;
      handleAIResponse(response);
      Speech.speak(currentProblem);
    }, [currentProblem]),

    onClear: useCallback(() => {
      addLog('command_triggered', 'Clear command triggered', { command: 'clear' });

      const response = 'Canvas cleared';
      handleAIResponse(response);
    }, []),

    onAnswer: useCallback((answer: string) => {
      addLog('user_utterance', `Open-ended: "${answer}"`);

      // Simulate AI processing open-ended response
      const mockResponse = `I understand you're saying: ${answer}. Let me help with that.`;
      handleAIResponse(mockResponse);
    }, []),
  };

  // Initialize voice commands
  const {
    isListening,
    recognizedCommand,
    error,
    permissionStatus,
    startListening,
    stopListening,
    requestPermissions,
    clearError,
    clearRecognizedCommand,
  } = useVoiceCommands({
    handlers: voiceHandlers,
    enableAnswerMode: false,
    contextualStrings: ['solve', 'equation', 'variable', 'isolate'],
  });

  // Handle recognized commands
  useEffect(() => {
    if (recognizedCommand) {
      const { command, transcript, confidence } = recognizedCommand;

      addLog('transcription', transcript, {
        confidence,
        command,
      });

      // Track metrics
      updateMetrics(confidence);

      // Clear after logging
      setTimeout(() => clearRecognizedCommand(), 1000);
    }
  }, [recognizedCommand]);

  // Handle errors
  useEffect(() => {
    if (error) {
      addLog('error', error);

      // Auto-clear errors after 5 seconds
      setTimeout(() => clearError(), 5000);
    }
  }, [error]);

  // Add log entry
  const addLog = useCallback((
    type: TestLogEntry['type'],
    content: string,
    metadata?: TestLogEntry['metadata']
  ) => {
    const entry: TestLogEntry = {
      timestamp: new Date(),
      type,
      content,
      metadata,
    };

    setTestLogs(prev => [...prev, entry]);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Handle AI response (mock)
  const handleAIResponse = useCallback((response: string) => {
    // Calculate latency
    const latency = responseStartTime ? Date.now() - responseStartTime : 0;

    addLog('ai_response', response, { latency });
    setLastAIResponse(response);
    setResponseStartTime(null);

    // Update latency metrics
    if (latency > 0) {
      latencySum.current += latency;
    }
  }, [responseStartTime, addLog]);

  // Update metrics
  const updateMetrics = useCallback((confidence: number) => {
    setMetrics(prev => {
      const newTotal = prev.totalUtterances + 1;
      confidenceSum.current += confidence;

      return {
        ...prev,
        totalUtterances: newTotal,
        totalCommands: prev.totalCommands + 1,
        avgConfidence: confidenceSum.current / newTotal,
        avgLatency: latencySum.current / newTotal,
      };
    });
  }, []);

  // Start test session
  const startSession = useCallback(() => {
    const sessionId = `VT-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setTestSessionId(sessionId);
    setSessionActive(true);
    setMetrics(prev => ({
      ...prev,
      sessionStartTime: new Date(),
    }));

    addLog('note', `Test session started: ${sessionId}`);
  }, [addLog]);

  // End test session
  const endSession = useCallback(() => {
    setSessionActive(false);
    setMetrics(prev => ({
      ...prev,
      sessionEndTime: new Date(),
    }));

    addLog('note', 'Test session ended');
  }, [addLog]);

  // Clear session
  const clearSession = useCallback(() => {
    Alert.alert(
      'Clear Session',
      'Are you sure you want to clear all logs and metrics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setTestLogs([]);
            setMetrics({
              totalUtterances: 0,
              totalCommands: 0,
              exactMatches: 0,
              minorErrors: 0,
              majorErrors: 0,
              failures: 0,
              avgConfidence: 0,
              avgLatency: 0,
              sessionStartTime: null,
              sessionEndTime: null,
            });
            confidenceSum.current = 0;
            latencySum.current = 0;
            setSessionActive(false);
            setTestSessionId('');
          },
        },
      ]
    );
  }, []);

  // Export logs
  const exportLogs = useCallback(async () => {
    const exportData = {
      sessionId: testSessionId,
      scenario: currentScenario,
      testerNotes,
      metrics,
      logs: testLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        type: log.type,
        content: log.content,
        metadata: log.metadata,
      })),
    };

    const exportString = JSON.stringify(exportData, null, 2);

    try {
      await Share.share({
        message: exportString,
        title: `Voice Test Logs - ${testSessionId}`,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export logs');
    }
  }, [testSessionId, currentScenario, testerNotes, metrics, testLogs]);

  // Handle voice button
  const handleVoiceButton = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      setResponseStartTime(Date.now());
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Toggle section
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  // Get log entry style
  const getLogEntryStyle = (type: TestLogEntry['type']) => {
    switch (type) {
      case 'user_utterance':
        return styles.logUser;
      case 'transcription':
        return styles.logTranscription;
      case 'ai_response':
        return styles.logAI;
      case 'command_triggered':
        return styles.logCommand;
      case 'error':
        return styles.logError;
      case 'note':
        return styles.logNote;
      default:
        return styles.logDefault;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Testing Interface</Text>
        <Text style={styles.subtitle}>Internal Testing Tool</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        {/* Session Controls */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('controls')}
          >
            <Text style={styles.sectionTitle}>
              {expandedSections.controls ? '▼' : '▶'} Session Controls
            </Text>
          </TouchableOpacity>

          {expandedSections.controls && (
            <View style={styles.sectionContent}>
              <View style={styles.sessionInfo}>
                <Text style={styles.label}>Session ID:</Text>
                <Text style={styles.value}>{testSessionId || 'Not started'}</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Scenario ID (e.g., S01)"
                value={currentScenario}
                onChangeText={setCurrentScenario}
              />

              <View style={styles.buttonRow}>
                {!sessionActive ? (
                  <TouchableOpacity style={styles.buttonPrimary} onPress={startSession}>
                    <Text style={styles.buttonText}>▶️ Start Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.buttonSecondary} onPress={endSession}>
                    <Text style={styles.buttonText}>⏹️ End Session</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.buttonDanger} onPress={clearSession}>
                  <Text style={styles.buttonText}>🗑️ Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonSuccess} onPress={exportLogs}>
                  <Text style={styles.buttonText}>📤 Export</Text>
                </TouchableOpacity>
              </View>

              {/* Permission Status */}
              <View style={styles.permissionStatus}>
                <Text style={styles.label}>Mic Permission:</Text>
                <Text style={[
                  styles.value,
                  permissionStatus === 'granted' ? styles.statusGood : styles.statusBad
                ]}>
                  {permissionStatus}
                </Text>
                {permissionStatus !== 'granted' && (
                  <TouchableOpacity onPress={requestPermissions}>
                    <Text style={styles.linkText}>Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Current Test State */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('currentState')}
          >
            <Text style={styles.sectionTitle}>
              {expandedSections.currentState ? '▼' : '▶'} Current Test State
            </Text>
          </TouchableOpacity>

          {expandedSections.currentState && (
            <View style={styles.sectionContent}>
              <View style={styles.problemBox}>
                <Text style={styles.label}>Current Problem:</Text>
                <TextInput
                  style={styles.problemInput}
                  value={currentProblem}
                  onChangeText={setCurrentProblem}
                  multiline
                />
              </View>

              {/* Voice Control Button */}
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening && styles.voiceButtonActive,
                ]}
                onPress={handleVoiceButton}
                disabled={permissionStatus !== 'granted'}
              >
                <Text style={styles.voiceButtonText}>
                  {isListening ? '🔴 Listening...' : '🎤 Push to Talk'}
                </Text>
              </TouchableOpacity>

              {/* Last Recognized */}
              {recognizedCommand && (
                <View style={styles.recognizedBox}>
                  <Text style={styles.recognizedLabel}>Recognized:</Text>
                  <Text style={styles.recognizedText}>"{recognizedCommand.transcript}"</Text>
                  <Text style={styles.recognizedMeta}>
                    Command: {recognizedCommand.command} |
                    Confidence: {(recognizedCommand.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              )}

              {/* Last AI Response */}
              {lastAIResponse && (
                <View style={styles.aiResponseBox}>
                  <Text style={styles.aiResponseLabel}>Last AI Response:</Text>
                  <Text style={styles.aiResponseText}>{lastAIResponse}</Text>
                </View>
              )}

              {/* Error Display */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              {/* Notes */}
              <TextInput
                style={styles.notesInput}
                placeholder="Tester notes..."
                value={testerNotes}
                onChangeText={setTesterNotes}
                multiline
              />
            </View>
          )}
        </View>

        {/* Metrics */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('metrics')}
          >
            <Text style={styles.sectionTitle}>
              {expandedSections.metrics ? '▼' : '▶'} Test Metrics
            </Text>
          </TouchableOpacity>

          {expandedSections.metrics && (
            <View style={styles.sectionContent}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{metrics.totalUtterances}</Text>
                  <Text style={styles.metricLabel}>Utterances</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{metrics.totalCommands}</Text>
                  <Text style={styles.metricLabel}>Commands</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {(metrics.avgConfidence * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.metricLabel}>Avg Confidence</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {metrics.avgLatency > 0 ? `${metrics.avgLatency.toFixed(0)}ms` : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>Avg Latency</Text>
                </View>
              </View>

              {metrics.sessionStartTime && (
                <View style={styles.sessionTiming}>
                  <Text style={styles.timingText}>
                    Started: {metrics.sessionStartTime.toLocaleTimeString()}
                  </Text>
                  {metrics.sessionEndTime && (
                    <Text style={styles.timingText}>
                      Ended: {metrics.sessionEndTime.toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Test Logs */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('logs')}
          >
            <Text style={styles.sectionTitle}>
              {expandedSections.logs ? '▼' : '▶'} Test Logs ({testLogs.length})
            </Text>
          </TouchableOpacity>

          {expandedSections.logs && (
            <View style={styles.sectionContent}>
              {testLogs.length === 0 ? (
                <Text style={styles.emptyText}>No logs yet. Start testing!</Text>
              ) : (
                testLogs.map((log, index) => (
                  <View key={index} style={[styles.logEntry, getLogEntryStyle(log.type)]}>
                    <Text style={styles.logTimestamp}>{formatTime(log.timestamp)}</Text>
                    <Text style={styles.logType}>[{log.type}]</Text>
                    <Text style={styles.logContent}>{log.content}</Text>
                    {log.metadata && (
                      <Text style={styles.logMetadata}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    padding: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#888',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDanger: {
    flex: 1,
    backgroundColor: '#E74C3C',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonSuccess: {
    flex: 1,
    backgroundColor: '#27AE60',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  statusGood: {
    color: '#27AE60',
    fontWeight: '600',
  },
  statusBad: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  linkText: {
    color: '#4A90E2',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  problemBox: {
    marginBottom: 12,
  },
  problemInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    fontFamily: 'Courier',
    minHeight: 60,
    backgroundColor: '#fafafa',
  },
  voiceButton: {
    backgroundColor: '#4A90E2',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 12,
  },
  voiceButtonActive: {
    backgroundColor: '#E74C3C',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recognizedBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  recognizedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  recognizedMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  aiResponseBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  aiResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  aiResponseText: {
    fontSize: 14,
    color: '#333',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sessionTiming: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  timingText: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  logEntry: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  logUser: {
    backgroundColor: '#FFF9C4',
    borderLeftColor: '#FBC02D',
  },
  logTranscription: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#66BB6A',
  },
  logAI: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#42A5F5',
  },
  logCommand: {
    backgroundColor: '#F3E5F5',
    borderLeftColor: '#AB47BC',
  },
  logError: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#EF5350',
  },
  logNote: {
    backgroundColor: '#F5F5F5',
    borderLeftColor: '#9E9E9E',
  },
  logDefault: {
    backgroundColor: '#FAFAFA',
    borderLeftColor: '#BDBDBD',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Courier',
  },
  logType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    marginTop: 2,
  },
  logContent: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  logMetadata: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Courier',
    marginTop: 4,
  },
});

export default VoiceTestingScreen;
