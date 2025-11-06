/**
 * GPT-4o API Test Screen
 *
 * Quick test to verify OpenAI API connection before integrating with canvas
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { gpt4oValidationAPI } from './src/infrastructure/api/GPT4oValidationAPI';

export default function TestGPT4o() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    console.log('\n🚀 Testing GPT-4o API Connection...\n');

    try {
      const success = await gpt4oValidationAPI.testConnection();

      if (success) {
        console.log('✅ GPT-4o API is working!');
        setResult({ success: true, message: 'Connection successful!' });
      } else {
        console.log('❌ GPT-4o API connection failed');
        setError('Connection failed - check your API key');
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  const testValidation = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    console.log('\n🧪 Testing GPT-4o Validation (without image)...\n');

    try {
      // Create a simple test problem
      const testProblem = {
        id: 'test-1',
        content: 'Solve for x: 2x + 3 = 7',
        contentType: 'text' as const,
        difficulty: 'easy' as const,
        skillArea: 'algebra',
        goalState: {
          type: 'ISOLATE_VARIABLE' as const,
          variable: 'x',
        },
        hintLibrary: {},
      };

      // For now, we'll test without an actual image
      // In production, this will be a real canvas snapshot
      const mockImageBase64 = ''; // Empty for basic test

      console.log('Problem:', testProblem.content);
      console.log('Calling GPT-4o validation API...');

      // Note: This will fail gracefully without image
      // Just testing the API structure
      const response = await gpt4oValidationAPI.validateStep({
        canvasImageBase64: mockImageBase64,
        problem: testProblem,
        previousSteps: [],
        currentStepNumber: 1,
      });

      console.log('Response:', response);
      setResult(response);
    } catch (err) {
      console.error('Validation test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🤖 GPT-4o API Test</Text>
          <Text style={styles.subtitle}>
            Test OpenAI GPT-4o Vision API before canvas integration
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Status</Text>
          <Text style={styles.instruction}>
            Your OpenAI API key is configured. Let's test it!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test 1: Basic Connection</Text>
          <TouchableOpacity
            style={[styles.button, testing && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={testing}
          >
            <Text style={styles.buttonText}>
              {testing ? '⏳ Testing...' : '🔌 Test Connection'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test 2: Validation API Structure</Text>
          <Text style={styles.instruction}>
            Tests the validation endpoint (will fail without image, but verifies API structure)
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, testing && styles.buttonDisabled]}
            onPress={testValidation}
            disabled={testing}
          >
            <Text style={styles.buttonText}>
              {testing ? '⏳ Testing...' : '🧪 Test Validation API'}
            </Text>
          </TouchableOpacity>
        </View>

        {testing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Connecting to GPT-4o...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ Test Result:</Text>
            <ScrollView style={styles.resultScroll}>
              <Text style={styles.resultText}>
                {JSON.stringify(result, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>❌ Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Check your OPENAI_API_KEY in .env and restart the app
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Once tests pass, we'll integrate with the drawing canvas
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: '#666',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  resultContainer: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 12,
  },
  resultScroll: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    color: '#155724',
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 12,
  },
  errorHint: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
