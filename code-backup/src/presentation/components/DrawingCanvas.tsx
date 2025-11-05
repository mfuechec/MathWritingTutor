/**
 * Drawing Canvas Prototype
 * Performance Target: <100ms stylus latency
 * Uses: react-native-skia for GPU-accelerated rendering
 * API: Modern approach with react-native-gesture-handler (useTouchHandler deprecated)
 */

import React, {useState, useRef} from 'react';
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
  const currentPath = useRef<SkPath | null>(null);
  const currentStroke = useRef<Point[]>([]);

  // Modern API: Use Gesture.Pan() instead of deprecated useTouchHandler
  const drawGesture = Gesture.Pan()
    .runOnJS(true) // Run callbacks on JS thread
    .onBegin(event => {
      // Create new path for this stroke
      const path = Skia.Path.Make();
      path.moveTo(event.x, event.y);
      currentPath.current = path;

      // Start tracking points for this stroke
      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: 0.5, // Note: force/pressure not available in basic gesture
        timestamp: Date.now(),
      };
      currentStroke.current = [point];

      // Force re-render to show the new path
      setPaths(prev => [...prev]);
    })
    .onUpdate(event => {
      if (!currentPath.current) return;

      // Add point to path (GPU-accelerated rendering)
      currentPath.current.lineTo(event.x, event.y);

      // Track point data
      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: 0.5,
        timestamp: Date.now(),
      };
      currentStroke.current.push(point);

      // Force re-render to show updated path
      setPaths(prev => [...prev]);
    })
    .onEnd(() => {
      if (!currentPath.current) return;

      // Finalize the stroke - add to paths array
      setPaths(prev => [...prev, currentPath.current!]);

      // Notify parent component
      if (onStrokeComplete && currentStroke.current.length > 0) {
        const stroke: Stroke = {
          points: currentStroke.current,
          color: inkColor,
          thickness: strokeWidth,
        };
        onStrokeComplete(stroke);
      }

      // Reset current stroke
      currentPath.current = null;
      currentStroke.current = [];
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
          {currentPath.current && (
            <Path
              path={currentPath.current}
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
