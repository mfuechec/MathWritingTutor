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

    // Validate strokes exist
    if (!strokes || strokes.length === 0) {
      console.warn('⚠️ No strokes to capture - returning empty image');
    }

    // PERFORMANCE: 1.0x resolution for faster rendering (was 1.5x)
    // Testing showed GPT-4o Vision performs well even at native resolution
    const SCALE_FACTOR = 1.0;
    const scaledWidth = width * SCALE_FACTOR;
    const scaledHeight = height * SCALE_FACTOR;

    try {
      // ⏱️ DETAILED TIMING - Image Capture
      const surfaceStartTime = Date.now();

      // Create an offscreen surface at higher resolution
      const surface = Skia.Surface.Make(scaledWidth, scaledHeight);
      if (!surface) {
        throw new Error('Failed to create Skia surface');
      }

      const canvas = surface.getCanvas();

      // Scale the canvas to draw at higher resolution
      canvas.scale(SCALE_FACTOR, SCALE_FACTOR);

      // Fill background
      canvas.clear(Skia.Color(backgroundColor));

      const surfaceTime = Date.now() - surfaceStartTime;
      console.log(`⏱️ │  ├─ Surface Creation: ${surfaceTime}ms`);

      // Draw all strokes with improved anti-aliasing and OCR-optimized settings
      const renderStartTime = Date.now();

      const paint = Skia.Paint();
      paint.setStyle(1); // Stroke (not Fill) - IMPORTANT for proper path rendering
      paint.setStrokeWidth(4.5); // Optimized for OCR readability and file size
      paint.setAntiAlias(true);
      // Add more smoothing for better quality
      paint.setStrokeCap(1); // Round caps
      paint.setStrokeJoin(1); // Round joins

      for (const stroke of strokes) {
        paint.setColor(Skia.Color(stroke.color));
        canvas.drawPath(stroke.path, paint);
      }

      const renderTime = Date.now() - renderStartTime;
      console.log(`⏱️ │  ├─ Stroke Rendering (${strokes.length} strokes): ${renderTime}ms`);

      // Get image snapshot at higher resolution
      const snapshotStartTime = Date.now();
      const image = surface.makeImageSnapshot();
      if (!image) {
        throw new Error('Failed to create image snapshot');
      }
      const snapshotTime = Date.now() - snapshotStartTime;
      console.log(`⏱️ │  ├─ Image Snapshot: ${snapshotTime}ms`);

      // Encode to PNG (will be at 2x resolution)
      const encodeStartTime = Date.now();
      const pngData = image.encodeToBase64();
      const encodeTime = Date.now() - encodeStartTime;
      console.log(`⏱️ │  └─ PNG Encoding: ${encodeTime}ms`);

      console.log(`📸 Image captured: ${scaledWidth}x${scaledHeight} (${SCALE_FACTOR}x scale)`);
      console.log(`📊 Image size: ${pngData.length} bytes (${(pngData.length / 1024).toFixed(1)}KB)`);

      // DEBUG: Log the data URL so you can paste into browser to inspect the image
      // This helps diagnose OCR issues by showing exactly what Mathpix receives
      if (pngData.length < 1000) {
        console.warn('⚠️ Image is very small (<1KB), might be blank or nearly empty');
      }
      console.log('🔍 To inspect the image being sent to OCR, paste this into your browser:');
      console.log(`data:image/png;base64,${pngData.substring(0, 200)}...`);

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
