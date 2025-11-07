/**
 * LaTeX to Speech Converter
 * Converts LaTeX mathematical notation to natural speakable text
 * for use with text-to-speech systems
 */

export class LatexToSpeech {
  /**
   * Convert LaTeX string to speakable text
   *
   * Example:
   *   "18 - \frac{68}{7}" → "18 minus 68 over 7"
   *   "x^2 + 3x - 4" → "x squared plus 3x minus 4"
   */
  static convert(text: string): string {
    if (!text) return text;

    let result = text;

    // Fractions: \frac{numerator}{denominator} → "numerator over denominator"
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_, num, den) => {
      return `${num} over ${den}`;
    });

    // Square roots: \sqrt{x} → "square root of x"
    result = result.replace(/\\sqrt\{([^}]+)\}/g, (_, content) => {
      return `square root of ${content}`;
    });

    // Nth roots: \sqrt[n]{x} → "nth root of x"
    result = result.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, (_, n, content) => {
      return `${n}th root of ${content}`;
    });

    // Exponents with braces: x^{n} → "x to the power of n"
    result = result.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, (_, base, exp) => {
      if (exp === '2') return `${base} squared`;
      if (exp === '3') return `${base} cubed`;
      return `${base} to the power of ${exp}`;
    });

    // Simple exponents: x^2 → "x squared"
    result = result.replace(/([a-zA-Z0-9]+)\^([0-9])/g, (_, base, exp) => {
      if (exp === '2') return `${base} squared`;
      if (exp === '3') return `${base} cubed`;
      return `${base} to the power of ${exp}`;
    });

    // Math operators
    result = result.replace(/\\times/g, 'times');
    result = result.replace(/\\div/g, 'divided by');
    result = result.replace(/\\pm/g, 'plus or minus');
    result = result.replace(/\\mp/g, 'minus or plus');
    result = result.replace(/\\cdot/g, 'times');
    result = result.replace(/\\neq/g, 'not equal to');
    result = result.replace(/\\leq/g, 'less than or equal to');
    result = result.replace(/\\geq/g, 'greater than or equal to');
    result = result.replace(/\\approx/g, 'approximately equal to');

    // Greek letters (common ones)
    result = result.replace(/\\alpha/g, 'alpha');
    result = result.replace(/\\beta/g, 'beta');
    result = result.replace(/\\gamma/g, 'gamma');
    result = result.replace(/\\delta/g, 'delta');
    result = result.replace(/\\theta/g, 'theta');
    result = result.replace(/\\pi/g, 'pi');
    result = result.replace(/\\lambda/g, 'lambda');
    result = result.replace(/\\mu/g, 'mu');
    result = result.replace(/\\sigma/g, 'sigma');

    // Remove any remaining backslashes (cleanup)
    result = result.replace(/\\/g, '');

    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  /**
   * Test the converter with common patterns
   */
  static test(): void {
    const tests = [
      {
        input: '18 - \\frac{68}{7}',
        expected: '18 minus 68 over 7',
      },
      {
        input: 'x^2 + 3x - 4',
        expected: 'x squared plus 3x minus 4',
      },
      {
        input: '\\frac{1}{2}x = 5',
        expected: '1 over 2 x equals 5',
      },
      {
        input: '\\sqrt{16} = 4',
        expected: 'square root of 16 equals 4',
      },
      {
        input: 'x^{10}',
        expected: 'x to the power of 10',
      },
    ];

    console.log('=== LaTeX to Speech Tests ===');
    tests.forEach(({ input, expected }) => {
      const result = this.convert(input);
      const passed = result === expected;
      console.log(`${passed ? '✓' : '✗'} "${input}"`);
      console.log(`  Expected: "${expected}"`);
      console.log(`  Got:      "${result}"`);
      console.log();
    });
  }
}
