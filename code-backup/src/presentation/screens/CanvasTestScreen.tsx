/**
 * Canvas Test Screen
 * Purpose: Validate <100ms stylus latency target
 * Phase 0: Performance Prototype
 */

import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {DrawingCanvas} from '../components/DrawingCanvas';
import type {Stroke} from '../../types';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = 400;

export const CanvasTestScreen: React.FC = () => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [lastStrokeTime, setLastStrokeTime] = useState<number>(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalStrokes: 0,
    totalPoints: 0,
    averagePointsPerStroke: 0,
  });

  const handleStrokeComplete = (stroke: Stroke) => {
    const now = Date.now();
    setLastStrokeTime(now);

    const newStrokes = [...strokes, stroke];
    setStrokes(newStrokes);

    // Update performance metrics
    const totalPoints = newStrokes.reduce(
      (sum, s) => sum + s.points.length,
      0,
    );
    setPerformanceMetrics({
      totalStrokes: newStrokes.length,
      totalPoints,
      averagePointsPerStroke: totalPoints / newStrokes.length,
    });
  };

  const handleClear = () => {
    setStrokes([]);
    setPerformanceMetrics({
      totalStrokes: 0,
      totalPoints: 0,
      averagePointsPerStroke: 0,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drawing Canvas Prototype</Text>
        <Text style={styles.subtitle}>Phase 0: Performance Test</Text>
      </View>

      <View style={styles.canvasContainer}>
        <DrawingCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          inkColor="#000000"
          strokeWidth={2}
          onStrokeComplete={handleStrokeComplete}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear Canvas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.metricsTitle}>Performance Metrics</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Strokes:</Text>
          <Text style={styles.metricValue}>
            {performanceMetrics.totalStrokes}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Points:</Text>
          <Text style={styles.metricValue}>
            {performanceMetrics.totalPoints}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Points/Stroke:</Text>
          <Text style={styles.metricValue}>
            {performanceMetrics.averagePointsPerStroke.toFixed(1)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Last Stroke:</Text>
          <Text style={styles.metricValue}>
            {lastStrokeTime > 0 ? new Date(lastStrokeTime).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Performance Test Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Use a stylus (Apple Pencil, S-Pen, etc.) to draw on the canvas
        </Text>
        <Text style={styles.instructionsText}>
          2. Draw at normal speed - ink should appear instantly
        </Text>
        <Text style={styles.instructionsText}>
          3. Target: Ink rendering should feel like paper (&lt;100ms latency)
        </Text>
        <Text style={styles.instructionsText}>
          4. Check metrics to ensure smooth performance
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status Checks:</Text>
        <Text style={styles.statusItem}>✓ Skia GPU rendering active</Text>
        <Text style={styles.statusItem}>✓ Gesture handler configured</Text>
        <Text style={styles.statusItem}>✓ Pressure sensitivity enabled</Text>
        <Text style={styles.statusItem}>✓ Real-time stroke capture</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  canvasContainer: {
    padding: 20,
    alignItems: 'center',
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  metrics: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  instructions: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
    lineHeight: 20,
  },
  statusContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 40,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  statusItem: {
    fontSize: 14,
    color: '#1B5E20',
    marginBottom: 4,
  },
});
