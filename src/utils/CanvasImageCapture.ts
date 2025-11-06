/**
 * Canvas Image Capture Utility
 *
 * Converts Skia canvas strokes to PNG image for GPT-4o Vision
 *
 * Uses react-native-skia's makeImageSnapshot() for efficient rendering
 */

import { Skia, type SkImage } from '@shopify/react-native-skia';
import type { ColoredStroke } from '../types/canvas';

export interface CaptureOptions {
  width: number;
  height: number;
  backgroundColor?: string;
}

export class CanvasImageCapture {
  /**
   * Render strokes to image and return base64 PNG
   *
   * @param strokes - Array of colored strokes to render
   * @param options - Canvas dimensions and settings
   * @returns Base64-encoded PNG string (without data:image prefix)
   */
  static async captureStrokesAsBase64(
    strokes: ColoredStroke[],
    options: CaptureOptions
  ): Promise<string> {
    const { width, height, backgroundColor = '#FFFFFF' } = options;

    try {
      // Create an offscreen surface
      const surface = Skia.Surface.Make(width, height);
      if (!surface) {
        throw new Error('Failed to create Skia surface');
      }

      const canvas = surface.getCanvas();

      // Fill background
      canvas.clear(Skia.Color(backgroundColor));

      // Draw all strokes
      const paint = Skia.Paint();
      paint.setStyle(0); // Fill
      paint.setStrokeWidth(2);
      paint.setAntiAlias(true);

      for (const stroke of strokes) {
        paint.setColor(Skia.Color(stroke.color));
        canvas.drawPath(stroke.path, paint);
      }

      // Get image snapshot
      const image = surface.makeImageSnapshot();
      if (!image) {
        throw new Error('Failed to create image snapshot');
      }

      // Encode to PNG
      const pngData = image.encodeToBase64();

      return pngData;
    } catch (error) {
      console.error('Canvas capture error:', error);
      throw error;
    }
  }

  /**
   * Capture a specific line region (for per-line validation)
   *
   * @param strokes - All strokes on canvas
   * @param lineNumber - Which line to capture (0-indexed)
   * @param lineSpacing - Pixels between lines
   * @param options - Canvas dimensions
   */
  static async captureLineAsBase64(
    strokes: ColoredStroke[],
    lineNumber: number,
    lineSpacing: number,
    options: CaptureOptions
  ): Promise<string> {
    // Calculate Y boundaries for this line
    const yStart = lineNumber * lineSpacing;
    const yEnd = (lineNumber + 1) * lineSpacing;

    // Filter strokes that belong to this line
    const lineStrokes = strokes.filter((stroke) => {
      const bounds = stroke.path.getBounds();
      const strokeMidY = bounds.y + bounds.height / 2;
      return strokeMidY >= yStart && strokeMidY < yEnd;
    });

    if (lineStrokes.length === 0) {
      // Return empty/blank image if no strokes on this line
      return this.createBlankImageBase64(options);
    }

    // Create a cropped canvas showing just this line
    const croppedHeight = lineSpacing;
    const croppedOptions: CaptureOptions = {
      ...options,
      height: croppedHeight,
    };

    // Translate strokes to start at Y=0
    const translatedStrokes = lineStrokes.map((stroke) => {
      const translatedPath = stroke.path.copy();
      translatedPath.offset(0, -yStart);
      return {
        ...stroke,
        path: translatedPath,
      };
    });

    return this.captureStrokesAsBase64(translatedStrokes, croppedOptions);
  }

  /**
   * Create a blank white image (for empty lines)
   */
  private static async createBlankImageBase64(
    options: CaptureOptions
  ): Promise<string> {
    return this.captureStrokesAsBase64([], options);
  }

  /**
   * Test function: Save image to device for debugging
   * (Requires expo-file-system in production)
   */
  static async saveImageToFile(
    base64Data: string,
    filename: string
  ): Promise<string | null> {
    try {
      // This would use expo-file-system in production
      // For now, just log
      console.log(`Would save image: ${filename} (${base64Data.length} bytes)`);
      return null;
    } catch (error) {
      console.error('Save error:', error);
      return null;
    }
  }
}

// Type definition for colored strokes (if not in main types)
declare module '../types/canvas' {
  export interface ColoredStroke {
    path: any; // SkPath
    color: string;
  }
}
