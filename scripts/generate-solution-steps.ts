/**
 * Generate Solution Steps for Library Problems
 *
 * This script generates step-by-step solutions for all problems
 * in the problem library that don't already have solution steps.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// You'll need to set OPENAI_API_KEY in your environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable not set');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface Problem {
  id: string;
  content: string;
  difficulty: string;
  goalState: {
    targetForm?: string;
    variable?: string;
    variables?: string[];
  };
  expectedSolutionSteps?: string[];
}

/**
 * Generate solution steps for a single problem
 */
async function generateSolutionSteps(problem: Problem): Promise<string[]> {
  const targetAnswer = problem.goalState.targetForm || 'unknown';
  const variable = problem.goalState.variable || problem.goalState.variables?.[0] || 'x';

  console.log(`\n🔍 Generating solution for: ${problem.id}`);
  console.log(`   Problem: ${problem.content}`);
  console.log(`   Target: ${targetAnswer}`);

  const prompt = `Generate step-by-step solution for this algebra problem.

Problem: ${problem.content}
Goal: Solve for ${variable}
Expected Answer: ${targetAnswer}

INSTRUCTIONS:
1. Show each algebraic step clearly
2. Start with the original equation
3. End with the final answer (${targetAnswer})
4. Use plain text notation (no LaTeX)
5. Each step should be a valid equation or expression
6. Include ONLY the essential steps (no explanations)

EXAMPLE FORMAT:
For problem "2x + 3 = 7" with answer "x = 2":
["2x + 3 = 7", "2x = 4", "x = 2"]

For problem "2(x + 3) = 14" with answer "x = 4":
["2(x + 3) = 14", "2x + 6 = 14", "2x = 8", "x = 4"]

Return ONLY a JSON array of step strings, nothing else.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a math teacher generating step-by-step solutions. Return ONLY a JSON array of strings, no explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No response from GPT-4o');
    }

    // Parse the response - it should be a JSON array
    let steps: string[];
    try {
      steps = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON array from markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        steps = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON response');
      }
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Invalid steps format');
    }

    console.log(`   ✅ Generated ${steps.length} steps:`, steps);
    return steps;
  } catch (error) {
    console.error(`   ❌ Error generating steps:`, error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('📚 Solution Steps Generator');
  console.log('================================\n');

  // Read the problem library file
  const libraryPath = path.join(__dirname, '../src/data/problemLibrary.ts');
  const libraryContent = fs.readFileSync(libraryPath, 'utf-8');

  // Parse problems from the file (simple extraction)
  // We'll generate steps and output them as TypeScript code to add manually

  const problems: Array<{id: string, content: string, targetForm: string, variable: string, difficulty: string}> = [
    // EASY PROBLEMS
    { id: 'easy-1', content: '2x + 3 = 7', targetForm: 'x = 2', variable: 'x', difficulty: 'easy' },
    { id: 'easy-2', content: '5x = 15', targetForm: 'x = 3', variable: 'x', difficulty: 'easy' },
    { id: 'easy-3', content: 'x + 8 = 12', targetForm: 'x = 4', variable: 'x', difficulty: 'easy' },
    { id: 'easy-4', content: 'x - 5 = 9', targetForm: 'x = 14', variable: 'x', difficulty: 'easy' },

    // MEDIUM PROBLEMS
    { id: 'medium-1', content: '3x + 7 = 22', targetForm: 'x = 5', variable: 'x', difficulty: 'medium' },
    { id: 'medium-2', content: '4x - 9 = 15', targetForm: 'x = 6', variable: 'x', difficulty: 'medium' },
    { id: 'medium-3', content: '2(x + 3) = 14', targetForm: 'x = 4', variable: 'x', difficulty: 'medium' },
    { id: 'medium-4', content: '5x + 2 = 3x + 10', targetForm: 'x = 4', variable: 'x', difficulty: 'medium' },

    // HARD PROBLEMS
    { id: 'hard-1', content: '2(3x - 5) + 4 = 22', targetForm: 'x = 14/3', variable: 'x', difficulty: 'hard' },
    { id: 'hard-2', content: '4(x + 2) = 2(x + 8)', targetForm: 'x = 4', variable: 'x', difficulty: 'hard' },
    { id: 'hard-3', content: '3(2x - 1) - 2(x + 3) = 11', targetForm: 'x = 5', variable: 'x', difficulty: 'hard' },

    // SYSTEM PROBLEMS
    { id: 'system-1', content: 'x + y = 5\nx - y = 1', targetForm: '(3, 2)', variable: 'x, y', difficulty: 'medium' },
    { id: 'system-2', content: '2x + y = 7\nx - y = 2', targetForm: '(3, 1)', variable: 'x, y', difficulty: 'medium' },

    // INEQUALITY PROBLEMS
    { id: 'inequality-1', content: '3x - 5 < 10', targetForm: 'x < 5', variable: 'x', difficulty: 'easy' },
    { id: 'inequality-2', content: '2x + 7 ≥ 15', targetForm: 'x ≥ 4', variable: 'x', difficulty: 'medium' },

    // QUADRATIC PROBLEMS
    { id: 'quadratic-1', content: 'x² + 5x + 6 = 0', targetForm: 'x = -2 or x = -3', variable: 'x', difficulty: 'medium' },
    { id: 'quadratic-2', content: 'x² - 4 = 0', targetForm: 'x = 2 or x = -2', variable: 'x', difficulty: 'easy' },

    // RATIONAL PROBLEMS
    { id: 'rational-1', content: '(x + 2) / 3 = 4', targetForm: 'x = 10', variable: 'x', difficulty: 'easy' },
    { id: 'rational-2', content: 'x/2 + x/3 = 5', targetForm: 'x = 6', variable: 'x', difficulty: 'medium' },
  ];

  const results: {[key: string]: string[]} = {};
  let successCount = 0;
  let failCount = 0;

  // Generate steps for each problem
  for (const problem of problems) {
    try {
      const steps = await generateSolutionSteps({
        id: problem.id,
        content: problem.content,
        difficulty: problem.difficulty,
        goalState: {
          targetForm: problem.targetForm,
          variable: problem.variable,
        },
      });

      results[problem.id] = steps;
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate steps for ${problem.id}`);
      failCount++;
    }
  }

  // Output results
  console.log('\n\n📝 RESULTS');
  console.log('================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('\n\n🔧 ADD THESE TO problemLibrary.ts:\n');
  console.log('Copy and paste the following into each problem definition:\n');

  for (const [id, steps] of Object.entries(results)) {
    console.log(`// ${id}`);
    console.log(`expectedSolutionSteps: ${JSON.stringify(steps, null, 2)},\n`);
  }

  // Also write to a file
  const outputPath = path.join(__dirname, 'generated-solution-steps.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

main().catch(console.error);
