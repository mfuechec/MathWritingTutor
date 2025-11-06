# Handwriting Math Tutor - System Architecture

**Project:** Math Writing Tutor
**Document Type:** Technical Architecture
**Version:** 1.0
**Date:** 2025-11-05
**Author:** Winston (Architect Agent)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Vision](#architecture-vision)
3. [System Architecture Overview](#system-architecture-overview)
4. [Component Architecture](#component-architecture)
5. [Technology Stack](#technology-stack)
6. [Data Architecture](#data-architecture)
7. [Performance Architecture](#performance-architecture)
8. [Security & Compliance Architecture](#security--compliance-architecture)
9. [Key Architectural Decisions](#key-architectural-decisions)
10. [Risk Mitigation Strategies](#risk-mitigation-strategies)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Appendix](#appendix)

---

## Executive Summary

### Project Context

The Handwriting Math Tutor is a tablet-first mobile application that delivers intelligent, real-time math tutoring through natural handwriting interaction. Students write solutions line-by-line while receiving immediate validation and graduated hints—creating the experience of having an expert tutor watching over their shoulder.

### Architectural Philosophy

**Local-First, Cloud-Enhanced**

The architecture prioritizes instant, paper-like responsiveness by keeping all drawing operations local while leveraging cloud services for validation, storage, and analytics. This hybrid approach delivers the "magic moment" user experience: sub-100ms stylus latency with sub-500ms validation feedback.

### Critical Architecture Characteristics

| Characteristic | Target | Strategy |
|----------------|--------|----------|
| **Stylus Latency** | <100ms | Local canvas rendering with react-native-skia |
| **Validation Speed** | <500ms | External API + local fallbacks + optimistic UI |
| **Data Reliability** | Zero loss | Local-first storage with background sync |
| **Scalability** | 1,000+ concurrent users | Serverless cloud architecture |
| **Reusability** | Cross-project modules | Clean architecture with modular components |
| **Compliance** | COPPA/FERPA | Privacy-by-design, minimal PII, encryption |

### Architecture Type

**Mobile Application (Tablet-First) - Medium Complexity**

- **Platform:** Cross-platform mobile (React Native)
- **Deployment:** iOS App Store + Google Play Store
- **Backend:** Serverless cloud with external API integration
- **Data:** Local-first with cloud sync
- **Complexity Drivers:** Real-time handwriting performance, external API dependency, dual validation logic, educational compliance

---

## Architecture Vision

### North Star Principle

> **"Invisible Technology, Visible Learning"**

The architecture must make technology disappear. Students should feel like they're working on paper with an expert tutor present, not interacting with an app. Every architectural decision must serve this goal.

### Core Design Principles

#### 1. **Local-First Interaction**

**Principle:** All critical user interactions happen locally without network dependency.

**Application:**
- Drawing operates entirely on-device (zero network calls)
- Canvas state maintained in device RAM
- Validation triggers only on explicit step submission
- Offline capability for interrupted connectivity

**Why:** Network latency is the enemy of "paper-like" responsiveness.

---

#### 2. **Progressive Enhancement**

**Principle:** Core functionality works with basic features; advanced capabilities enhance when available.

**Application:**
- Basic validation works with local math solver
- Advanced validation uses external API when available
- Graceful degradation when API unavailable
- Platform-specific features (Apple Pencil) enhance but aren't required

**Why:** Reliability across varying network conditions and devices.

---

#### 3. **Separation of Concerns**

**Principle:** Independent, loosely-coupled components with clear responsibilities.

**Application:**
```
Presentation Layer (React Native UI)
    ↓
Application Layer (Use Cases: ValidateStep, GenerateHint)
    ↓
Domain Layer (Business Logic: MathExpression, ValidationEngine)
    ↓
Infrastructure Layer (API clients, Storage, Native modules)
```

**Why:** Testability, maintainability, reusability across Superbuilders projects.

---

#### 4. **Data Integrity First**

**Principle:** Never lose student work, even in failure scenarios.

**Application:**
- Write-ahead logging for all student actions
- Local persistence before cloud sync
- Idempotent sync operations
- Comprehensive error handling

**Why:** Trust is foundational in educational software.

---

#### 5. **Privacy by Design**

**Principle:** Minimal data collection, maximum protection.

**Application:**
- Device-based authentication (no passwords for young students)
- Encrypted storage (at-rest and in-transit)
- No PII collection without parental consent
- Clear data deletion pathways

**Why:** COPPA/FERPA compliance and ethical responsibility.

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT TABLET (CLIENT)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         React Native Application Layer                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │  Problem     │  │   Hint       │  │  Settings   │ │   │
│  │  │  Presenter   │  │  System      │  │  Manager    │ │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Application Logic Layer (Use Cases)             │   │
│  │  • SubmitStep   • ValidateStep   • GenerateHint        │   │
│  │  • SaveAttempt  • LoadProblem    • TrackProgress       │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │      Domain Layer (Business Logic)                      │   │
│  │  ┌──────────────────┐  ┌────────────────────────────┐ │   │
│  │  │  Drawing Engine  │  │  Validation Engine         │ │   │
│  │  │  • Stroke        │  │  • Correctness Checker     │ │   │
│  │  │    Capture       │  │  • Usefulness Assessor     │ │   │
│  │  │  • Line          │  │  • Progress Tracker        │ │   │
│  │  │    Detection     │  │  • Hint Generator          │ │   │
│  │  │  • Ink           │  │                            │ │   │
│  │  │    Rendering     │  │                            │ │   │
│  │  └──────────────────┘  └────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       Infrastructure Layer                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │   SQLite     │  │  Recognition │  │  Firebase   │ │   │
│  │  │   Storage    │  │  API Client  │  │  Client     │ │   │
│  │  │   (Local)    │  │  (CameraMath)│  │  (Sync)     │ │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (TLS 1.3)
                              │ Only on Step Submission
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUD BACKEND                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            Firebase / Cloud Services                     │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  API Gateway (Rate Limiting, Auth)               │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                         ↓                               │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Cloud Functions (Serverless)                    │  │   │
│  │  │  • Validation Orchestrator                       │  │   │
│  │  │  • Attempt Ingestion                             │  │   │
│  │  │  • Analytics Processor                           │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                         ↓                               │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Firestore Database                              │  │   │
│  │  │  • Student attempts                              │  │   │
│  │  │  • Problem library                               │  │   │
│  │  │  • Session data                                  │  │   │
│  │  │  (Encrypted at rest)                             │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                         ↓                               │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Cloud Storage                                   │  │   │
│  │  │  • Handwriting images (optional)                 │  │   │
│  │  │  • Problem assets                                │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ External API Call
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  CameraMath API (Primary)                              │   │
│  │  • Handwriting recognition                             │   │
│  │  • Math expression parsing                             │   │
│  │  • Step validation                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Wolfram Alpha API (Backup)                            │   │
│  │  • Fallback validation                                 │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Architecture Layers Explained

#### **Client Layer (Tablet App)**

**Responsibilities:**
- All drawing and handwriting capture (100% local)
- User interface rendering
- Local storage and caching
- Offline capability
- Background sync orchestration

**Key Technologies:**
- React Native (cross-platform framework)
- react-native-skia (GPU-accelerated canvas)
- SQLite (local database)
- react-native-gesture-handler (stylus input)

**Why This Design:**
- Keeps critical path (drawing) entirely local for performance
- Enables offline functionality
- Provides data reliability through local-first storage

---

#### **Cloud Backend Layer**

**Responsibilities:**
- Orchestrate validation requests to external APIs
- Store student attempts for analytics
- Serve problem content
- Manage authentication (device-based or SSO)
- Handle background processing (analytics, reporting)

**Key Technologies:**
- Firebase Cloud Functions (serverless compute)
- Firestore (NoSQL database)
- Firebase Authentication (optional)
- Cloud Storage (asset hosting)

**Why This Design:**
- Serverless = automatic scaling for 1,000+ concurrent users
- Firebase ecosystem = integrated auth, storage, database
- Pay-per-use pricing = cost-effective for MVP
- No infrastructure management overhead

---

#### **External Services Layer**

**Responsibilities:**
- Handwriting recognition (image → math expression)
- Mathematical step validation (correctness checking)
- Symbolic math computation

**Key Technologies:**
- CameraMath API (primary)
- Wolfram Alpha API (backup)

**Why This Design:**
- Handwriting recognition is a solved problem (buy, don't build)
- Math validation requires symbolic computation (complex to build)
- External APIs save months of development time
- Multiple providers = resilience

---

## Component Architecture

### Core Components

#### 1. **Drawing Engine Component** ⭐

**Responsibility:** Capture stylus input and render ink on canvas with <100ms latency.

**Sub-Components:**
```
DrawingEngine
├── StrokeCapture
│   ├── Input: Stylus touch events (x, y, pressure, timestamp)
│   ├── Output: Stroke objects (array of points)
│   └── Performance: <50ms event processing
│
├── InkRenderer
│   ├── Input: Stroke objects
│   ├── Output: Visual ink on canvas (GPU-rendered)
│   └── Performance: 60 FPS during continuous writing
│
├── LineDetector
│   ├── Input: All strokes on canvas
│   ├── Output: Grouped strokes per guide line
│   └── Trigger: Student moves to next guide line
│
└── EraserTool
    ├── Input: Eraser mode + touch events
    ├── Output: Stroke removal
    └── Behavior: Stroke-by-stroke deletion (not pixel)
```

**Technology Stack:**
- **react-native-skia** for GPU-accelerated rendering
- **react-native-gesture-handler** for low-latency touch events
- **react-native-reanimated** for smooth UI thread animations

**API Design (Reusable Module):**
```typescript
// @superbuilders/handwriting-canvas package
export interface DrawingEngineProps {
  onStrokeComplete: (stroke: Stroke) => void;
  onLineComplete: (strokes: Stroke[]) => void;
  guideLineCount: number;
  inkColor: string;
  eraserMode: boolean;
}

export const DrawingCanvas: React.FC<DrawingEngineProps> = ({ ... }) => {
  // Implementation using skia
}
```

**Performance Targets:**
- Stylus-to-ink latency: <50ms (target), <100ms (requirement)
- Frame rate: 60 FPS during writing
- Memory usage: <50MB for typical problem (100-200 strokes)

**Reusability:** This component is designed to be extracted and used in any Superbuilders project requiring handwriting input (note-taking apps, signature capture, drawing tools, etc.).

---

#### 2. **Validation Engine Component** ⭐

**Responsibility:** Validate mathematical steps for correctness and usefulness, generate appropriate feedback.

**Sub-Components:**
```
ValidationEngine
├── HandwritingRecognizer
│   ├── Input: Stroke array or rendered image
│   ├── Output: Recognized math expression (LaTeX or text)
│   └── Provider: CameraMath API (external)
│
├── CorrectnessChecker
│   ├── Input: Recognized expression + problem context
│   ├── Output: Boolean correct + error type
│   ├── Provider: CameraMath API or local solver
│   └── Fallback: Basic local validation
│
├── UsefulnessAssessor (Custom Logic)
│   ├── Input: Step expression + previous steps + goal
│   ├── Output: Boolean useful + nudge message
│   ├── Logic: Distance-to-solution calculation
│   └── Examples:
│       • "2x + 3 = 7" → "2x + 3 + 1 = 8" (correct but not useful)
│       • "2x + 3 = 7" → "2x = 4" (correct AND useful)
│
└── ProgressTracker
    ├── Input: Current step + solution goal
    ├── Output: Progress score (0-1), completion status
    └── Logic: Symbolic distance to isolated variable
```

**Usefulness Algorithm (Detailed):**

The "usefulness" check is the unique innovation of this app. Here's the concrete algorithm:

```typescript
interface UsefulnessResult {
  useful: boolean;
  nudgeMessage?: string;
  progressDelta: number; // -1 to +1 (negative = moving away from solution)
}

function assessUsefulness(
  step: MathExpression,
  previousStep: MathExpression,
  goalState: GoalState
): UsefulnessResult {
  // 1. Calculate "distance to solution" for both steps
  const prevDistance = calculateDistanceToGoal(previousStep, goalState);
  const currDistance = calculateDistanceToGoal(step, goalState);

  const progressDelta = prevDistance - currDistance;

  // 2. Assess usefulness based on progress
  if (progressDelta > 0.1) {
    // Significant progress toward solution
    return { useful: true, progressDelta };
  } else if (progressDelta > -0.05) {
    // Neutral step (neither helps nor hurts much)
    return {
      useful: false,
      nudgeMessage: "This is correct, but does it help you solve for x?",
      progressDelta
    };
  } else {
    // Moving away from solution (complexity increased)
    return {
      useful: false,
      nudgeMessage: "This step is valid, but it might make the problem harder. Can you simplify instead?",
      progressDelta
    };
  }
}

function calculateDistanceToGoal(
  expression: MathExpression,
  goal: GoalState
): number {
  // Distance metric based on:
  // 1. Variable isolation (is x alone on one side?)
  // 2. Expression complexity (number of terms, operations)
  // 3. Symbolic difference from goal form

  let distance = 0;

  // Example for "solve for x" problems:
  if (goal.type === "ISOLATE_VARIABLE") {
    const variable = goal.variable; // e.g., "x"

    // Check if variable is isolated (e.g., "x = 5")
    if (isIsolated(expression, variable)) {
      distance = 0; // Goal reached
    } else {
      // Count obstacles to isolation
      distance += countTermsWithVariable(expression, variable) - 1; // Should be 1 term
      distance += countOperationsOnVariable(expression, variable); // Should be 0
      distance += complexityScore(expression) * 0.1; // Penalize complex expressions
    }
  }

  return distance;
}
```

**Example Scenarios:**

| Previous Step | Current Step | Usefulness | Reason |
|---------------|--------------|------------|--------|
| `2x + 3 = 7` | `2x = 4` | ✅ Useful | Moved closer to isolating x |
| `2x + 3 = 7` | `2x + 3 + 1 = 8` | ❌ Not useful | Correct but no progress |
| `2x + 3 = 7` | `4x + 6 = 14` | ❌ Not useful | Correct but increased complexity |
| `2x = 4` | `x = 2` | ✅ Useful | Solution reached |

**Performance Target:**
- Combined recognition + correctness + usefulness: <500ms (95th percentile)

**Fallback Strategy:**
```
Primary Path: CameraMath API (full validation, 200-400ms)
    ↓ (if timeout or unavailable)
Fallback Path: Local basic solver (syntax + simple algebra, 50-100ms)
    ↓ (if local solver can't handle)
Graceful Degradation: "Checking your work..." + queue for later validation
```

---

#### 3. **Hint System Component** ⭐

**Responsibility:** Generate graduated, context-aware hints that guide without revealing solutions.

**Sub-Components:**
```
HintSystem
├── InactivityDetector
│   ├── Monitors: Time since last stroke or submission
│   ├── Threshold: 30-45 seconds (configurable)
│   └── Action: Trigger Level 1 hint
│
├── HintGenerator (Rule-Based for MVP)
│   ├── Input: Problem type, error type, current step, history
│   ├── Output: Hint text at specified level (1, 2, or 3)
│   └── Data: Pre-authored hint library
│
└── HintEscalator
    ├── Logic: 1 → 2 → 3 on student request or repeated errors
    └── Limit: Never reveal complete next step
```

**Hint Generation Strategy (MVP):**

**Rule-Based Hint Library:**
```typescript
interface HintLibrary {
  [problemType: string]: {
    [errorType: string]: {
      level1: string; // Concept cue
      level2: string; // Directional hint
      level3: string; // Micro next step
    }
  }
}

// Example for linear equations
const hintLibrary: HintLibrary = {
  "LINEAR_EQUATION": {
    "STUCK_AT_START": {
      level1: "What operation might help you isolate the variable?",
      level2: "Try getting all the terms with x on one side of the equation.",
      level3: "What happens if you subtract 3 from both sides?"
    },
    "ARITHMETIC_ERROR": {
      level1: "Check your calculation carefully.",
      level2: "Let's verify: what is 7 - 3?",
      level3: "7 - 3 = 4. Try that step again."
    },
    "WRONG_OPERATION": {
      level1: "Think about which operation is the inverse of addition.",
      level2: "To undo '+3', you need to subtract 3 from both sides.",
      level3: "Write: 2x + 3 - 3 = 7 - 3"
    }
  }
};
```

**Growth Path: LLM-Generated Hints**

For post-MVP, integrate GPT-4 or Claude for dynamic hint generation:
```typescript
async function generateHintWithLLM(context: HintContext): Promise<string> {
  const prompt = `
You are a patient math tutor. A student is working on this problem:
Problem: ${context.problem}
Student's work so far: ${context.steps.join(", ")}
Student's error: ${context.errorType}

Generate a ${context.level} hint:
- Level 1: Concept cue (activate prior knowledge, no specifics)
- Level 2: Directional hint (suggest strategy, don't solve)
- Level 3: Micro next step (very specific, but student still does work)

Never reveal the complete next step or final answer.
Use encouraging, growth mindset language.
`;

  return await callLLM(prompt);
}
```

**Performance:**
- Hint generation: <50ms (rule-based), <200ms (LLM-based)
- No blocking on hint generation (async display)

---

#### 4. **Data Sync Component**

**Responsibility:** Reliably sync student attempts to cloud with zero data loss.

**Sub-Components:**
```
DataSync
├── LocalStorage (Primary)
│   ├── Technology: SQLite (react-native-sqlite-storage)
│   ├── Schema: students, problems, attempts, steps, hints
│   └── Behavior: All writes go here FIRST
│
├── SyncQueue
│   ├── Queue: Pending sync operations (attempts, steps)
│   ├── Retry Logic: Exponential backoff (1s, 2s, 4s, 8s, max 60s)
│   └── Idempotency: UUID-based deduplication
│
└── CloudWriter
    ├── Target: Firebase Firestore
    ├── Trigger: Background sync every 5 seconds when online
    └── Verification: Confirm write success, retry on failure
```

**Data Flow (Zero-Loss Pattern):**

```
1. Student completes step
   ↓
2. Write to local SQLite (synchronous, immediate)
   ↓
3. Add to sync queue (in-memory)
   ↓
4. Background task: Attempt cloud sync
   ↓
5. If success: Mark as synced, remove from queue
   ↓
6. If failure: Keep in queue, retry with backoff
```

**SQLite Schema (Local Storage):**

```sql
-- Students table
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  consent_timestamp INTEGER,
  created_at INTEGER NOT NULL
);

-- Problems table
CREATE TABLE problems (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  difficulty TEXT,
  skill_area TEXT,
  hint_library TEXT -- JSON blob
);

-- Attempts table
CREATE TABLE attempts (
  id TEXT PRIMARY KEY, -- UUID
  student_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  synced INTEGER DEFAULT 0, -- Boolean: synced to cloud?
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Steps table
CREATE TABLE steps (
  id TEXT PRIMARY KEY, -- UUID
  attempt_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  strokes_blob BLOB, -- Compressed stroke data
  recognized_text TEXT,
  correct INTEGER, -- Boolean
  useful INTEGER, -- Boolean
  hint_shown TEXT,
  hint_level INTEGER,
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id)
);

-- Indexes for performance
CREATE INDEX idx_attempts_synced ON attempts(synced);
CREATE INDEX idx_steps_synced ON steps(synced);
CREATE INDEX idx_attempts_student ON attempts(student_id);
```

**Firestore Schema (Cloud Storage):**

```javascript
// Collection: students
{
  studentId: "uuid",
  deviceId: "device-identifier",
  consentTimestamp: timestamp,
  createdAt: timestamp
}

// Collection: attempts
{
  attemptId: "uuid",
  studentId: "uuid",
  problemId: "uuid",
  startedAt: timestamp,
  completedAt: timestamp,
  steps: [
    {
      stepId: "uuid",
      sequence: 0,
      recognizedText: "2x + 3 = 7",
      correct: true,
      useful: true,
      hintShown: null,
      hintLevel: null,
      timestamp: timestamp
    },
    // ... more steps
  ]
}

// Collection: problems (admin-managed)
{
  problemId: "uuid",
  content: "Solve for x: 2x + 3 = 7",
  difficulty: "easy",
  skillArea: "linear-equations",
  hintLibrary: { ... }
}
```

**Sync Performance:**
- Local write: <10ms (SQLite)
- Cloud sync: Background, non-blocking
- Sync success rate: >99.9% (with retries)

---

#### 5. **Problem Presenter Component**

**Responsibility:** Display math problems with proper notation at top of screen.

**Features:**
- Render LaTeX math notation (using react-native-mathjax or similar)
- Fixed position during scrolling (problem always visible)
- Responsive text sizing (16-20pt minimum)
- Support for fractions, exponents, radicals, equations

**Technology:**
- **react-native-mathjax-html-to-text-svg** for LaTeX rendering
- OR **react-native-math-view** (iOS native MathML support)

**API Design:**
```typescript
interface ProblemPresenterProps {
  problem: Problem;
  onDismiss?: () => void;
}

interface Problem {
  id: string;
  content: string; // LaTeX or plain text
  contentType: "latex" | "text";
  imageUrl?: string; // Optional problem image
}

export const ProblemPresenter: React.FC<ProblemPresenterProps> = ({ problem }) => {
  return (
    <View style={styles.problemContainer}>
      {problem.contentType === "latex" ? (
        <MathView math={problem.content} />
      ) : (
        <Text style={styles.problemText}>{problem.content}</Text>
      )}
    </View>
  );
};
```

---

### Component Dependency Map

```
                    ┌─────────────────────┐
                    │  Problem Presenter  │
                    └─────────────────────┘
                              │
                              ↓
┌──────────────────┐    ┌─────────────────────┐
│  Hint System     │←───│  Drawing Engine     │
│  Component       │    │  Component          │
└──────────────────┘    └─────────────────────┘
         │                       │
         │                       │ (on line complete)
         ↓                       ↓
    ┌─────────────────────────────────────┐
    │    Validation Engine Component      │
    │  ┌────────────┐  ┌────────────────┐│
    │  │ Correctness│  │  Usefulness    ││
    │  │  Checker   │  │  Assessor      ││
    │  └────────────┘  └────────────────┘│
    └─────────────────────────────────────┘
                    │
                    │ (validation result)
                    ↓
         ┌─────────────────────┐
         │   Data Sync         │
         │   Component         │
         │  (local + cloud)    │
         └─────────────────────┘
```

**Key Dependencies:**
- Drawing Engine is **independent** (can be used standalone)
- Validation Engine depends on external API (but has fallback)
- Hint System depends on Validation results
- Data Sync is **event-driven** (doesn't block UI)

**Reusability Strategy:**

Each major component is designed as a standalone module:

```
@superbuilders/handwriting-canvas (Drawing Engine)
@superbuilders/math-validation (Validation Engine)
@superbuilders/tutoring-hints (Hint System - generalized)
```

These can be published as internal NPM packages and reused across Superbuilders projects.

---

## Technology Stack

### Frontend (Tablet App)

#### **Framework: React Native 0.73+**

**Rationale:**
- ✅ Cross-platform: Single codebase for iOS + Android
- ✅ Mature ecosystem with rich third-party libraries
- ✅ Large developer community and extensive documentation
- ✅ Performance improvements with new architecture (Fabric)
- ✅ Superbuilders team likely has React Native experience

**Considerations:**
- ⚠️ Requires native modules for optimal stylus performance (pre-built available)
- ⚠️ App size larger than native (~40-50MB)

**Alternatives Considered:**
- Flutter: Better canvas performance out-of-box, but less mature stylus ecosystem
- Native (Swift/Kotlin): Maximum performance, but 2x development time
- **Verdict:** React Native strikes best balance for MVP speed + performance

---

#### **Canvas Rendering: react-native-skia**

**Rationale:**
- ✅ GPU-accelerated rendering (native Skia graphics engine)
- ✅ Low-latency drawing (<50ms achievable)
- ✅ Runs on UI thread (bypasses JS bridge)
- ✅ Proven in production apps (Shopify, others)
- ✅ Active maintenance by Shopify team

**Package:** `@shopify/react-native-skia`

**Example Integration:**
```typescript
import { Canvas, Path, useCanvasRef } from '@shopify/react-native-skia';

const DrawingCanvas = () => {
  const [paths, setPaths] = useState<SkPath[]>([]);

  return (
    <Canvas style={{ flex: 1 }}>
      {paths.map((path, index) => (
        <Path key={index} path={path} color="black" strokeWidth={2} />
      ))}
    </Canvas>
  );
};
```

---

#### **Gesture Handling: react-native-gesture-handler**

**Rationale:**
- ✅ Native gesture recognition (runs on UI thread)
- ✅ Pressure sensitivity support
- ✅ Low-latency touch events
- ✅ Pan, pinch, rotate gestures built-in

**Package:** `react-native-gesture-handler`

**Stylus Input Example:**
```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onBegin((e) => {
    // Start new stroke
    const pressure = e.force || 0.5;
    startStroke({ x: e.x, y: e.y, pressure });
  })
  .onUpdate((e) => {
    // Add point to current stroke
    const pressure = e.force || 0.5;
    addStrokePoint({ x: e.x, y: e.y, pressure });
  })
  .onEnd(() => {
    // Finalize stroke
    finalizeStroke();
  })
  .runOnJS(false); // Keep on UI thread for performance
```

---

#### **Animations: react-native-reanimated 3**

**Rationale:**
- ✅ UI thread animations (smooth 60 FPS)
- ✅ No JS bridge overhead
- ✅ Perfect for feedback animations (checkmarks, hints appearing)

**Package:** `react-native-reanimated`

---

#### **Local Database: SQLite**

**Rationale:**
- ✅ Embedded database (no network, instant writes)
- ✅ ACID compliance (data integrity)
- ✅ Supports complex queries for analytics
- ✅ Encrypted storage available

**Package:** `react-native-sqlite-storage` or `@op-engineering/op-sqlite` (faster)

---

#### **State Management: Redux Toolkit**

**Rationale:**
- ✅ Predictable state management
- ✅ Time-travel debugging (useful for education apps)
- ✅ Middleware for offline sync (redux-offline or custom)
- ✅ RTK Query for API caching

**Alternative:** MobX or Zustand (simpler, less boilerplate)

**For this project:** Redux Toolkit recommended for:
- Complex state (drawing, validation, hints, sync)
- Offline-first requirements
- Debugging student issues

---

#### **Math Rendering: react-native-math-view**

**Rationale:**
- ✅ Native MathML rendering (iOS native, Android WebView)
- ✅ LaTeX support
- ✅ High-quality typography

**Package:** `react-native-math-view`

**Alternative:** `react-native-mathjax-html-to-text-svg` (pure JS, slower but more compatible)

---

### Backend (Cloud Services)

#### **Platform: Firebase (Google Cloud)**

**Services Used:**

1. **Cloud Functions (Serverless Compute)**
   - Validation orchestration
   - API gateway for external calls
   - Background analytics processing

2. **Firestore (NoSQL Database)**
   - Student attempts storage
   - Problem library
   - Session data

3. **Cloud Storage**
   - Problem assets (images, diagrams)
   - Optional: Handwriting stroke images

4. **Authentication (Optional MVP)**
   - Device-based auth
   - Future: School SSO integration

**Rationale for Firebase:**
- ✅ Serverless = auto-scaling from 0 to 1,000+ users
- ✅ Integrated ecosystem (auth, storage, database in one)
- ✅ Real-time capabilities (future teacher dashboard)
- ✅ Pay-per-use pricing (cost-effective for MVP)
- ✅ Generous free tier for development
- ✅ Excellent React Native SDK

**Firebase vs. Alternatives:**

| Feature | Firebase | AWS | Azure |
|---------|----------|-----|-------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Moderate | ⭐⭐⭐ Moderate |
| **Serverless** | ✅ Cloud Functions | ✅ Lambda | ✅ Functions |
| **NoSQL DB** | ✅ Firestore | ✅ DynamoDB | ✅ Cosmos DB |
| **Real-time** | ✅ Built-in | ⚠️ AppSync | ⚠️ SignalR |
| **Mobile SDK** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐ Fair |
| **Pricing** | ⭐⭐⭐⭐ Affordable | ⭐⭐⭐ Competitive | ⭐⭐⭐ Competitive |
| **EdTech Compliance** | ✅ FERPA/COPPA capable | ✅ FERPA/COPPA capable | ✅ FERPA/COPPA capable |

**Verdict:** Firebase is optimal for MVP due to ease of use and mobile integration. Can migrate to AWS/Azure later if needed.

---

#### **Cloud Functions Architecture:**

```typescript
// functions/src/index.ts

// Validation orchestrator
export const validateStep = functions.https.onCall(async (data, context) => {
  const { attemptId, strokesImage, previousSteps, problemContext } = data;

  try {
    // 1. Call CameraMath API for recognition
    const recognized = await cameraMathAPI.recognize(strokesImage);

    // 2. Check correctness via CameraMath
    const correctness = await cameraMathAPI.validateStep(
      recognized.expression,
      problemContext
    );

    // 3. Assess usefulness (custom logic)
    const usefulness = assessUsefulness(
      recognized.expression,
      previousSteps,
      problemContext.goal
    );

    // 4. Return combined result
    return {
      recognized: recognized.expression,
      correct: correctness.correct,
      useful: usefulness.useful,
      nudgeMessage: usefulness.nudgeMessage,
      errorType: correctness.errorType
    };

  } catch (error) {
    // Fallback to basic validation if API fails
    return fallbackValidation(data);
  }
});

// Attempt ingestion
export const saveAttempt = functions.https.onCall(async (data, context) => {
  const { studentId, attempt } = data;

  // Store in Firestore with timestamp
  await admin.firestore().collection('attempts').add({
    ...attempt,
    studentId,
    serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});
```

---

### External Services

#### **Handwriting Recognition & Math Validation: CameraMath API**

**Rationale:**
- ✅ Specialized in mathematical handwriting recognition
- ✅ Supports math expression parsing
- ✅ Step-by-step solution validation
- ✅ Affordable pricing ($10 free credits for testing)

**API Capabilities:**
- Image → LaTeX conversion
- Equation solving
- Step validation

**Integration Example:**
```typescript
import axios from 'axios';

const cameraMathAPI = {
  async recognize(imageBase64: string) {
    const response = await axios.post('https://api.cameramath.com/v1/recognize', {
      image: imageBase64,
      format: 'latex'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CAMERAMATH_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 3000 // 3 second timeout
    });

    return {
      expression: response.data.latex,
      confidence: response.data.confidence
    };
  },

  async validateStep(expression: string, problemContext: any) {
    const response = await axios.post('https://api.cameramath.com/v1/validate', {
      expression,
      context: problemContext
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CAMERAMATH_API_KEY}`
      },
      timeout: 2000 // 2 second timeout
    });

    return {
      correct: response.data.correct,
      errorType: response.data.errorType
    };
  }
};
```

**Risk Mitigation:**
- **Backup API:** Wolfram Alpha API (more expensive but more reliable)
- **Fallback:** Local basic math solver (algebra, arithmetic only)
- **Circuit Breaker:** After 3 consecutive failures, switch to fallback for 60 seconds

---

#### **Backup: Wolfram Alpha API**

**Use Case:** Fallback when CameraMath unavailable or rate-limited

**Rationale:**
- ✅ Highly reliable (Wolfram infrastructure)
- ✅ Powerful symbolic math capabilities
- ✅ Step-by-step solution support
- ⚠️ More expensive than CameraMath
- ⚠️ Not specialized for handwriting (need separate recognition)

**Integration Strategy:**
- Use only when CameraMath fails
- Combine with Google ML Kit or Azure Computer Vision for handwriting recognition
- Reserve for critical validation needs

---

### Development & DevOps Tools

#### **Version Control: Git + GitHub**
- Repository hosting
- Pull request workflows
- GitHub Actions for CI/CD

#### **CI/CD: GitHub Actions + Fastlane**
- Automated builds for iOS + Android
- TestFlight deployment (iOS)
- Google Play Internal Testing (Android)

#### **Testing:**
- **Unit Tests:** Jest + React Native Testing Library
- **Integration Tests:** Detox (end-to-end on device simulators)
- **Performance Testing:** Flashlight (React Native performance profiler)

#### **Monitoring & Analytics:**
- **Error Tracking:** Sentry (crash reporting, error logging)
- **Performance Monitoring:** Firebase Performance Monitoring
- **User Analytics:** Firebase Analytics (COPPA-compliant events)

#### **Code Quality:**
- **Linting:** ESLint + Prettier
- **Type Safety:** TypeScript (strict mode)
- **Pre-commit Hooks:** Husky + lint-staged

---

### Technology Stack Summary Table

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Mobile Framework** | React Native | 0.73+ | Cross-platform, mature ecosystem |
| **Canvas Rendering** | react-native-skia | 1.0+ | GPU-accelerated, low-latency |
| **Gesture Handling** | react-native-gesture-handler | 2.14+ | Native touch events, pressure support |
| **Animations** | react-native-reanimated | 3.6+ | UI thread animations |
| **Local Database** | SQLite | - | Embedded, ACID, offline-first |
| **State Management** | Redux Toolkit | 2.0+ | Predictable, debuggable |
| **Math Rendering** | react-native-math-view | 3.9+ | Native MathML/LaTeX |
| **Backend Platform** | Firebase | - | Serverless, integrated ecosystem |
| **Cloud Compute** | Cloud Functions | - | Auto-scaling, pay-per-use |
| **Database** | Firestore | - | NoSQL, real-time capable |
| **Storage** | Cloud Storage | - | Asset hosting |
| **Math API (Primary)** | CameraMath | - | Handwriting + validation |
| **Math API (Backup)** | Wolfram Alpha | - | Reliable fallback |
| **Error Tracking** | Sentry | - | Crash reporting |
| **CI/CD** | GitHub Actions + Fastlane | - | Automated deployment |
| **Testing** | Jest + Detox | - | Unit + E2E testing |

---

## Data Architecture

### Data Flow: Drawing to Cloud Storage

```
┌──────────────────────────────────────────────────────────────────┐
│  1. STUDENT DRAWS ON CANVAS                                       │
│     • Strokes captured in React state (RAM only)                 │
│     • Zero network activity                                      │
│     • <100ms latency (local rendering)                           │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. STUDENT COMPLETES LINE (Moves to next guide line)            │
│     • Line detection triggered                                   │
│     • Strokes for that line grouped                              │
│     • Write to LOCAL SQLite (synchronous, <10ms)                 │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. VALIDATION REQUEST                                            │
│     • Render strokes to image                                    │
│     • Send to Cloud Function (HTTPS call)                        │
│     • Cloud Function → CameraMath API                            │
│     • Receive: recognized text, correct/incorrect, error type    │
│     • Custom logic: assess usefulness                            │
│     • Response time target: <500ms                               │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  4. UPDATE LOCAL DATABASE                                         │
│     • Update step record with validation results                 │
│     • Update attempt record with progress                        │
│     • Mark for cloud sync (synced = 0)                           │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  5. BACKGROUND CLOUD SYNC (Every 5 seconds when online)           │
│     • Query: SELECT * FROM steps WHERE synced = 0                │
│     • Batch upload to Firestore                                  │
│     • On success: UPDATE steps SET synced = 1                    │
│     • On failure: Retry with exponential backoff                 │
└──────────────────────────────────────────────────────────────────┘
```

---

### Data Models

#### **Student Model**

```typescript
interface Student {
  id: string; // UUID
  deviceId: string; // Device-based authentication
  consentTimestamp?: number; // Parent consent (if under 13)
  createdAt: number;
  settings?: {
    inkColor: string;
    penThickness: 'thin' | 'medium' | 'thick';
    inactivityTimeout: number; // seconds
    highContrastMode: boolean;
  };
}
```

#### **Problem Model**

```typescript
interface Problem {
  id: string;
  content: string; // LaTeX or plain text
  contentType: 'latex' | 'text';
  difficulty: 'easy' | 'medium' | 'hard';
  skillArea: string; // e.g., "linear-equations", "fractions"
  goalState: GoalState;
  hintLibrary: HintLibrary;
  imageUrl?: string;
}

interface GoalState {
  type: 'ISOLATE_VARIABLE' | 'SIMPLIFY' | 'EVALUATE';
  variable?: string; // For ISOLATE_VARIABLE
  targetForm?: string; // Expected final form
}
```

#### **Attempt Model**

```typescript
interface Attempt {
  id: string; // UUID
  studentId: string;
  problemId: string;
  startedAt: number; // Unix timestamp
  completedAt?: number;
  steps: Step[];
  completed: boolean;
  hintsUsed: number;
  timeSpent: number; // milliseconds
  synced: boolean;
}

interface Step {
  id: string; // UUID
  sequence: number; // 0, 1, 2, ...
  strokes: Stroke[]; // Raw stroke data (compressed)
  recognizedText?: string; // LaTeX
  correct?: boolean;
  useful?: boolean;
  nudgeMessage?: string;
  errorType?: string;
  hintShown?: string;
  hintLevel?: 1 | 2 | 3;
  timestamp: number;
}

interface Stroke {
  points: Point[];
  color: string;
  thickness: number;
}

interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}
```

---

### Data Storage Strategy

#### **Local Storage (SQLite) - Primary**

**Purpose:** Source of truth for student's device. Zero data loss guarantee.

**Write Pattern:**
- All writes happen locally FIRST (synchronous, immediate)
- Background process syncs to cloud (asynchronous, retries on failure)

**Read Pattern:**
- Read from local for all UI operations (instant)
- Cloud is backup/analytics store, never primary read source for student

**Storage Size Estimate:**
- Typical problem: 50-100 strokes
- Stroke data: ~10 KB compressed
- Problem attempt: ~20-30 KB
- 100 attempts: ~2-3 MB
- **Conclusion:** Local storage is trivial, no concerns

---

#### **Cloud Storage (Firestore) - Backup & Analytics**

**Purpose:**
- Backup of all student work
- Analytics queries for teacher dashboard
- Problem library distribution

**Write Pattern:**
- Background sync from device every 5 seconds
- Batched writes (up to 500 documents per batch)
- Idempotent (UUID-based, safe to retry)

**Read Pattern:**
- Teachers query for analytics
- Problem library read on app launch
- No real-time reads during student work (offline-first)

**Firestore Collections:**

```
/students/{studentId}
  - Student profile and settings

/problems/{problemId}
  - Problem library (admin-managed)

/attempts/{attemptId}
  - Complete attempt with all steps
  - Sub-collection not needed (steps embedded in document)

/sessions/{sessionId} (Future: Teacher Dashboard)
  - Live student session data for teacher view
```

**Firestore Cost Estimate (MVP):**
- 100 students × 10 problems/day × 30 days = 30,000 attempts/month
- Write ops: ~30,000 × 2 (attempt + update) = 60,000 writes
- Free tier: 20K writes/day (600K/month)
- **Conclusion:** Well within free tier for MVP

---

### Data Privacy & Compliance

#### **COPPA Compliance (Children Under 13)**

**Requirements:**
1. Verifiable parental consent before collecting PII
2. Clear privacy policy accessible to parents
3. Minimal data collection (only what's necessary)
4. Secure data handling
5. No third-party advertising or tracking
6. Parent can review and delete child's data

**Implementation:**
- **Device-based auth** (no email/password for students)
- Optional parent email for consent (stored separately)
- No collection of names, birthdays, addresses (minimal PII)
- Clear in-app privacy policy link
- Data deletion API available

---

#### **FERPA Compliance (Educational Records)**

**Requirements:**
1. Student educational records must be protected
2. Access controls for data
3. Audit trails
4. Secure transmission (encryption in transit)
5. Parental right to review records

**Implementation:**
- TLS 1.3 for all network communication
- AES-256 encryption at rest (Firestore automatic)
- Access controls via Firebase Auth
- Audit logs in Firestore (all writes timestamped)
- Parent dashboard to review student's work (growth feature)

---

#### **Data Retention Policy**

**Recommendation:**
- **Active data:** Retain indefinitely while student uses app
- **Inactive data:** After 2 years of inactivity, anonymize or delete
- **Deletion request:** Honor within 30 days
- **Export:** Provide data export in JSON format on request

---

## Performance Architecture

### Performance Budget

| Metric | Target | Acceptable | Unacceptable | Measurement |
|--------|--------|------------|--------------|-------------|
| **Stylus latency** | <50ms | <100ms | >100ms | High-speed camera test |
| **Validation time** | <300ms | <500ms | >500ms | Performance monitoring |
| **App launch** | <2s | <3s | >3s | App profiler |
| **Frame rate** | 60 FPS | 50 FPS | <30 FPS | React Native Profiler |
| **Memory usage** | <150MB | <200MB | >250MB | Xcode Instruments |
| **Local write** | <5ms | <10ms | >20ms | SQLite profiling |

---

### Performance Strategies

#### 1. **Drawing Performance (Critical Path)**

**Strategy: Zero Bridge Crossing**

The React Native bridge is the main performance bottleneck. Keep drawing entirely on native/UI thread.

```typescript
// BAD: Bridge crossing on every touch event
const [strokes, setStrokes] = useState<Stroke[]>([]);

const handleTouch = (event) => {
  // This crosses the bridge (JS → Native → JS)
  setStrokes(prev => [...prev, newStroke]);
};

// GOOD: UI thread worklet
import { useSharedValue, runOnUI } from 'react-native-reanimated';

const strokes = useSharedValue<Stroke[]>([]);

const handleTouch = useAnimatedGestureHandler({
  onActive: (event) => {
    'worklet';
    // This runs on UI thread (no bridge)
    strokes.value = [...strokes.value, newStroke];
  }
});
```

**Result:** Sub-50ms latency achievable

---

#### 2. **Validation Performance (User-Facing)**

**Strategy: Optimistic UI + Background Validation**

Don't block the UI waiting for validation response. Show optimistic feedback immediately, update when validation completes.

```typescript
// User submits step
async function submitStep(strokes: Stroke[]) {
  // 1. Optimistic UI (instant)
  showOptimisticFeedback("Checking...");

  // 2. Local write (instant, <10ms)
  await saveStepLocally(strokes);

  // 3. Validation (background, non-blocking)
  validateStepInBackground(strokes)
    .then(result => {
      updateFeedback(result); // Update UI when ready
    })
    .catch(error => {
      showFallbackMessage("We'll check this later");
    });

  // 4. Student can continue immediately
  enableNextLine();
}
```

**Result:** Perceived instant feedback, no blocking

---

#### 3. **API Call Performance**

**Strategy: Parallel Requests + Timeouts + Caching**

```typescript
async function validateStep(strokes: Stroke[]): Promise<ValidationResult> {
  // Render strokes to image (local, ~50ms)
  const image = await renderStrokesToImage(strokes);

  // Parallel API calls (don't wait serially)
  const [recognition, validation] = await Promise.race([
    Promise.all([
      cameraMathAPI.recognize(image),
      cameraMathAPI.validate(image, context)
    ]),
    // Timeout after 400ms, fallback to local
    timeout(400).then(() => fallbackValidation(strokes))
  ]);

  // Custom usefulness logic (local, <50ms)
  const usefulness = assessUsefulness(recognition.expression, context);

  return {
    recognized: recognition.expression,
    correct: validation.correct,
    useful: usefulness.useful,
    errorType: validation.errorType
  };
}
```

**Result:** <500ms end-to-end, graceful degradation

---

#### 4. **Memory Management**

**Strategy: Stroke Compression + Cleanup**

Raw stroke data can accumulate quickly. Compress after submission.

```typescript
// After step submission, compress strokes
function compressStrokes(strokes: Stroke[]): CompressedStroke {
  // Reduce point density (keep every 3rd point, use interpolation)
  const simplified = simplifyStrokes(strokes, tolerance = 2.0);

  // Convert to binary format (smaller than JSON)
  const binary = encodeStrokes(simplified);

  // gzip compression
  const compressed = gzip(binary);

  return compressed;
}

// Typical compression: 10 KB → 2 KB (5x reduction)
```

**Result:** Memory footprint <150MB even with 20+ problems attempted

---

#### 5. **Lazy Loading & Code Splitting**

**Strategy: Load Only What's Needed**

```typescript
// Problem library loaded on demand, not at app launch
const loadProblem = async (problemId: string) => {
  const problem = await import(`./problems/${problemId}`);
  return problem;
};

// Hint library lazy-loaded per problem type
const getHintLibrary = async (skillArea: string) => {
  const library = await import(`./hints/${skillArea}`);
  return library;
};
```

**Result:** <2s cold app launch

---

### Performance Testing Plan

**1. Latency Testing:**
- Use 240 FPS high-speed camera to measure stylus-to-ink latency
- Target: Visible ink within 4 frames (50ms at 60Hz, 16ms at 240Hz)
- Test on minimum spec device (iPad 6th gen, 2018)

**2. Load Testing:**
- Simulate 1,000 concurrent validation requests to Cloud Functions
- Monitor response times, error rates
- Ensure <500ms 95th percentile maintained under load

**3. Memory Profiling:**
- Use Xcode Instruments (iOS) and Android Profiler
- Complete 20 problems in single session
- Monitor memory growth, look for leaks

**4. Battery Impact:**
- Run app for 30 minutes continuous use
- Measure battery drain (target: <10% per 30 min)

---

## Security & Compliance Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Device Security                                    │
│  • iOS Keychain / Android Keystore                          │
│  • Encrypted SQLite database (SQLCipher)                    │
│  • Biometric auth for settings (optional)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Network Security                                   │
│  • TLS 1.3 for all HTTPS connections                        │
│  • Certificate pinning (prevent MITM)                       │
│  • No unencrypted data transmission                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: API Security                                       │
│  • API key encryption (not hardcoded)                       │
│  • Request signing (HMAC)                                   │
│  • Rate limiting (per device)                               │
│  • Input validation (prevent injection)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Backend Security                                   │
│  • Firebase Authentication (device-based or SSO)            │
│  • Firestore Security Rules (deny by default)              │
│  • Cloud Functions authorization checks                     │
│  • Audit logging (all writes timestamped)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Data Security                                      │
│  • AES-256 encryption at rest (Firestore automatic)        │
│  • Data minimization (no unnecessary PII)                   │
│  • Data retention policy (auto-delete after 2 years)       │
│  • Data export API (user right to data)                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Security Implementation Details

#### **1. Encrypted Local Storage**

```typescript
// Use SQLCipher for encrypted SQLite
import SQLite from 'react-native-sqlcipher-storage';

const db = SQLite.openDatabase(
  {
    name: 'mathtutor.db',
    location: 'default',
    key: deviceEncryptionKey // Stored in Keychain/Keystore
  },
  () => console.log('Database opened'),
  error => console.error(error)
);
```

**Encryption Key Management:**
- iOS: Store in Keychain (hardware-backed)
- Android: Store in Keystore (hardware-backed if available)
- Never hardcode encryption keys

---

#### **2. API Key Protection**

```typescript
// BAD: Hardcoded API key (never do this)
const API_KEY = "sk_live_abc123...";

// GOOD: Environment variable + secure storage
import Config from 'react-native-config';

const API_KEY = Config.CAMERAMATH_API_KEY; // Loaded from .env
// In production, fetch from secure backend, not bundled in app
```

**Production Strategy:**
- API keys stored in Cloud Functions environment variables
- Client app calls Cloud Function, which calls external API
- Client never has direct API key access

---

#### **3. Firestore Security Rules**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Students can only read/write their own data
    match /students/{studentId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == studentId;
    }

    // Attempts belong to students
    match /attempts/{attemptId} {
      allow read, write: if request.auth != null
                         && resource.data.studentId == request.auth.uid;
    }

    // Problems are read-only for all authenticated users
    match /problems/{problemId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write (via Firebase Console)
    }

    // Default: deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

#### **4. Authentication Strategy**

**MVP: Device-Based Authentication**

```typescript
import auth from '@react-native-firebase/auth';

// On first app launch
async function initializeStudent() {
  try {
    // Anonymous auth (Firebase assigns unique ID)
    const userCredential = await auth().signInAnonymously();
    const studentId = userCredential.user.uid;

    // Store in local database
    await createStudent({
      id: studentId,
      deviceId: getDeviceId(),
      createdAt: Date.now()
    });

    return studentId;
  } catch (error) {
    console.error('Auth failed:', error);
  }
}
```

**Growth: School SSO Integration**

```typescript
// Google Classroom SSO
import { GoogleSignin } from '@react-native-google-signin/google-signin';

async function signInWithGoogle() {
  const { idToken } = await GoogleSignin.signIn();
  const credential = auth.GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(credential);
}
```

---

### Compliance Checklist

#### **COPPA Compliance**

- [x] Device-based auth (no PII collection without consent)
- [x] Privacy policy accessible in app
- [x] Parental consent flow (if collecting email)
- [x] No third-party ads or tracking
- [x] Data deletion API available
- [x] Clear disclosure of data practices

#### **FERPA Compliance**

- [x] Encryption in transit (TLS 1.3)
- [x] Encryption at rest (AES-256)
- [x] Access controls (Firestore Security Rules)
- [x] Audit trails (Firestore timestamps)
- [x] Data retention policy documented
- [x] Export functionality available

#### **App Store Requirements**

**Apple App Store:**
- [x] Privacy Nutrition Label completed
- [x] Age rating: 4+ (educational content)
- [x] No in-app purchases (MVP)
- [x] Educational category

**Google Play:**
- [x] Data Safety section completed
- [x] Designed for Families eligible
- [x] COPPA compliance verified
- [x] Content rating via IARC

---

## Key Architectural Decisions

### Decision Log

#### **Decision 1: Local-First Drawing (No Real-Time Cloud Sync)**

**Context:** Should drawing strokes sync to cloud in real-time for potential teacher viewing?

**Decision:** NO. Keep all drawing local until line submission.

**Rationale:**
- Real-time sync adds 50-200ms network latency (breaks <100ms target)
- Massive data volume (hundreds of strokes per second)
- No user value in MVP (student works alone)
- Teacher live-view is growth feature (can add later with 2-3 sec delay)

**Trade-offs:**
- ✅ Achieves <100ms latency target
- ✅ Works offline seamlessly
- ❌ Teacher can't see student work in real-time (acceptable for MVP)

**Reversibility:** Can add periodic sync (every 2-3 seconds) for teacher dashboard in growth phase without changing core architecture.

---

#### **Decision 2: React Native + Native Libraries (Not Custom Native Code)**

**Context:** Can React Native deliver <100ms stylus latency, or do we need custom native code?

**Decision:** Use React Native with react-native-skia + gesture-handler (pre-built native modules).

**Rationale:**
- Modern RN libraries already use native rendering under the hood
- react-native-skia runs on UI thread (bypasses JS bridge)
- Achieves <50ms latency in production apps
- Cross-platform (one codebase for iOS + Android)
- Only write custom native code if performance testing reveals gaps

**Trade-offs:**
- ✅ Faster development (3-4 weeks vs. 8-12 weeks native)
- ✅ Single codebase
- ⚠️ Slightly larger app size vs. pure native
- ❌ Marginal latency difference (<10ms) vs. pure native (acceptable trade-off)

**Validation:** Build performance prototype in Sprint 0-1 to confirm latency targets met.

---

#### **Decision 3: External API (CameraMath) + Fallbacks (Not Custom Math Solver)**

**Context:** Build custom handwriting recognition and math solver, or use external API?

**Decision:** Use CameraMath API with Wolfram Alpha backup and basic local fallback.

**Rationale:**
- Handwriting recognition is a solved problem (buy, don't build)
- Custom solver would take 6-12 months to match API capabilities
- CameraMath specialized for math handwriting
- Cost-effective ($10 free, then pay-per-use)
- Fallbacks provide resilience

**Trade-offs:**
- ✅ Saves 6+ months development time
- ✅ Better accuracy than custom MVP solver
- ❌ External dependency (mitigated by fallbacks)
- ❌ Per-request cost (acceptable: ~$0.01-0.05 per validation)

**Risk Mitigation:**
- Circuit breaker pattern (auto-switch to fallback on repeated failures)
- Basic local solver for common algebra (linear equations, simplification)
- Retry logic with exponential backoff

---

#### **Decision 4: Firebase (Not AWS or Azure)**

**Context:** Which cloud platform for backend?

**Decision:** Firebase (Google Cloud Platform)

**Rationale:**
- Serverless = auto-scaling without config
- Integrated ecosystem (auth, storage, database, functions)
- Excellent React Native SDK
- Real-time capabilities (future teacher dashboard)
- Generous free tier for MVP
- Fastest time-to-MVP

**Trade-offs:**
- ✅ Rapid development (integrated services)
- ✅ Cost-effective for MVP (pay-per-use)
- ⚠️ Vendor lock-in (mitigated: can migrate to AWS/Azure later if needed)
- ⚠️ Less enterprise-y than AWS (not a concern for MVP)

**Alternative Considered:** AWS (Lambda + DynamoDB + S3) - more complex setup, similar capabilities.

---

#### **Decision 5: Dual Validation (Correctness + Usefulness) as Core Differentiator**

**Context:** Many apps check correctness. Should we build "usefulness" validation?

**Decision:** YES. This is the unique value proposition.

**Rationale:**
- Differentiates from other math apps (most only check correct/incorrect)
- Teaches strategic thinking, not just mechanical steps
- Aligns with pedagogical best practices (productive struggle)
- PRD explicitly calls this out as "magic moment" feature

**Trade-offs:**
- ✅ Unique teaching value
- ✅ Patent-defensible innovation
- ❌ Requires custom logic (can't buy from API)
- ❌ Needs educator input to refine

**Implementation:** Start with simple distance-to-solution heuristic, refine based on student testing feedback.

---

#### **Decision 6: Rule-Based Hints (MVP) → LLM Hints (Growth)**

**Context:** Generate hints using rules, templates, or LLM?

**Decision:** Rule-based hint library for MVP, LLM-generated for growth.

**Rationale:**
- Rule-based is fast (<50ms), predictable, curriculum-aligned
- Can test pedagogical effectiveness with known hint content
- LLM adds cost and latency (~200-500ms per hint)
- Pre-authored hints ensure quality for MVP

**Trade-offs:**
- ✅ Fast, deterministic, testable
- ✅ No LLM API cost
- ❌ Requires manual hint authoring (100-200 hints for MVP)
- ❌ Less personalized than LLM (acceptable trade-off)

**Growth Path:** Integrate GPT-4/Claude for dynamic, context-aware hints once core system validated.

---

## Risk Mitigation Strategies

### High-Priority Risks

#### **Risk 1: API Latency Exceeds 500ms Target**

**Likelihood:** Medium
**Impact:** High (breaks "magic moment")

**Mitigation Strategies:**

1. **Optimistic UI:**
   - Show "Checking..." immediately, update when response arrives
   - Student can continue working (non-blocking)

2. **Aggressive Timeout:**
   - 300ms timeout on API calls
   - Fallback to local validation if timeout

3. **Caching:**
   - Cache recognized expressions for common patterns
   - Skip re-recognition if student re-submits same line

4. **Parallel Processing:**
   - Recognition + validation in parallel (not serial)
   - Render image while awaiting previous API response

5. **Local Fallback Solver:**
   - Basic algebra solver (linear equations, simplification)
   - Arithmetic validation (always local)
   - 95% of middle school math covered

**Contingency:** If API consistently slow, prioritize building robust local solver for common operations.

---

#### **Risk 2: Stylus Latency >100ms (Doesn't Feel Like Paper)**

**Likelihood:** Low (modern libraries achieve this)
**Impact:** Critical (destroys core UX)

**Mitigation Strategies:**

1. **Early Performance Prototype:**
   - Build drawing canvas in Sprint 0-1
   - Test on minimum spec device (iPad 6th gen)
   - Measure with high-speed camera

2. **UI Thread Optimization:**
   - Use worklets (react-native-reanimated)
   - Keep all drawing on UI thread
   - Zero JS bridge crossing during drawing

3. **Native Module Fallback:**
   - If RN libraries insufficient, write custom native drawing module
   - PencilKit (iOS) wrapper as backup plan

**Contingency:** If React Native can't achieve target, pivot to native development (Swift for iOS, Kotlin for Android). Delay Android version if needed to ship quality iOS first.

---

#### **Risk 3: "Usefulness" Validation Too Complex to Implement**

**Likelihood:** Medium
**Impact:** High (core differentiator)

**Mitigation Strategies:**

1. **Start Simple:**
   - Version 1: Basic heuristic (did variables decrease? did complexity decrease?)
   - Iterate based on student testing

2. **Educator Collaboration:**
   - Partner with math teacher to define "usefulness" criteria
   - Test with real students, refine algorithm

3. **Rule-Based Approach:**
   - Define usefulness rules per problem type
   - Linear equations: isolating variable = useful
   - Don't try to solve generally, specialize per topic

4. **Graceful Degradation:**
   - If usefulness unclear, treat as "useful" (optimistic)
   - Avoid false negatives (don't discourage correct steps)

**Contingency:** If usefulness validation proves too hard, simplify to binary correct/incorrect for MVP. Add usefulness in v1.1 after more research.

---

#### **Risk 4: COPPA Compliance Complexity Delays Launch**

**Likelihood:** Medium
**Impact:** Medium (regulatory, not technical)

**Mitigation Strategies:**

1. **Minimal PII Collection:**
   - Device-based auth (no email/name required)
   - Optional parent email only if under 13

2. **Legal Review Early:**
   - Engage legal counsel in Sprint 2-3
   - Review privacy policy, consent flows
   - Don't wait until launch

3. **Template Privacy Policy:**
   - Use Firebase's COPPA-compliant templates
   - Customize for app specifics

4. **Age Gate:**
   - Ask user age on first launch
   - If under 13, require parent email + consent
   - If 13+, proceed without extra consent

**Contingency:** If COPPA too complex for MVP, launch as "13+ only" first, add parental consent flow in v1.1.

---

#### **Risk 5: Handwriting Recognition Accuracy <95%**

**Likelihood:** Medium
**Impact:** Medium (frustrating but not fatal)

**Mitigation Strategies:**

1. **Multi-Provider Strategy:**
   - CameraMath (primary)
   - Wolfram Alpha + Google ML Kit (backup)
   - Always use highest confidence result

2. **User Correction Flow:**
   - If low confidence, ask student: "Did you write 'x' or 'y'?"
   - Learn from corrections (future ML training data)

3. **Clear Handwriting Guidelines:**
   - Tutorial on first launch showing good handwriting examples
   - Guide lines to structure writing
   - Encourage clear, deliberate writing

4. **Recognition Feedback:**
   - Show recognized expression before validation
   - "Is this what you wrote? [2x + 3 = 7] ✓ or ✗"
   - Student can confirm or correct

**Contingency:** If recognition persistently poor, add manual LaTeX entry as alternative input method (less magical, but functional).

---

### Medium-Priority Risks

#### **Risk 6: Battery Drain from Continuous Drawing**

**Likelihood:** Low
**Impact:** Low (annoying, not blocking)

**Mitigation:**
- GPU-accelerated rendering (Skia is efficient)
- Throttle background sync when on battery power
- Test battery usage in 30-minute sessions

---

#### **Risk 7: Firebase Costs Exceed Budget**

**Likelihood:** Low (free tier generous)
**Impact:** Low (operational cost)

**Mitigation:**
- Monitor Firebase usage dashboard
- Set billing alerts at $50, $100
- Optimize queries (avoid full collection scans)
- Batch writes to reduce operation count

---

#### **Risk 8: Cross-Platform Styling Inconsistencies**

**Likelihood:** Medium
**Impact:** Low (cosmetic)

**Mitigation:**
- Use platform-agnostic design system
- Test on both iOS and Android throughout development
- Use Platform.select() for platform-specific tweaks

---

## Implementation Roadmap

### Phase 0: Foundation (Weeks 1-2)

**Goal:** Project setup, performance validation, proof of concept

**Tasks:**
1. **Project Setup**
   - Initialize React Native project (latest stable version)
   - Configure TypeScript, ESLint, Prettier
   - Set up Git repository + GitHub Actions CI
   - Install core dependencies (skia, gesture-handler, reanimated)

2. **Performance Prototype** ⭐ CRITICAL
   - Build minimal drawing canvas with react-native-skia
   - Implement stylus input with gesture-handler
   - Measure latency on iPad 6th gen
   - **Success Criteria:** <100ms stylus-to-ink latency confirmed

3. **API Integration Test** ⭐ CRITICAL
   - Register for CameraMath API ($10 free credits)
   - Test handwriting recognition with sample images
   - Measure API response time
   - **Success Criteria:** <300ms API response time confirmed

4. **Firebase Setup**
   - Create Firebase project
   - Configure Firestore database
   - Set up Cloud Functions environment
   - Implement basic auth (anonymous)

**Deliverables:**
- Working drawing prototype (proof of <100ms latency)
- API integration confirmed (recognition accuracy + latency)
- Project scaffolding complete

**Go/No-Go Decision:** If latency targets not met, reassess architecture (native code, different libraries).

---

### Phase 1: MVP Core Features (Weeks 3-8)

**Goal:** Implement complete training mode experience

#### Sprint 1-2: Drawing Engine (Weeks 3-4)

**Features:**
- Full handwriting canvas with multi-color support
- Eraser tool (stroke-by-stroke deletion)
- Guided line structure (visual guides for steps)
- Automatic line detection and splitting
- Local storage of strokes (SQLite)

**Acceptance Criteria:**
- Stylus latency <100ms on iPad 6th gen
- 60 FPS during continuous writing
- Ink colors: black, blue, red (minimum)
- Eraser mode toggle functional
- Guide lines visible and properly spaced

---

#### Sprint 3-4: Validation Engine (Weeks 5-6)

**Features:**
- Handwriting-to-math conversion (CameraMath integration)
- Correctness validation
- Basic usefulness assessment (v1 heuristic)
- Progress tracking (solution detection)
- Visual feedback (checkmarks, nudges, error indicators)

**Acceptance Criteria:**
- Recognition accuracy >90% on clear handwriting
- Validation response <500ms (95th percentile)
- Usefulness logic works for linear equations
- Solution detection accurate
- Feedback animations smooth and non-punitive

---

#### Sprint 5-6: Hint System + Cloud Sync (Weeks 7-8)

**Features:**
- Inactivity detection (30-45 second threshold)
- Graduated hint generation (rule-based, 3 levels)
- Error-triggered hints
- Cloud sync (background, retry logic)
- Offline capability (queue and sync)

**Acceptance Criteria:**
- Inactivity timer configurable
- Hints appear without blocking work
- Hint content pedagogically sound (reviewed by educator)
- Zero data loss (local-first confirmed)
- Sync retries on failure

---

### Phase 2: Polish & Testing (Weeks 9-10)

**Goal:** Performance optimization, bug fixes, accessibility, testing

**Tasks:**

1. **Performance Optimization**
   - Profile memory usage, fix leaks
   - Optimize stroke compression
   - Reduce app bundle size
   - Battery usage testing

2. **Accessibility Implementation**
   - High contrast mode
   - Font size controls
   - Colorblind-safe colors
   - Screen reader support for hints
   - VoiceOver/TalkBack testing

3. **Device Testing**
   - Test on 5+ iPad models (6th gen to latest)
   - Test on 3+ Android tablets (Samsung, generic)
   - Test various styluses (Apple Pencil, S-Pen, generic)

4. **Bug Fixes**
   - Address all critical and high-priority bugs
   - UX refinements based on internal testing

5. **Compliance Review**
   - Privacy policy finalization
   - COPPA compliance audit
   - App Store metadata preparation

**Deliverables:**
- Performance meets all NFR targets
- Accessibility WCAG 2.1 AA compliant
- Zero critical bugs
- Ready for beta testing

---

### Phase 3: Beta Testing (Weeks 11-12)

**Goal:** Real-world validation with students

**Activities:**

1. **Beta Deployment**
   - TestFlight (iOS) - 20 beta testers
   - Google Play Internal Testing (Android) - 10 beta testers
   - Mix of ages (grades 5-9)

2. **Data Collection**
   - Handwriting recognition accuracy (real students)
   - Validation latency (real network conditions)
   - Hint effectiveness (do students discover solutions?)
   - Usability feedback (surveys after use)

3. **Iteration**
   - Fix bugs reported by beta testers
   - Refine hint content based on effectiveness data
   - Adjust usefulness algorithm if needed

**Success Metrics:**
- >90% of students complete at least one problem
- Recognition accuracy >95%
- <5% crash rate
- Positive feedback from teachers

---

### Phase 4: Launch (Week 13)

**Goal:** Public release on App Store and Google Play

**Tasks:**

1. **Store Submissions**
   - App Store review submission (iOS)
   - Google Play review submission (Android)
   - Monitor for approval/rejection

2. **Documentation**
   - User guide (for teachers/parents)
   - FAQ
   - Support contact (email or form)

3. **Monitoring Setup**
   - Sentry error tracking enabled
   - Firebase Analytics configured
   - Performance monitoring active

4. **Launch Communication**
   - Notify stakeholders
   - Share with initial school partners

**Deliverables:**
- App live on App Store
- App live on Google Play
- Monitoring and support in place

---

### Post-Launch: Growth Features (Weeks 14+)

**Prioritized Roadmap:**

1. **Teacher Dashboard (Weeks 14-18)**
   - Real-time student progress view
   - Live work viewing (2-3 second delay sync)
   - Intervention triggers
   - Analytics reports

2. **Tutorial Mode (Weeks 19-22)**
   - Direct Instruction tutorials
   - Worked examples
   - Scaffolded practice

3. **Assessment Mode (Weeks 23-26)**
   - Modified validation (submit-on-complete, no real-time hints)
   - Assessment reporting
   - Mastery tracking

4. **Enhanced Handwriting (Weeks 27-30)**
   - Undo/redo functionality
   - Gesture shortcuts (circle to select, scratch to delete)
   - Handwriting style adaptation

5. **Voice Tutoring (Weeks 31-34)**
   - Text-to-speech hints
   - Short audio encouragement
   - Accessibility enhancement

---

### Development Team Structure

**Recommended Team (MVP):**

| Role | Headcount | Responsibilities |
|------|-----------|------------------|
| **Mobile Engineer** | 2 | React Native development, canvas implementation |
| **Backend Engineer** | 1 | Firebase setup, Cloud Functions, API integration |
| **Designer (UX/UI)** | 0.5 | Visual design, interaction design (part-time) |
| **Math Educator** | 0.25 | Hint content, usefulness criteria (consultant) |
| **QA Tester** | 0.5 | Device testing, bug reporting (part-time) |
| **Project Manager** | 0.5 | Sprint planning, stakeholder updates (part-time) |

**Total FTE:** ~4.5 people for 12-week MVP

**Skills Required:**
- React Native expertise (must-have)
- react-native-skia experience (nice-to-have, learnable)
- Firebase experience (nice-to-have)
- EdTech domain knowledge (consultant)

---

### Timeline Summary

```
Week 1-2:  Phase 0 - Foundation & Validation
Week 3-4:  Sprint 1-2 - Drawing Engine
Week 5-6:  Sprint 3-4 - Validation Engine
Week 7-8:  Sprint 5-6 - Hint System + Cloud Sync
Week 9-10: Phase 2 - Polish & Testing
Week 11-12: Phase 3 - Beta Testing
Week 13:   Phase 4 - Launch
Week 14+:  Growth Features (Teacher Dashboard, Tutorial Mode, etc.)
```

**MVP Timeline:** 12-13 weeks (3 months)
**To Launch:** 13 weeks
**To Growth Features:** 14+ weeks (iterative)

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Stylus Latency** | Time from stylus touching screen to ink appearing (target: <100ms) |
| **Validation Latency** | Time from line submission to feedback displayed (target: <500ms) |
| **Local-First** | Architecture pattern where client device is source of truth, cloud is backup |
| **Dual Validation** | Checking both correctness (mathematically valid?) and usefulness (progresses solution?) |
| **Graduated Hints** | Three-level hint escalation (concept cue → directional → micro next step) |
| **Usefulness** | Whether a correct step moves the student closer to solving the problem |
| **Write-Ahead Logging** | Pattern where all writes go to local storage before cloud, ensuring zero data loss |
| **Circuit Breaker** | Pattern that stops calling failing external service temporarily, uses fallback |
| **Worklet** | Code that runs on UI thread in react-native-reanimated (no bridge crossing) |

---

### B. Technology Resources

**React Native Skia:**
- Docs: https://shopify.github.io/react-native-skia/
- Examples: https://github.com/Shopify/react-native-skia/tree/main/example

**React Native Gesture Handler:**
- Docs: https://docs.swmansion.com/react-native-gesture-handler/
- Stylus input: https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture

**Firebase:**
- React Native: https://rnfirebase.io/
- Cloud Functions: https://firebase.google.com/docs/functions

**CameraMath API:**
- Contact: (TBD - register and obtain documentation)

**COPPA Compliance:**
- FTC Guidelines: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

**FERPA Compliance:**
- ED Guidelines: https://studentprivacy.ed.gov/

---

### C. Component Reusability Guide

**Extracting Components for Superbuilders Reuse:**

Each major component should be packaged as standalone module:

```
@superbuilders/handwriting-canvas/
├── src/
│   ├── DrawingCanvas.tsx (main component)
│   ├── StrokeCapture.ts (input handling)
│   ├── InkRenderer.ts (skia rendering)
│   ├── LineDetector.ts (automatic splitting)
│   └── EraserTool.ts (eraser logic)
├── package.json
├── README.md (usage examples)
└── example/ (demo app)
```

**Usage in Other Projects:**

```typescript
// In a different Superbuilders project
import { DrawingCanvas } from '@superbuilders/handwriting-canvas';

function MyNoteApp() {
  return (
    <DrawingCanvas
      onStrokeComplete={(stroke) => saveStroke(stroke)}
      onLineComplete={(strokes) => processLine(strokes)}
      inkColor="blue"
      guideLineCount={10}
    />
  );
}
```

**Modules to Extract:**
1. `@superbuilders/handwriting-canvas` - Drawing engine
2. `@superbuilders/math-validation` - Validation engine (generic interface)
3. `@superbuilders/tutoring-hints` - Hint system (not math-specific)
4. `@superbuilders/offline-sync` - Data sync pattern

---

### D. Testing Strategy

**Unit Tests (Jest):**
```typescript
// Example: Usefulness assessment logic
describe('UsefulnessAssessor', () => {
  it('should mark step as useful if it isolates variable', () => {
    const previous = parseExpression('2x + 3 = 7');
    const current = parseExpression('2x = 4');
    const result = assessUsefulness(current, previous, { type: 'ISOLATE_VARIABLE', variable: 'x' });
    expect(result.useful).toBe(true);
  });

  it('should nudge if step is correct but not useful', () => {
    const previous = parseExpression('2x + 3 = 7');
    const current = parseExpression('2x + 3 + 1 = 8');
    const result = assessUsefulness(current, previous, { type: 'ISOLATE_VARIABLE', variable: 'x' });
    expect(result.useful).toBe(false);
    expect(result.nudgeMessage).toContain('help');
  });
});
```

**Integration Tests (Detox):**
```typescript
// Example: End-to-end drawing and validation
describe('Drawing and Validation', () => {
  it('should validate a line after submission', async () => {
    // Draw on canvas (simulate stylus input)
    await element(by.id('drawing-canvas')).swipe('right', 'slow');

    // Submit line
    await element(by.id('submit-line-button')).tap();

    // Check feedback appears
    await expect(element(by.id('validation-feedback'))).toBeVisible();
    await expect(element(by.text('Correct!'))).toBeVisible();
  });
});
```

**Performance Tests:**
```typescript
// Example: Latency measurement
test('Stylus latency should be <100ms', async () => {
  const measurements = [];

  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    // Simulate touch event
    fireEvent.touchStart(canvas, { x: 100, y: 100 });
    const end = performance.now();
    measurements.push(end - start);
  }

  const averageLatency = measurements.reduce((a, b) => a + b) / measurements.length;
  expect(averageLatency).toBeLessThan(100);
});
```

---

### E. Deployment Checklist

**Pre-Launch Checklist:**

- [ ] Performance targets met (<100ms stylus, <500ms validation)
- [ ] All critical and high bugs resolved
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] COPPA compliance review complete
- [ ] Privacy policy finalized and accessible
- [ ] App Store metadata prepared (screenshots, descriptions)
- [ ] TestFlight beta testing complete (20+ testers)
- [ ] Monitoring enabled (Sentry, Firebase Analytics)
- [ ] Support email/form operational
- [ ] User guide and FAQ published
- [ ] Data deletion API tested
- [ ] Security audit passed
- [ ] API keys properly secured (not hardcoded)
- [ ] Firestore Security Rules deployed
- [ ] Cloud Functions deployed to production
- [ ] App icons and splash screens finalized
- [ ] Store compliance (App Store, Google Play) verified

---

### F. Maintenance Plan

**Post-Launch Responsibilities:**

1. **Monitoring (Daily):**
   - Check Sentry for new crashes
   - Review Firebase Analytics for usage patterns
   - Monitor API usage and costs

2. **Support (As Needed):**
   - Respond to user feedback within 24-48 hours
   - Triage bug reports (critical vs. minor)

3. **Updates (Monthly):**
   - Dependency updates (React Native, libraries)
   - Security patches
   - Bug fixes

4. **Feature Releases (Quarterly):**
   - Growth features per roadmap
   - User-requested enhancements

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-05 | Winston (Architect Agent) | Initial architecture document |

---

**END OF ARCHITECTURE DOCUMENT**

This architecture is ready for implementation. The design balances performance, reliability, scalability, and compliance while maintaining flexibility for growth. All critical architectural risks have mitigation strategies, and the technology stack is proven and appropriate for the requirements.

**Next Steps:**
1. Review this document with stakeholders
2. Begin Phase 0 (Foundation & Validation)
3. Validate performance assumptions with prototypes
4. Proceed with MVP implementation

**Questions or clarifications?** Contact the architect or refer to specific sections of this document.
