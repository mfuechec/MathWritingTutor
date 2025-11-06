/**
 * WolframAlpha API Test Screen
 *
 * Temporary component to test WolframAlpha API connection
 * Run this after adding your WOLFRAM_API_KEY to .env
 *
 * Usage:
 * 1. Replace App.tsx export with: export { default } from './TestWolframAPI';
 * 2. Restart Metro: npx expo start --clear
 * 3. Press "Test API" button
 * 4. Check console logs for results
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { wolframAlphaAPI } from './src/infrastructure/api/WolframAlphaAPI';

export default function TestWolframAPI() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [quickTestResult, setQuickTestResult] = useState<boolean | null>(null);

  const runQuickTest = async () => {
    setTesting(true);
    setQuickTestResult(null);

    console.log('\n🚀 Running quick test...\n');
    console.log('⚡ Quick API Test...');
    const result = await wolframAlphaAPI.testConnection();
    if (result) {
      console.log('✅ WolframAlpha API is working!');
    } else {
      console.log('❌ WolframAlpha API connection failed. Check your WOLFRAM_API_KEY in .env');
    }

    setQuickTestResult(result);
    setTesting(false);
  };

  const runFullTest = async () => {
    setTesting(true);
    setResults(null);

    console.log('\n🚀 Running full test suite...\n');

    console.log('🧪 Testing WolframAlpha API Connection...\n');

    // Test 1: Simple arithmetic
    console.log('Test 1: Simple arithmetic (2 + 2)');
    const test1 = await wolframAlphaAPI.query('2 + 2');
    console.log('Result:', test1);
    console.log('✅ Pass:', test1.success && test1.result === '4');
    console.log('---\n');

    // Test 2: Solve equation
    console.log('Test 2: Solve equation (2x + 3 = 7)');
    const test2 = await wolframAlphaAPI.solveMathExpression('2x + 3 = 7');
    console.log('Result:', test2);
    console.log('✅ Expected: x = 2');
    console.log('---\n');

    // Test 3: Simplify expression
    console.log('Test 3: Simplify expression (2x + 3x)');
    const test3 = await wolframAlphaAPI.simplifyExpression('2x + 3x');
    console.log('Result:', test3);
    console.log('✅ Expected: 5x');
    console.log('---\n');

    // Test 4: Check equivalence
    console.log('Test 4: Check equivalence (2x + 3 = 7 vs 2x = 4)');
    const test4 = await wolframAlphaAPI.checkEquationEquivalence('2x + 3 = 7', '2x = 4');
    console.log('Result:', test4);
    console.log('✅ Expected: true (after subtracting 3 from both sides)');
    console.log('---\n');

    // Test 5: Validate student step
    console.log('Test 5: Validate student step');
    const test5 = await wolframAlphaAPI.validateStep('2x = 4', '2x + 3 = 7');
    console.log('Result:', test5);
    console.log('✅ Should be correct step');
    console.log('---\n');

    // Test 6: Connection test
    console.log('Test 6: Connection test');
    const connectionOk = await wolframAlphaAPI.testConnection();
    console.log('✅ Connection:', connectionOk ? 'SUCCESS' : 'FAILED');

    console.log('\n🎉 WolframAlpha API tests complete!');

    const testResults = {
      test1,
      test2,
      test3,
      test4,
      test5,
      connectionOk,
    };

    setResults(testResults);
    setTesting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 WolframAlpha API Test</Text>
          <Text style={styles.subtitle}>
            Test your API connection before building the validation engine
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Get Your AppID</Text>
          <Text style={styles.instruction}>
            1. Visit: https://developer.wolframalpha.com/
          </Text>
          <Text style={styles.instruction}>
            2. Click "Get an AppID"
          </Text>
          <Text style={styles.instruction}>
            3. Fill out the form (Education, Non-Commercial)
          </Text>
          <Text style={styles.instruction}>
            4. Copy your AppID
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Add to .env</Text>
          <Text style={styles.instruction}>
            Open: .env
          </Text>
          <Text style={styles.instruction}>
            Add: WOLFRAM_API_KEY=YOUR-APPID-HERE
          </Text>
          <Text style={styles.instruction}>
            Restart: npx expo start --clear
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 3: Test Connection</Text>

          <TouchableOpacity
            style={[styles.button, testing && styles.buttonDisabled]}
            onPress={runQuickTest}
            disabled={testing}
          >
            <Text style={styles.buttonText}>
              {testing ? '⏳ Testing...' : '⚡ Quick Test (2+2)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, testing && styles.buttonDisabled]}
            onPress={runFullTest}
            disabled={testing}
          >
            <Text style={styles.buttonText}>
              {testing ? '⏳ Testing...' : '🧪 Full Test Suite'}
            </Text>
          </TouchableOpacity>
        </View>

        {quickTestResult !== null && (
          <View style={[styles.result, quickTestResult ? styles.resultSuccess : styles.resultError]}>
            <Text style={styles.resultText}>
              {quickTestResult ? '✅ API Connection Successful!' : '❌ API Connection Failed'}
            </Text>
            <Text style={styles.resultSubtext}>
              {quickTestResult
                ? 'Your WolframAlpha API is working!'
                : 'Check your WOLFRAM_API_KEY in .env'}
            </Text>
          </View>
        )}

        {results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Test Results:</Text>

            <View style={styles.testResult}>
              <Text style={styles.testLabel}>Connection Test:</Text>
              <Text style={[styles.testValue, results.connectionOk && styles.testSuccess]}>
                {results.connectionOk ? '✅ PASS' : '❌ FAIL'}
              </Text>
            </View>

            <View style={styles.testResult}>
              <Text style={styles.testLabel}>Simple Math (2+2):</Text>
              <Text style={styles.testValue}>
                {results.test1?.result || 'No result'}
              </Text>
            </View>

            <View style={styles.testResult}>
              <Text style={styles.testLabel}>Solve Equation:</Text>
              <Text style={styles.testValue}>
                {results.test2?.result || 'No result'}
              </Text>
            </View>

            <View style={styles.testResult}>
              <Text style={styles.testLabel}>Simplify (2x + 3x):</Text>
              <Text style={styles.testValue}>
                {results.test3?.result || 'No result'}
              </Text>
            </View>

            <Text style={styles.instruction}>
              💡 Check console logs for detailed results
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Once tests pass, you can switch back to the main app
          </Text>
          <Text style={styles.footerText}>
            Replace this component with App.tsx in index.ts
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
    marginBottom: 8,
    paddingLeft: 8,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
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
  result: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  resultSuccess: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  resultError: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  testResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  testValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  testSuccess: {
    color: '#28a745',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});
