/**
 * Math Tutor - Main App Component
 * Phase 0: Performance Prototype Test
 * React Native 0.82 + React 19
 */

import React from 'react';
import {StyleSheet, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {CanvasTestScreen} from './src/presentation/screens/CanvasTestScreen';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <CanvasTestScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
