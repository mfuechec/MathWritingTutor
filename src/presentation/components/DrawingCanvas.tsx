/**
 * Drawing Canvas Prototype
 * Performance Target: <100ms stylus latency
 * Uses: react-native-skia for GPU-accelerated rendering
 * API: Modern approach with react-native-gesture-handler
 */

import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Canvas, Path, Skia, SkPath} from '@shopify/react-native-skia';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import type {Stroke, Point} from '../../types';

interface DrawingCanvasProps {
  width: number;
  height: number;
  inkColor?: string;
  strokeWidth?: number;
  onStrokeComplete?: (stroke: Stroke) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width,
  height,
  inkColor = '#000000',
  strokeWidth = 2,
  onStrokeComplete,
}) => {
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  let currentStrokePoints: Point[] = [];

  // Modern API: Use Gesture.Pan() instead of deprecated useTouchHandler
  const drawGesture = Gesture.Pan()
    .onBegin(event => {
      // Create new path for this stroke
      const path = Skia.Path.Make();
      path.moveTo(event.x, event.y);
      setCurrentPath(path);

      // Start tracking points for this stroke
      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: 0.5, // Note: force/pressure not available in basic gesture
        timestamp: Date.now(),
      };
      currentStrokePoints = [point];
    })
    .onUpdate(event => {
      if (!currentPath) return;

      // Add point to path (GPU-accelerated rendering)
      currentPath.lineTo(event.x, event.y);

      // Track point data
      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: 0.5,
        timestamp: Date.now(),
      };
      currentStrokePoints.push(point);

      // Trigger re-render with updated path
      setCurrentPath(currentPath.copy());
    })
    .onEnd(() => {
      if (!currentPath) return;

      // Finalize the stroke - add to paths array
      setPaths(prev => [...prev, currentPath]);

      // Notify parent component
      if (onStrokeComplete && currentStrokePoints.length > 0) {
        const stroke: Stroke = {
          points: currentStrokePoints,
          color: inkColor,
          thickness: strokeWidth,
        };
        onStrokeComplete(stroke);
      }

      // Reset current stroke
      setCurrentPath(null);
      currentStrokePoints = [];
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={drawGesture}>
        <Canvas style={{width, height}}>
          {/* Render all completed paths */}
          {paths.map((path, index) => (
            <Path
              key={`path-${index}`}
              path={path}
              color={inkColor}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}

          {/* Render current path being drawn */}
          {currentPath && (
            <Path
              path={currentPath}
              color={inkColor}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
        </Canvas>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
});
