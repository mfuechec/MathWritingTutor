/**
 * Step Progress Indicator
 * Shows current progress through problem-solving steps
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  darkMode?: boolean;
}

export const StepProgressIndicator: React.FC<StepProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  darkMode = false,
}) => {
  const getStepStatus = (stepNum: number): 'completed' | 'current' | 'pending' => {
    if (completedSteps.includes(stepNum)) return 'completed';
    if (stepNum === currentStep) return 'current';
    return 'pending';
  };

  const getStepColor = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'current':
        return '#2196F3';
      case 'pending':
        return darkMode ? '#404040' : '#E0E0E0';
    }
  };

  const getTextColor = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
      case 'current':
        return '#fff'; // White text on colored backgrounds
      case 'pending':
        return darkMode ? '#999' : '#666'; // Darker text in light mode for better contrast
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => {
          const status = getStepStatus(stepNum);
          const color = getStepColor(status);
          const textColor = getTextColor(status);

          return (
            <View
              key={stepNum}
              style={[
                styles.stepCircle,
                { backgroundColor: color, borderColor: color },
                status === 'current' && styles.currentStep,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  { color: textColor },
                ]}
              >
                {status === 'completed' ? '✓' : stepNum}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelDark: {
    color: '#b0b0b0',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  currentStep: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    // Color is now set dynamically in getTextColor()
  },
});
