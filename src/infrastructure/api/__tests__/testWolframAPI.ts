/**
 * WolframAlpha API Test Utility
 *
 * Run this to test your WolframAlpha API connection
 * Usage: Import and call testWolframAPI() from a component
 */

import { wolframAlphaAPI } from '../WolframAlphaAPI';

export async function testWolframAPI() {
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

  return {
    test1,
    test2,
    test3,
    test4,
    test5,
    connectionOk,
  };
}

// Quick test function for immediate feedback
export async function quickTest() {
  console.log('⚡ Quick API Test...');
  const result = await wolframAlphaAPI.testConnection();
  if (result) {
    console.log('✅ WolframAlpha API is working!');
  } else {
    console.log('❌ WolframAlpha API connection failed. Check your WOLFRAM_API_KEY in .env');
  }
  return result;
}
