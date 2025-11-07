/**
 * Mathpix OCR API
 * Specialized handwriting OCR for mathematical expressions
 * Docs: https://docs.mathpix.com/
 */

import { MATHPIX_APP_ID, MATHPIX_APP_KEY } from '@env';

export interface MathpixOCRRequest {
  imageBase64: string; // PNG image as base64
}

export interface MathpixOCRResponse {
  text: string; // LaTeX or text representation
  confidence: number; // 0-1
  error?: string;
  rawResponse?: any;
}

export class MathpixOCR {
  private appId: string;
  private appKey: string;
  private apiUrl = 'https://api.mathpix.com/v3/text';

  constructor() {
    this.appId = MATHPIX_APP_ID;
    this.appKey = MATHPIX_APP_KEY;

    // Debug: Log credential status (masked)
    console.log('🔐 Mathpix Credentials Check:');
    console.log('  APP_ID:', MATHPIX_APP_ID ? `${MATHPIX_APP_ID.substring(0, 8)}...` : 'MISSING');
    console.log('  APP_KEY:', MATHPIX_APP_KEY ? `${MATHPIX_APP_KEY.substring(0, 8)}...` : 'MISSING');

    if (!MATHPIX_APP_ID || !MATHPIX_APP_KEY) {
      console.warn('⚠️ Mathpix credentials not configured. Add MATHPIX_APP_ID and MATHPIX_APP_KEY to .env');
    }
  }

  /**
   * Recognize handwritten math from an image
   */
  async recognizeExpression(request: MathpixOCRRequest): Promise<MathpixOCRResponse> {
    const startTime = Date.now();

    try {
      console.log('📸 Calling Mathpix OCR...');
      console.log('  URL:', this.apiUrl);
      console.log('  app_id:', this.appId ? `${this.appId.substring(0, 10)}...` : 'UNDEFINED');
      console.log('  app_key:', this.appKey ? `${this.appKey.substring(0, 10)}...` : 'UNDEFINED');

      // Mathpix API request with enhanced preprocessing options
      const requestBody = {
        src: `data:image/png;base64,${request.imageBase64}`,
        formats: ['text', 'latex_simplified'],
        ocr: ['math', 'text'],
        skip_recrop: false,
        // Enhanced preprocessing for better handwriting recognition
        include_smiles: false,
        include_svg: false,
        include_tsv: false,
        include_table_html: false,
        // Image preprocessing options
        rm_spaces: true, // Remove extra spaces
        rm_fonts: false, // Keep font variations (important for handwriting)
      };

      console.log('📤 Mathpix request:', JSON.stringify({
        ...requestBody,
        src: `data:image/png;base64,${request.imageBase64.substring(0, 50)}...`
      }));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'app_id': this.appId,
          'app_key': this.appKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Mathpix API error:', response.status, errorText);
        console.error('   Full error details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });

        // Provide specific error messages based on status
        let errorMessage = 'Mathpix OCR failed';
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Mathpix authentication failed. Check your API credentials.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid image format or request. The image may be empty or corrupted.';
        } else if (response.status === 429) {
          errorMessage = 'Mathpix rate limit exceeded. Please wait a moment.';
        } else if (errorText.includes('content not found') || errorText.includes('Content not found')) {
          errorMessage = 'Mathpix could not recognize any text in the image. Try writing larger and clearer.';
        }

        throw new Error(`${errorMessage}: ${response.status}`);
      }

      const data = await response.json();

      // Debug: Log full response to see structure
      console.log('=== MATHPIX RAW RESPONSE ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('============================');

      console.log('=== MATHPIX OCR RESULTS ===');
      console.log('📝 Text:', data.text);
      console.log('📐 LaTeX:', data.latex_simplified);
      console.log('🎯 Confidence:', (data.confidence * 100).toFixed(1) + '%');
      console.log('⏱️  Response Time:', responseTime + 'ms');
      console.log('===========================');

      // Check if response has error
      if (data.error) {
        console.error('❌ Mathpix returned error:', data.error);

        // Specific error handling for "content not found"
        if (data.error.includes('content not found') || data.error.includes('Content not found')) {
          throw new Error('Mathpix could not recognize any text in the image. Try writing larger and more clearly.');
        }

        throw new Error(`Mathpix error: ${data.error}`);
      }

      // Prefer text format over LaTeX for student handwriting
      const recognizedText = data.text || data.latex_simplified || '';

      if (!recognizedText) {
        console.error('❌ No text or LaTeX in Mathpix response');
        console.error('This usually means the image is blank or Mathpix cannot read the handwriting.');
        throw new Error('Mathpix returned no recognized text. Try writing larger and clearer.');
      }

      return {
        text: recognizedText,
        confidence: data.confidence || 0,
        rawResponse: data,
      };
    } catch (error) {
      console.error('Mathpix OCR error:', error);
      return {
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test connection to Mathpix API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Create a simple test image (1x1 white pixel)
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'app_id': this.appId,
          'app_key': this.appKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: `data:image/png;base64,${testImage}`,
          formats: ['text'],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Mathpix connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const mathpixOCR = new MathpixOCR();
