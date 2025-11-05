import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Canvas, Path, Skia, SkPath, Line } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { useState, useRef, useMemo, useCallback } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 40;

// Guide line configuration
const GUIDE_LINE_SPACING = 60; // pixels between lines
const GUIDE_LINE_COLOR = '#E0E0E0';
const GUIDE_LINE_WIDTH = 1;

// Available ink colors
const COLORS = {
  BLACK: '#000000',
  BLUE: '#0066CC',
  RED: '#CC0000',
};

// Type for stroke with color
type ColoredStroke = {
  path: SkPath;
  color: string;
};

export default function App() {
  const [pathStrings, setPathStrings] = useState<string[]>([]);
  const [pathColors, setPathColors] = useState<string[]>([]);
  const [pathLineNumbers, setPathLineNumbers] = useState<number[]>([]); // Which line region each stroke belongs to
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [currentColor, setCurrentColor] = useState<string>(COLORS.BLACK);
  const [showGuideLines, setShowGuideLines] = useState<boolean>(true);
  const pathRef = useRef<SkPath | null>(null);
  const colorRef = useRef<string>(COLORS.BLACK);
  const startYRef = useRef<number>(0); // Track where stroke started

  // Helper function to determine which line region a Y coordinate belongs to
  const getLineNumber = (y: number): number => {
    // Line 0 is above first guide line, line 1 is between first and second, etc.
    return Math.floor(y / GUIDE_LINE_SPACING);
  };

  // Helper function to add a completed stroke (called from JS thread)
  const addCompletedStroke = useCallback((pathString: string, color: string, lineNumber: number) => {
    console.log('addCompletedStroke - pathString:', pathString);
    console.log('addCompletedStroke - color:', color);
    console.log('addCompletedStroke - lineNumber:', lineNumber);
    setPathStrings(prev => {
      console.log('setPathStrings - prev:', prev, 'is array:', Array.isArray(prev));
      const newArr = [...prev, pathString];
      console.log('setPathStrings - newArr:', newArr, 'is array:', Array.isArray(newArr));
      return newArr;
    });
    setPathColors(prev => [...prev, color]);
    setPathLineNumbers(prev => [...prev, lineNumber]);
  }, []);

  // Generate guide lines based on canvas size
  const generateGuideLines = () => {
    const lines = [];
    const numLines = Math.floor(CANVAS_SIZE / GUIDE_LINE_SPACING);
    for (let i = 1; i <= numLines; i++) {
      const y = i * GUIDE_LINE_SPACING;
      lines.push({
        key: `guide-${i}`,
        y,
      });
    }
    return lines;
  };

  const guideLines = generateGuideLines();

  // Group strokes by line number
  const getStrokesByLine = useCallback(() => {
    const lineGroups: { [lineNumber: number]: number[] } = {};
    pathLineNumbers.forEach((lineNum, index) => {
      if (!lineGroups[lineNum]) {
        lineGroups[lineNum] = [];
      }
      lineGroups[lineNum].push(index);
    });
    return lineGroups;
  }, [pathLineNumbers]);

  const strokesByLine = getStrokesByLine();

  // Debug logging
  console.log('Component render - pathStrings:', pathStrings);
  console.log('Component render - pathStrings.length:', pathStrings?.length);
  console.log('Component render - pathStrings is array:', Array.isArray(pathStrings));
  console.log('Component render - currentPath:', currentPath !== null);

  // Clear canvas function
  const clearCanvas = useCallback(() => {
    setPathStrings([]);
    setPathColors([]);
    setPathLineNumbers([]);
  }, []);

  // Drawing gesture (memoized)
  const drawGesture = useMemo(() =>
    Gesture.Pan()
      .averageTouches(true)
      .maxPointers(1)
      .onBegin((e) => {
        'worklet';
        const path = Skia.Path.Make();
        path.moveTo(e.x, e.y);
        pathRef.current = path;
        startYRef.current = e.y; // Track starting Y position
        runOnJS(setCurrentPath)(path);
      })
      .onUpdate((e) => {
        'worklet';
        if (pathRef.current) {
          pathRef.current.lineTo(e.x, e.y);
          runOnJS(setCurrentPath)(pathRef.current.copy());
        }
      })
      .onEnd(() => {
        'worklet';
        console.log('onEnd triggered');
        console.log('pathRef.current:', pathRef.current);
        if (pathRef.current) {
          // Convert SkPath to SVG string (serializable!)
          const pathString = pathRef.current.toSVGString();
          const strokeColor = colorRef.current;

          // Calculate which line region this stroke belongs to (based on starting Y)
          const lineNumber = Math.floor(startYRef.current / GUIDE_LINE_SPACING);

          console.log('About to add pathString:', pathString);
          console.log('strokeColor:', strokeColor);
          console.log('Line number:', lineNumber, 'startY:', startYRef.current);

          // Call helper function on JS thread
          runOnJS(addCompletedStroke)(pathString, strokeColor, lineNumber);
        }
        pathRef.current = null;
        runOnJS(setCurrentPath)(null);
      })
  , [addCompletedStroke]);

  // Always use draw gesture (erase is now a button action)
  const gesture = drawGesture;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <Text style={styles.title}>Drawing Test</Text>
          <Text style={styles.subtitle}>Draw with your finger</Text>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.colorPicker}>
            <Text style={styles.colorLabel}>Color:</Text>
            <View style={styles.colorButtons}>
              {Object.entries(COLORS).map(([name, color]) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    currentColor === color && styles.colorButtonSelected,
                  ]}
                  onPress={() => {
                    setCurrentColor(color);
                    colorRef.current = color;
                  }}
                >
                  {currentColor === color && <View style={styles.checkmark} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCanvas}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear Canvas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guideLineToggle}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowGuideLines(!showGuideLines)}
          >
            <Text style={styles.toggleButtonText}>
              {showGuideLines ? '📏 Hide Lines' : '📏 Show Lines'}
            </Text>
          </TouchableOpacity>
        </View>

        <GestureDetector gesture={gesture}>
          <View style={styles.canvasContainer}>
            <Canvas style={styles.canvas}>
              {/* Guide lines (render first, behind strokes) */}
              {showGuideLines && guideLines.map((line) => (
                <Line
                  key={line.key}
                  p1={{ x: 0, y: line.y }}
                  p2={{ x: CANVAS_SIZE, y: line.y }}
                  color={GUIDE_LINE_COLOR}
                  strokeWidth={GUIDE_LINE_WIDTH}
                />
              ))}

              {/* User strokes */}
              {Array.isArray(pathStrings) && pathStrings.map((pathString, index) => {
                const path = Skia.Path.MakeFromSVGString(pathString);
                if (!path) return null;
                return (
                  <Path
                    key={index}
                    path={path}
                    color={pathColors[index] || COLORS.BLACK}
                    style="stroke"
                    strokeWidth={2}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                );
              })}

              {/* Current path being drawn */}
              {currentPath && (
                <Path
                  path={currentPath}
                  color={currentColor}
                  style="stroke"
                  strokeWidth={2}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}
            </Canvas>
        </View>
      </GestureDetector>

        <View style={styles.infoContainer}>
          <Text style={styles.info}>Total Strokes: {pathStrings?.length || 0}</Text>
          <Text style={styles.info}>
            Lines with strokes: {Object.keys(strokesByLine).length}
          </Text>
          {Object.keys(strokesByLine).length > 0 && (
            <Text style={styles.infoDetail}>
              {Object.entries(strokesByLine)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([lineNum, strokes]) => `Line ${lineNum}: ${strokes.length} stroke${strokes.length !== 1 ? 's' : ''}`)
                .join(' | ')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  toolbar: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 8,
    gap: 12,
  },
  toolSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#0066CC',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#0066CC',
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
    color: '#333',
  },
  colorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  guideLineToggle: {
    alignItems: 'center',
    marginTop: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  canvasContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  info: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  infoDetail: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});
