/**
 * WolframAlpha API Client
 *
 * Purpose: Math expression validation and solving
 * Use Case: Validate student steps, check correctness, solve equations
 *
 * API Documentation: https://products.wolframalpha.com/api/documentation
 */

import axios from 'axios';
import { WOLFRAM_API_KEY, WOLFRAM_API_URL, API_TIMEOUT } from '@env';

export interface WolframQueryResult {
  success: boolean;
  result?: string;
  latex?: string;
  error?: string;
}

export interface WolframValidationResult {
  correct: boolean;
  expectedResult?: string;
  studentResult?: string;
  errorType?: string;
}

export class WolframAlphaAPI {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.apiKey = WOLFRAM_API_KEY;
    this.baseUrl = WOLFRAM_API_URL;
    this.timeout = parseInt(API_TIMEOUT || '5000', 10);

    if (!this.apiKey) {
      console.warn('⚠️ WolframAlpha API key not configured. Add WOLFRAM_API_KEY to .env');
    }
  }

  /**
   * Query WolframAlpha with a math expression
   * Example: "solve 2x + 3 = 7"
   */
  async query(input: string): Promise<WolframQueryResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured',
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/query`, {
        params: {
          input,
          appid: this.apiKey,
          output: 'json',
          format: 'plaintext',
        },
        timeout: this.timeout,
      });

      if (response.data.queryresult.success) {
        // Extract the result from pods
        const resultPod = response.data.queryresult.pods?.find(
          (pod: any) => pod.title === 'Result' || pod.title === 'Solution'
        );

        return {
          success: true,
          result: resultPod?.subpods?.[0]?.plaintext || 'No result found',
        };
      } else {
        return {
          success: false,
          error: 'Query failed',
        };
      }
    } catch (error) {
      console.error('WolframAlpha API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Simple API to solve an equation
   * Example: solveMathExpression("2x + 3 = 7")
   * Returns: "x = 2"
   */
  async solveMathExpression(expression: string): Promise<WolframQueryResult> {
    return this.query(`solve ${expression}`);
  }

  /**
   * Validate if a step is correct
   * Compares student's answer with WolframAlpha's solution
   */
  async validateStep(
    studentExpression: string,
    expectedProblem: string
  ): Promise<WolframValidationResult> {
    try {
      // Solve the expected problem
      const expectedResult = await this.solveMathExpression(expectedProblem);

      if (!expectedResult.success) {
        return {
          correct: false,
          errorType: 'UNABLE_TO_VALIDATE',
        };
      }

      // Solve student's expression
      const studentResult = await this.solveMathExpression(studentExpression);

      if (!studentResult.success) {
        return {
          correct: false,
          errorType: 'INVALID_EXPRESSION',
        };
      }

      // Compare results
      const correct = this.compareResults(
        expectedResult.result || '',
        studentResult.result || ''
      );

      return {
        correct,
        expectedResult: expectedResult.result,
        studentResult: studentResult.result,
        errorType: correct ? undefined : 'INCORRECT_SOLUTION',
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        correct: false,
        errorType: 'VALIDATION_ERROR',
      };
    }
  }

  /**
   * Check if an equation is mathematically valid
   * Example: "2x = 4" from "2x + 3 = 7"
   */
  async checkEquationEquivalence(expr1: string, expr2: string): Promise<boolean> {
    try {
      const query = `is ${expr1} equivalent to ${expr2}`;
      const result = await this.query(query);

      if (result.success && result.result) {
        // WolframAlpha returns "True" or "False" for equivalence
        return result.result.toLowerCase().includes('true');
      }

      return false;
    } catch (error) {
      console.error('Equivalence check error:', error);
      return false;
    }
  }

  /**
   * Simplify an expression
   * Example: "2x + 3x" -> "5x"
   */
  async simplifyExpression(expression: string): Promise<WolframQueryResult> {
    return this.query(`simplify ${expression}`);
  }

  /**
   * Test API connection
   * Use this to verify your AppID is working
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('2 + 2');
      return result.success && result.result === '4';
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Helper: Compare two mathematical results
  private compareResults(result1: string, result2: string): boolean {
    // Normalize the results (remove whitespace, convert to lowercase)
    const normalize = (str: string) =>
      str.replace(/\s/g, '').toLowerCase();

    return normalize(result1) === normalize(result2);
  }
}

// Singleton instance
export const wolframAlphaAPI = new WolframAlphaAPI();
