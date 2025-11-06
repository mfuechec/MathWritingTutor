# Handwriting Math Tutor - Product Requirements Document

**Author:** BMad
**Date:** 2025-11-05
**Version:** 1.0

---

## Executive Summary

A mobile-first tablet application that transforms math learning through natural handwriting interaction. Students write solutions line-by-line on a digital canvas while receiving real-time intelligent feedback. The app validates both correctness and usefulness of each step, providing graduated hints that guide learning without revealing answers. Inspired by Project Chiron, this tool aims to deliver the experience of a patient, knowledgeable tutor watching over a student's shoulder - making quality math tutoring accessible and scalable.

### What Makes This Special

**The Magic Moment:** A student hesitates on a problem. They write a tentative step. Instantly, the app recognizes their handwriting, validates their mathematical reasoning, and provides just enough guidance to help them discover the next step themselves. No full answers. No frustration. Just the right nudge at the right time. This is learning that feels like having a master teacher present, scaled through technology.

The dual validation system (correctness + usefulness) combined with graduated hint escalation creates a tutoring experience that teaches mathematical thinking, not just mechanical problem-solving.

---

## Project Classification

**Technical Type:** Mobile App (Tablet-First)
**Domain:** EdTech (K-12 Mathematics)
**Complexity:** Medium

**Classification Details:**

This is a tablet-focused mobile application with stylus input, targeting the educational technology domain. The project sits at medium complexity due to:

- **EdTech Requirements:** Student privacy compliance (COPPA/FERPA), age-appropriate content, pedagogical effectiveness, accessibility standards
- **Technical Challenges:** Real-time handwriting recognition, mathematical expression parsing, intelligent hint generation, cross-platform mobile development
- **User Experience:** Balancing guidance with discovery, creating intuitive handwriting interfaces, managing hint escalation logic

**Target Platform:** Primarily tablets (iPad preferred) with stylus support, though technically capable on phones with reduced experience.

**Technology Stack:** React Native (tablet-optimized), external math solver API (CameraMath preferred), cloud storage backend.

### Domain Context

**Educational Domain Considerations:**

This application operates in the K-12 mathematics education space, which requires attention to:

1. **Privacy Compliance:** COPPA (Children's Online Privacy Protection Act) and FERPA (Family Educational Rights and Privacy Act) govern how we collect, store, and use student data
2. **Pedagogical Effectiveness:** The hint escalation system must align with best practices in mathematics education - promoting conceptual understanding over rote memorization
3. **Accessibility:** Must support diverse learners, including those with different learning needs
4. **Content Appropriateness:** Age-appropriate language, examples, and guidance
5. **Assessment Validity:** The correctness and usefulness checks must align with accepted mathematical pedagogy

**Reference Project:** Project Chiron serves as the inspiration and functional benchmark for this implementation.

---

## Success Criteria

**Primary Success Indicators:**

1. **Learning Effectiveness**
   - Students successfully complete problems they previously struggled with, demonstrating improved problem-solving skills
   - Hint escalation rarely reaches "micro next step" level - students discover solutions with minimal guidance
   - Students demonstrate understanding by applying concepts to new problems without hints

2. **Engagement Quality**
   - Students spend 15+ minutes per session actively working through problems (not passively consuming content)
   - Low frustration abandonment - students complete 80%+ of started problems
   - Students voluntarily return to practice additional problems

3. **Tutoring Experience Quality**
   - Handwriting recognition accuracy >95% for mathematical expressions
   - Validation response time <500ms per line submission
   - Hint relevance rating >4/5 (when students actually need help)
   - "Magic moment" frequency - students experience the "aha!" moment of discovering the solution with just-right guidance

4. **Technical Reliability**
   - App performs smoothly on target tablets with <100ms stylus latency
   - Zero data loss for student attempts (complete cloud storage reliability)
   - External math solver availability >99% (with graceful degradation)

5. **Reusability for Organization**
   - Components are modular and reusable across multiple Superbuilders projects
   - Codebase serves as foundation for similar tablet-based learning tools
   - Other projects can integrate the handwriting canvas and validation engine

**What Success Means:**

Success means a student sits down with a challenging math problem, picks up their stylus, and experiences the feeling of having a patient expert tutor guiding them. They write, receive instant meaningful feedback, get unstuck with smart hints, and most importantly - discover the solution themselves rather than being told. The technology disappears, and what remains is effective learning.

---

## Product Scope

### MVP - Minimum Viable Product

**Core Training Mode - The Essential Experience**

The MVP delivers the complete "magic moment" - a student working through a math problem with intelligent, real-time guidance. Everything needed to prove the concept and validate learning effectiveness.

**Must-Have Features:**

1. **Training Mode Flow**
   - Problem display at top of screen
   - Line-by-line handwriting input on canvas
   - Visible guides to structure solution process
   - Automatic line splitting and recognition
   - Dual validation: correctness + usefulness checks
   - Immediate feedback per line (accept/nudge/hint)

2. **Handwriting Support**
   - Full handwriting input with stylus
   - Multiple color support for writing
   - Eraser tool for corrections
   - Smooth, responsive ink rendering (<100ms latency)

3. **Intelligent Guidance System**
   - Inactivity detection triggers tips
   - Graduated three-level hint escalation:
     - Level 1: Concept cue (general direction)
     - Level 2: Directional hint (specific approach)
     - Level 3: Micro next step (minimal reveal)
   - Never reveals full solution or complete next step
   - Context-aware hints based on student's work

4. **Math Validation Engine**
   - Integration with external math solver (CameraMath API)
   - Handwriting-to-math expression conversion
   - Step correctness verification
   - Solution progress assessment (usefulness check)

5. **Cloud Storage & Analytics**
   - Store every attempt: problem, written lines, outcomes, timestamps
   - Enable learning analytics and intervention detection
   - Support future guide/teacher features

**Technology Foundation:**
- React Native (tablet-optimized build)
- CameraMath API integration ($10 free credits for initial testing)
- Cloud backend for data persistence

**MVP Goal:** Deliver a smooth, responsive tablet experience that proves the intelligent tutoring concept and provides reusable components for other Superbuilders projects.

### Growth Features (Post-MVP)

**Expanding the Tutoring Ecosystem**

1. **Guide/Teacher Dashboard**
   - Real-time visibility into student progress
   - Live view of student's work as they write
   - Ability for guide to write directly into student's workspace (bidirectional)
   - Intervention triggers and notifications
   - Progress tracking across multiple students

2. **Tutorial Mode**
   - Direct Instruction-based tutorials before problem practice
   - Concept introduction for new skills
   - Worked examples with explanation
   - Scaffolded transition from tutorial to independent practice

3. **Assessment Mode**
   - Modified validation flow: collect all lines, validate on submit
   - No real-time hints during assessment
   - Complete solution evaluation at end
   - Assessment reporting and mastery tracking

4. **Enhanced Handwriting Features**
   - Undo/redo functionality (beyond erasing)
   - Gesture-based shortcuts (circle to select, scratch to delete)
   - Handwriting style adaptation/training

5. **Voice Tutoring**
   - Short, targeted verbal hints (not conversational)
   - Audio feedback for hints and encouragement
   - Accessibility enhancement for different learning styles

### Vision (Future)

**Scaling Intelligence and Reach**

1. **Adaptive Learning Engine**
   - Student skill modeling based on attempt history
   - Personalized problem selection
   - Dynamic difficulty adjustment
   - Learning gap identification

2. **Multi-Subject Expansion**
   - Physics problem solving
   - Chemistry equations and stoichiometry
   - Algebra, geometry, calculus progression
   - Standardized test prep (SAT Math, etc.)

3. **Collaborative Learning**
   - Peer review mode
   - Collaborative problem solving
   - Solution sharing and discussion

4. **Advanced Analytics**
   - Predictive intervention (detect struggle patterns)
   - Comparative analysis across cohorts
   - Effectiveness metrics for different hint strategies
   - A/B testing framework for pedagogical approaches

5. **Offline Capability**
   - Local math solver for basic operations
   - Sync when connection restored
   - Download problem sets for offline practice

6. **Platform Expansion**
   - Desktop companion app
   - Phone optimization (reduced feature set)
   - Web-based teacher dashboard

**Vision Summary:** Transform from a single-student tutoring tool into a comprehensive learning platform that adapts to each student, supports multiple subjects, enables teacher oversight, and generates insights that improve mathematics education.

---

## Domain-Specific Requirements

**Educational Technology Compliance & Best Practices**

As an EdTech product targeting K-12 students, the following domain-specific requirements shape all technical and functional decisions:

### Privacy & Data Protection

**COPPA Compliance (Children's Online Privacy Protection Act):**
- No collection of personal information from children under 13 without verifiable parental consent
- Clear privacy policy written for parents and children
- Data minimization - only collect what's necessary for educational purpose
- Secure data handling and storage practices
- No third-party advertising or tracking

**FERPA Considerations (Family Educational Rights and Privacy Act):**
- Student educational records must be protected
- Access controls for student data
- Audit trails for data access
- Secure data transmission
- Data retention and deletion policies

### Pedagogical Requirements

**Evidence-Based Tutoring Practices:**
- **Graduated Hints:** Align with scaffolding theory - provide minimal help necessary
- **Productive Struggle:** Allow students time to think before offering hints
- **Formative Assessment:** Real-time feedback on both correctness and problem-solving approach
- **Growth Mindset:** Language in hints should encourage persistence and learning from errors
- **Metacognition:** Help students think about their thinking (not just tell them answers)

**Hint Design Principles:**
1. **Level 1 (Concept Cue):** "What operation might help here?" - activates prior knowledge
2. **Level 2 (Directional Hint):** "Try isolating the variable" - suggests strategy
3. **Level 3 (Micro Next Step):** "What happens if you add 5 to both sides?" - very specific but not the full answer

### Content Standards

- Math problems must align with Common Core or relevant state standards
- Age-appropriate language and examples
- Culturally responsive content
- Clear learning objectives for each problem

### Accessibility Requirements

**WCAG Compliance for Educational Software:**
- High contrast modes for visual impairments
- Stylus pressure sensitivity adjustments
- Font size controls
- Color-blind friendly color palettes
- Optional audio feedback (connects to voice tutoring feature)

**Impact on Design:** These requirements mandate secure backend architecture, careful UX copy, transparent data practices, and pedagogically sound hint generation algorithms.

---

## Mobile App Specific Requirements

**Tablet-First Cross-Platform Mobile Application**

### Platform Support

**Primary Target:**
- **iPadOS:** Version 15+ (covers iPad 6th gen and later with Apple Pencil support)
- **Android Tablets:** Android 10+ with stylus support (Samsung Galaxy Tab S series, etc.)

**Platform Strategy:**
- React Native for cross-platform development
- Platform-specific optimizations for stylus input
- Native modules for handwriting recognition if React Native performance insufficient
- react-native-skia for high-performance canvas rendering

**Store Presence:**
- Apple App Store (Educational category)
- Google Play Store (Educational category)
- Compliance with both stores' educational app policies

### Device Features & Permissions

**Required Device Capabilities:**
- **Stylus/Pencil Input:** Pressure sensitivity, palm rejection, low latency
- **Display:** Minimum 9.7" screen (practical for math writing)
- **Storage:** Local caching for problems and student attempts
- **Network:** Internet connectivity for API calls and cloud sync

**Required Permissions:**
- **Storage:** Save student work locally before cloud sync
- **Network Access:** API calls to math solver and cloud backend
- **No Camera/Microphone:** (MVP) - adds privacy simplicity
- **Optional Microphone:** (Growth - for voice tutoring)

### Platform-Specific Considerations

**iOS/iPadOS:**
- Apple Pencil optimization (PencilKit integration)
- Touch rejection during writing
- App Store Educational pricing tier
- TestFlight beta distribution
- No external payment systems (Apple IAP if subscriptions added)

**Android:**
- Samsung S-Pen API integration
- Wacom stylus protocol support
- Google Play Family policies compliance
- Variety of screen sizes and aspect ratios
- Manufacturer-specific stylus SDKs

### Offline Capabilities

**MVP Offline Behavior:**
- **Requires Connection:** Initial app requires network for API-based math validation
- **Graceful Degradation:** Queue student attempts locally if connection drops
- **Auto-Sync:** Resume API calls and sync when connection restored
- **Problem Caching:** Pre-load problem sets for continued practice during brief outages

**Growth Feature - Extended Offline:**
- Local math solver for basic operations
- Full offline problem-solving sessions
- Sync all data when reconnected

### Store Compliance Requirements

**Apple App Store:**
- Educational category guidelines
- Privacy policy linked in metadata
- Age rating: 4+ or 9+ (based on content)
- No ads, no IAP in MVP
- Educational institution volume purchase support
- Accessibility features documentation

**Google Play:**
- Family policies compliance (Teacher Approved program eligible)
- Content rating via IARC
- Privacy policy in store listing
- No ads to children
- Data safety section completion
- "Designed for Families" program considerations

### Cross-Platform Consistency vs. Native Feel

**Consistency Priority Areas:**
- Core tutoring logic (hints, validation, feedback)
- Problem content and presentation
- Data storage format and cloud sync
- Overall visual design and branding

**Platform-Specific Adaptations:**
- Stylus input handling (native APIs)
- Gesture conventions (iOS vs Android patterns)
- Navigation patterns (bottom tab bar iOS, drawer Android)
- System font rendering
- Status bar and safe area handling

**Development Strategy:** Build shared business logic in React Native, wrap platform-specific stylus/canvas code in native modules for performance.

---

## User Experience Principles

**Design Philosophy: Invisible Technology, Visible Learning**

The UX should feel like writing on paper with an invisible tutor looking over your shoulder. Technology fades into the background; the focus remains on thinking through the math problem.

### Core UX Principles

**1. Natural Writing Experience**
- **Paper-like Immediacy:** Stylus to screen feels like pencil to paper - zero perceived lag
- **Forgiving Input:** Easy erasing, clear visual feedback, no punishment for messy handwriting
- **Spatial Freedom:** Students can write naturally; the app structures it intelligently
- **Visual Continuity:** Problem text, guides, and student work form a coherent visual workspace

**2. Calm, Focused Interface**
- **Minimal Chrome:** No unnecessary UI elements during problem-solving
- **Distraction-Free:** No notifications, no gamification badges interrupting flow
- **Clear Hierarchy:** Problem → Student Work → Feedback - obvious visual priority
- **Breathing Room:** Generous whitespace, uncluttered canvas

**3. Intelligent, Unobtrusive Guidance**
- **Feedback is Fast:** <500ms from line completion to validation
- **Feedback is Clear:** Visual indicators distinguish "correct," "nudge," and "incorrect"
- **Hints Feel Helpful, Not Judgmental:** Encouraging language, growth mindset tone
- **Progressive Disclosure:** Hints appear when needed, disappear when problem flows

**4. Confidence Through Clarity**
- **Visible Structure:** Guide lines show where to write next step
- **Progress Signals:** Student can see they're making progress toward solution
- **Safe Exploration:** Erasing is easy; trying approaches feels low-risk
- **Celebration of Success:** Subtle positive feedback when steps are correct

**5. Respectful Timing**
- **Patience First:** Allow productive struggle time before offering hints
- **No Rushing:** Student controls pace; no timers creating anxiety
- **Gentle Nudges:** Inactivity detection is patient (30+ seconds), not nagging
- **Smooth Transitions:** Animations are purposeful, not flashy

### Visual Personality

**Tone: Professional Yet Approachable**
- Clean, modern educational aesthetic
- Not childish, not sterile - respects student intelligence
- Colors: Calm, high-contrast palette (accessibility-first)
- Typography: Clear, readable math fonts (STIX Two Math or similar)

**Mood: Focused Learning**
- Serious about learning, not serious in tone
- Encouraging without being patronizing
- Scholarly but not intimidating
- Like a good study space - calm, organized, purposeful

### Key Interactions

**Primary Gesture Vocabulary:**

1. **Writing**
   - Stylus writes ink instantly on canvas
   - Multiple colors available via simple toolbar
   - Pressure sensitivity reflects in line weight
   - Palm rejection prevents accidental marks

2. **Erasing**
   - Dedicated eraser tool (toggle button or flip stylus on supported devices)
   - Erases stroke-by-stroke, not pixel-by-pixel
   - Clear visual feedback of eraser mode
   - Quick return to writing mode

3. **Line Submission**
   - Automatic detection when student moves to next guide line
   - OR explicit "Check this step" button for student control
   - Brief animation showing validation in progress
   - Clear visual feedback: checkmark (correct), gentle highlight (nudge), or indicator (incorrect)

4. **Receiving Hints**
   - Hint appears in dedicated, non-intrusive area (top or side panel)
   - Student can dismiss hint after reading
   - Can request escalated hint if first level insufficient
   - Hint text is concise, scannable, actionable

5. **Navigation**
   - Minimal navigation during problem - focus is on the work
   - Clear exit/back option (with save warning if needed)
   - Problem list accessible but not distracting
   - Settings tucked away but discoverable

**Interaction Design Priorities:**

- **Speed:** Every interaction feels instant
- **Forgiveness:** Easy to undo/correct mistakes
- **Clarity:** Always clear what to do next
- **Focus:** Nothing pulls attention from the math problem
- **Delight:** Small moments of satisfaction (step accepted, problem completed)

### Responsive Behavior

**Layout Adaptations:**
- **Landscape Preferred:** Maximum horizontal space for writing
- **Portrait Acceptable:** Vertical stacking of problem and canvas
- **Split Screen Support:** Remains usable when iPad split-screen active
- **Keyboard Dismissal:** If system keyboard appears, provide clear dismiss

**Different Screen Sizes:**
- 12.9" iPad: Spacious workspace, possibly side-by-side problem/canvas
- 10.9" iPad: Balanced layout, standard vertical arrangement
- 9.7" iPad: Compact but functional, careful spacing
- Android tablets: Adapt to aspect ratio variations

### Animation & Feedback

**Purposeful Motion:**
- **Ink rendering:** Smooth, sub-frame latency feel
- **Validation feedback:** Quick bounce or fade-in (150-200ms)
- **Hint appearance:** Gentle slide or fade (250ms)
- **Step acceptance:** Subtle checkmark animation (300ms)
- **Error indication:** Non-punitive shake or highlight (200ms)

**Audio Feedback (Optional/Growth):**
- Subtle click on step acceptance
- Gentle chime on problem completion
- No sounds for errors (avoid negative reinforcement)
- Voice hints (growth feature) should be natural, not robotic

### Accessibility Considerations

- High contrast mode for low vision
- Adjustable line thickness for motor control needs
- Font size controls for problem text
- Colorblind-safe feedback colors
- Screen reader support for hint text
- Adjustable inactivity timeout for different processing speeds

**The Ultimate Test:** A student using this app should feel like they're solving math problems with paper and pencil, but with a brilliant tutor quietly watching who knows exactly when and how to help.

---

## Functional Requirements

Requirements organized by capability area. ⭐ indicates features that directly deliver the "magic moment" experience.

### 1. Problem Presentation & Management

**FR-1.1: Problem Display**
- **Requirement:** Display math problem text at the top of the screen in clear, readable format
- **Acceptance Criteria:**
  - Problem text supports mathematical notation (fractions, exponents, equations)
  - Text remains visible while student works (fixed position or scrollable)
  - Font size is appropriate for tablet viewing distance (16-20pt minimum)
  - Problem persists across app restarts until completed
- **User Value:** Students always see what they're solving
- **Domain Constraint:** Math notation must be pedagogically clear

**FR-1.2: Problem Set Management**
- **Requirement:** Load and present problems from a problem bank
- **Acceptance Criteria:**
  - Problems are categorized by skill/topic (algebra, geometry, etc.)
  - Students can select problems from available sets
  - System tracks which problems are completed vs. in-progress
  - Supports various difficulty levels
- **User Value:** Structured practice aligned with learning goals
- **MVP Note:** Initial version may have hardcoded problem set; database-driven in growth

**FR-1.3: Problem State Persistence**
- **Requirement:** Save and restore problem state if app is interrupted
- **Acceptance Criteria:**
  - If student exits mid-problem, return to exact state on relaunch
  - All handwritten work preserved
  - Hint history maintained
  - Option to start fresh or continue saved work
- **User Value:** No lost work due to interruptions
- **Domain Constraint:** COPPA/FERPA-compliant storage

### 2. Handwriting Input & Canvas ⭐

**FR-2.1: Stylus Input Canvas**
- **Requirement:** Provide high-performance handwriting canvas with stylus support
- **Acceptance Criteria:**
  - Stylus-to-ink latency <100ms (perceived as instant)
  - Pressure sensitivity affects line thickness
  - Palm rejection prevents unintended marks
  - Works with Apple Pencil (iOS) and S-Pen/Wacom stylus (Android)
  - Smooth ink rendering without jagged lines
- **User Value:** Natural writing experience like paper
- **Technical Constraint:** May require native modules beyond React Native
- **Magic Thread:** ⭐ Core to the invisible technology experience

**FR-2.2: Multi-Color Writing**
- **Requirement:** Support multiple ink colors for student expression
- **Acceptance Criteria:**
  - Minimum 3 colors available (black, blue, red or similar)
  - Simple color picker UI (toolbar or palette)
  - Color selection persists within session
  - Color has no impact on recognition accuracy
- **User Value:** Visual organization, emphasis, work separation
- **MVP Note:** Start with 3 colors; expand in growth

**FR-2.3: Eraser Tool**
- **Requirement:** Provide eraser functionality for corrections
- **Acceptance Criteria:**
  - Toggle button to switch between pen and eraser mode
  - On supported devices, flip stylus activates eraser
  - Erases stroke-by-stroke (vector erasing), not pixel-by-pixel
  - Clear visual indication when in eraser mode
  - Easy return to writing mode
- **User Value:** Easy corrections, low-stakes exploration
- **UX Constraint:** Must feel forgiving, not punitive

**FR-2.4: Guided Line Structure ⭐**
- **Requirement:** Provide visual guides that structure the solution process
- **Acceptance Criteria:**
  - Horizontal guide lines indicate where to write each step
  - Lines are visible but not distracting (subtle color/opacity)
  - Spacing between lines accommodates typical mathematical notation
  - Minimum 5-7 guide lines visible in viewport
  - Lines scroll if more steps needed
- **User Value:** Encourages clear, step-by-step problem solving
- **Magic Thread:** ⭐ Structures thinking process, connects to pedagogical goals

**FR-2.5: Automatic Line Splitting**
- **Requirement:** Automatically detect and separate handwritten lines as distinct steps
- **Acceptance Criteria:**
  - System identifies when student moves to next guide line
  - Each line becomes a distinct step for validation
  - Student can also manually trigger "check this step"
  - Line boundaries shown visually after detection
- **User Value:** Seamless step-by-step validation
- **Magic Thread:** ⭐ Enables real-time tutoring without breaking flow

### 3. Math Recognition & Validation ⭐

**FR-3.1: Handwriting-to-Math Conversion**
- **Requirement:** Convert handwritten mathematical expressions to symbolic form
- **Acceptance Criteria:**
  - Recognizes numbers, variables, operators (+, -, ×, ÷, =)
  - Handles fractions, exponents, radicals, parentheses
  - Recognition accuracy >95% for clear handwriting
  - Confidence scoring for ambiguous characters
  - Conversion occurs on line submission
- **User Value:** Enables intelligent validation of student work
- **Technical Constraint:** Uses CameraMath API or similar
- **Magic Thread:** ⭐ Foundation for the intelligent tutoring

**FR-3.2: Step Correctness Validation ⭐**
- **Requirement:** Validate whether each mathematical step is correct
- **Acceptance Criteria:**
  - Compare student's step to mathematically valid transformations
  - Detect algebraic errors, arithmetic mistakes, invalid operations
  - Validation completes in <500ms
  - Returns binary correct/incorrect + error type
  - Handles multiple solution paths (not just one "right way")
- **User Value:** Immediate feedback on mathematical validity
- **Technical Constraint:** External math solver API (CameraMath preferred)
- **Domain Constraint:** Must accept pedagogically valid alternative approaches
- **Magic Thread:** ⭐ First dimension of dual validation

**FR-3.3: Step Usefulness Validation ⭐**
- **Requirement:** Assess whether a correct step moves the solution forward
- **Acceptance Criteria:**
  - Detect steps that are correct but don't progress toward solution
  - Example: "2x + 3 = 7" → "2x + 3 + 1 = 8" (correct but not useful)
  - Provide gentle feedback: "This is correct, but does it help you solve?"
  - Allow student to continue or reconsider
  - Validation completes with correctness check (<500ms total)
- **User Value:** Teaches strategic problem-solving, not just mechanical steps
- **Domain Constraint:** Aligned with teaching mathematical thinking
- **Magic Thread:** ⭐ Second dimension of dual validation - the unique insight

**FR-3.4: Solution Progress Tracking**
- **Requirement:** Track proximity to complete solution
- **Acceptance Criteria:**
  - Determine if student has reached final answer
  - Recognize solution even if additional simplification possible
  - Provide completion feedback when solution reached
  - Store solution path for analytics
- **User Value:** Clear endpoint, sense of accomplishment
- **Domain Constraint:** Accept equivalent forms (e.g., x=2 vs 2=x)

### 4. Intelligent Tutoring & Hints ⭐

**FR-4.1: Graduated Hint System ⭐**
- **Requirement:** Provide three-level graduated hints that scaffold learning
- **Acceptance Criteria:**
  - **Level 1 - Concept Cue:** General direction without specifics
    - Example: "What operation might help isolate the variable?"
    - Activates prior knowledge
  - **Level 2 - Directional Hint:** Suggests specific strategy
    - Example: "Try subtracting 3 from both sides"
    - Provides approach without full answer
  - **Level 3 - Micro Next Step:** Very specific but not complete reveal
    - Example: "If you subtract 3 from both sides, what do you get?"
    - Minimal reveal, student still does the work
  - Hints progress 1 → 2 → 3 only if student requests or continues struggling
  - Never reveal complete solution
  - Hint text uses encouraging, growth mindset language
- **User Value:** Just-right help that promotes learning, not dependence
- **Domain Constraint:** Aligned with scaffolding theory and productive struggle
- **Magic Thread:** ⭐ The heart of the tutoring experience

**FR-4.2: Inactivity Detection & Tip Triggering**
- **Requirement:** Detect when student is stuck and offer assistance
- **Acceptance Criteria:**
  - Monitor time since last stroke or step submission
  - After 30-45 seconds of inactivity, offer Level 1 hint
  - Student can dismiss or accept hint
  - Does not trigger during normal thinking pauses (first 30 seconds)
  - Inactivity threshold configurable in settings (accessibility)
- **User Value:** Proactive help prevents frustration and abandonment
- **UX Constraint:** Patient timing, not nagging

**FR-4.3: Error-Triggered Hints**
- **Requirement:** Provide targeted hints when student submits incorrect step
- **Acceptance Criteria:**
  - Incorrect step triggers hint relevant to the specific error
  - Hint addresses error type (arithmetic, algebraic, conceptual)
  - Starts at Level 1 unless repeated similar error (then Level 2)
  - Student can request escalation to next hint level
  - Hint appears without blocking student's ability to retry
- **User Value:** Learn from mistakes with specific guidance
- **Domain Constraint:** Error categorization aligns with math pedagogy

**FR-4.4: Hint Context Awareness**
- **Requirement:** Generate hints based on problem type and student's work history
- **Acceptance Criteria:**
  - Hints reference current problem context
  - Consider student's previous steps in current problem
  - Adapt language to problem difficulty level
  - Track which hint types are most effective per student (analytics)
- **User Value:** Personalized, relevant guidance
- **Growth Feature:** Advanced personalization based on student profile

**FR-4.5: "Correct But Not Useful" Nudge ⭐**
- **Requirement:** Gently guide student when step is mathematically correct but doesn't progress solution
- **Acceptance Criteria:**
  - Accept the step (show checkmark)
  - Display gentle nudge message: "This is correct, but does it get you closer to solving for x?"
  - Student can continue down that path or reconsider
  - Nudge is non-blocking, encouraging tone
  - Does not count as an error
- **User Value:** Teaches strategic thinking without punishment
- **Magic Thread:** ⭐ Unique feature of dual validation system

### 5. Feedback & Student Response

**FR-5.1: Visual Step Feedback**
- **Requirement:** Provide clear visual feedback for each submitted step
- **Acceptance Criteria:**
  - **Correct & Useful:** Green checkmark or positive indicator
  - **Correct But Not Useful:** Checkmark + gentle highlight + nudge text
  - **Incorrect:** Red indicator or border + hint triggered
  - Feedback appears within 500ms of submission
  - Animation is subtle, non-punitive
  - Color choices are colorblind-safe
- **User Value:** Instant clarity on step validity
- **UX Constraint:** Encouraging, not judgmental presentation

**FR-5.2: Solution Completion Celebration**
- **Requirement:** Acknowledge when student successfully completes problem
- **Acceptance Criteria:**
  - Detect final correct step that solves problem
  - Display completion message with positive reinforcement
  - Show summary: number of steps, hints used, time taken (optional)
  - Option to review solution or move to next problem
  - Store completion data to cloud
- **User Value:** Sense of accomplishment, closure
- **UX Constraint:** Celebration, not gamification

### 6. Data Storage & Analytics

**FR-6.1: Cloud Storage of Attempts ⭐**
- **Requirement:** Store every problem attempt with complete interaction history
- **Acceptance Criteria:**
  - Save per attempt:
    - Problem ID and text
    - All handwritten lines (strokes + recognized text)
    - Validation outcomes (correct/incorrect/useful)
    - Hints displayed and timing
    - Completion status and time
    - Timestamps for all interactions
  - Data syncs to cloud in real-time or on step completion
  - Zero data loss (local persistence + cloud backup)
  - Data format supports future analytics
- **User Value:** Enables teacher oversight, learning analytics, research
- **Domain Constraint:** COPPA/FERPA compliant storage
- **Magic Thread:** ⭐ Foundation for guide/teacher features

**FR-6.2: Student Session Management**
- **Requirement:** Track and manage student sessions and profiles
- **Acceptance Criteria:**
  - Student login or device-based identification
  - Session persistence across app restarts
  - Multi-student support on shared device (optional MVP, required growth)
  - Privacy-compliant authentication (parent consent if under 13)
- **User Value:** Personalized experience, progress tracking
- **Domain Constraint:** Minimal PII collection per COPPA

**FR-6.3: Offline Data Queuing**
- **Requirement:** Queue data locally when offline, sync when connected
- **Acceptance Criteria:**
  - All attempt data saves locally first
  - Background sync when network available
  - Visible sync status indicator
  - No data loss during network interruption
  - Conflict resolution if same problem worked on multiple devices
- **User Value:** Reliable data capture regardless of connectivity
- **Technical Constraint:** Robust offline storage mechanism

### 7. Settings & Configuration

**FR-7.1: Handwriting Preferences**
- **Requirement:** Allow customization of handwriting experience
- **Acceptance Criteria:**
  - Adjustable pen thickness (3 presets: thin, medium, thick)
  - Eraser size options
  - Left-handed mode (if needed for UI layout)
  - Stylus pressure sensitivity on/off
- **User Value:** Personalized writing comfort
- **Accessibility:** Supports motor control needs

**FR-7.2: Accessibility Settings**
- **Requirement:** Provide accessibility customizations
- **Acceptance Criteria:**
  - High contrast mode
  - Font size adjustment for problem text
  - Colorblind-safe color schemes
  - Adjustable inactivity timeout (15s to 60s)
  - Screen reader compatibility for hints
- **User Value:** Inclusive access for diverse learners
- **Domain Constraint:** WCAG compliance

**FR-7.3: Privacy & Data Controls**
- **Requirement:** Transparent privacy controls and data management
- **Acceptance Criteria:**
  - View data collection practices (in-app)
  - Option to delete student data
  - Parent consent management (if under 13)
  - Data export capability
  - Privacy policy accessible
- **User Value:** Trust, transparency, compliance
- **Domain Constraint:** COPPA/FERPA requirements

**FR-7.4: Problem Selection**
- **Requirement:** Allow selection of problem sets and difficulty
- **Acceptance Criteria:**
  - Browse problems by topic/skill
  - Filter by difficulty level
  - View completion status
  - Option to retry previously completed problems
- **User Value:** Student agency, targeted practice

---

**Functional Requirements Summary:**

Total: 24 core functional requirements spanning 7 capability areas

**Magic Moment Requirements** (marked ⭐):
- Handwriting canvas with <100ms latency (FR-2.1)
- Guided line structure (FR-2.4)
- Automatic line splitting (FR-2.5)
- Handwriting-to-math conversion (FR-3.1)
- Dual validation: correctness (FR-3.2) + usefulness (FR-3.3)
- Graduated three-level hints (FR-4.1)
- "Correct but not useful" nudge (FR-4.5)
- Cloud storage of every attempt (FR-6.1)

These eight requirements combine to deliver the core tutoring experience: natural handwriting input, intelligent dual validation, and graduated scaffolding that teaches thinking—not just answers.

---

## Non-Functional Requirements

NFRs that are critical to this product's success. Each requirement includes measurable criteria and rationale for why it matters for an educational handwriting tablet app.

### Performance

**Why It Matters:** The "invisible technology" UX depends entirely on perceived instantaneousness. Lag breaks the natural writing flow and disrupts learning.

**NFR-P1: Stylus Input Latency**
- **Requirement:** Stylus-to-screen ink rendering latency must be imperceptible
- **Metric:** <100ms end-to-end latency (measured from stylus touch to pixel rendered)
- **Target:** <50ms preferred for Apple Pencil on iPad
- **Measurement:** Automated latency testing tools + manual perception testing
- **Impact:** Core to the "paper-like" writing experience
- **Technical Approach:**
  - Use platform-native rendering (PencilKit on iOS, native canvas on Android)
  - Bypass React Native bridge for stylus events if necessary
  - GPU-accelerated rendering via react-native-skia

**NFR-P2: Step Validation Response Time**
- **Requirement:** Math validation (correctness + usefulness) completes rapidly
- **Metric:** <500ms from step submission to feedback display (95th percentile)
- **Target:** <300ms average case
- **Includes:** Handwriting recognition + API call + validation logic + UI update
- **Measurement:** Performance monitoring in production, timing instrumentation
- **Impact:** Maintains learning flow; delays break engagement
- **Technical Approach:**
  - Optimize image processing for recognition
  - Parallel API calls where possible
  - Local caching of common patterns
  - Fallback degradation if API slow

**NFR-P3: App Launch Time**
- **Requirement:** Cold start to usable state is quick
- **Metric:** <3 seconds from tap to problem-ready screen
- **Measurement:** App launch profiling tools
- **Impact:** Student patience, engagement retention
- **Technical Approach:** Lazy loading, optimized bundle size, async initialization

**NFR-P4: Canvas Rendering Performance**
- **Requirement:** Smooth ink rendering without dropped frames
- **Metric:** Maintain 60 FPS (frames per second) during continuous writing
- **Measurement:** Frame rate monitoring during stress testing
- **Impact:** Natural writing feel, no visual stuttering
- **Technical Approach:** Efficient stroke rendering, canvas optimization, GPU acceleration

**NFR-P5: Memory Footprint**
- **Requirement:** App remains performant on older supported devices
- **Metric:** <200MB peak RAM usage during typical session
- **Measurement:** Memory profiling on minimum spec devices (iPad 6th gen, Android equivalent)
- **Impact:** Works on school/organization devices, doesn't slow tablet
- **Technical Approach:** Efficient stroke storage, image cleanup, memory profiling

### Security

**Why It Matters:** Educational apps handling student data face strict privacy regulations (COPPA/FERPA) and high trust requirements from schools and parents.

**NFR-S1: Data Transmission Security**
- **Requirement:** All data transmitted securely between app and cloud
- **Metric:** TLS 1.3 or higher for all network communication
- **Validation:** Security audit, penetration testing
- **Impact:** Protects student data in transit, regulatory compliance
- **Technical Approach:** HTTPS only, certificate pinning, no unencrypted connections

**NFR-S2: Data Storage Security**
- **Requirement:** Student data encrypted at rest, both locally and in cloud
- **Metric:** AES-256 encryption for local storage; cloud provider encryption standards
- **Validation:** Security audit, compliance review
- **Impact:** Protects PII and educational records, FERPA compliance
- **Technical Approach:** iOS Keychain, Android Keystore, encrypted database, AWS/GCP encryption

**NFR-S3: Authentication & Authorization**
- **Requirement:** Secure student authentication without excessive PII collection
- **Metric:** Support device-based auth OR federated auth (school SSO)
- **Validation:** Security review, compliance check
- **Impact:** Minimal PII collection per COPPA, secure access
- **Technical Approach:** Device identifiers, optional OAuth/SAML for schools, no passwords for young students

**NFR-S4: API Security**
- **Requirement:** Secure integration with external math solver API
- **Metric:** API keys encrypted, rate limiting, request validation
- **Validation:** Security testing, API key rotation capability
- **Impact:** Prevent abuse, protect service credentials
- **Technical Approach:** Environment variables, secure key storage, request signing

**NFR-S5: Privacy by Design**
- **Requirement:** Minimal data collection, clear consent, easy deletion
- **Metric:** Only collect data necessary for educational function
- **Validation:** Privacy audit, COPPA compliance review
- **Impact:** Trust, regulatory compliance, ethical data handling
- **Technical Approach:** Data minimization, transparent consent flows, deletion APIs

### Scalability

**Why It Matters:** Must handle growing usage across multiple students and schools without degradation. Cloud storage must be reliable for all attempts.

**NFR-SC1: Concurrent User Support**
- **Requirement:** Backend handles multiple simultaneous students
- **Metric:** Support 1,000+ concurrent active students (MVP), 10,000+ (growth)
- **Measurement:** Load testing, production monitoring
- **Impact:** Multi-school deployment, organization-wide rollout
- **Technical Approach:** Scalable cloud architecture (AWS/GCP), horizontal scaling

**NFR-SC2: Data Storage Capacity**
- **Requirement:** Store complete interaction history for all students
- **Metric:** Support millions of problem attempts without performance degradation
- **Measurement:** Database performance monitoring, query optimization
- **Impact:** Long-term usage, research data, teacher dashboard
- **Technical Approach:** Efficient data schema, indexed queries, archival strategy

**NFR-SC3: API Rate Limit Management**
- **Requirement:** Handle external API rate limits gracefully
- **Metric:** Queue and retry mechanism, graceful degradation if limits hit
- **Measurement:** API usage monitoring, retry success rate
- **Impact:** Uninterrupted student experience despite API constraints
- **Technical Approach:** Request queuing, exponential backoff, caching, alternative API fallback

**NFR-SC4: Offline Capability Degradation**
- **Requirement:** App remains partially functional when offline
- **Metric:** Students can write and save locally; sync when reconnected
- **Measurement:** Offline testing scenarios, sync reliability
- **Impact:** Usable during network outages, rural/mobile scenarios
- **Technical Approach:** Local-first architecture, background sync, conflict resolution

### Accessibility

**Why It Matters:** Educational software must be inclusive. EdTech accessibility is both ethical requirement and regulatory compliance (Section 508, WCAG).

**NFR-A1: Visual Accessibility**
- **Requirement:** Support users with visual impairments
- **Metric:** WCAG 2.1 AA compliance minimum
- **Validation:** Accessibility audit, user testing with visually impaired students
- **Impact:** Inclusive education, legal compliance
- **Technical Approach:**
  - High contrast mode (4.5:1 minimum contrast ratio)
  - Font scaling (support system text size settings)
  - Colorblind-safe palettes
  - VoiceOver/TalkBack support for hints and feedback

**NFR-A2: Motor Control Accessibility**
- **Requirement:** Support users with fine motor control challenges
- **Metric:** Adjustable pen thickness, pressure sensitivity settings, generous touch targets
- **Validation:** User testing with occupational therapists, students with motor challenges
- **Impact:** Inclusive tool for diverse learners
- **Technical Approach:**
  - Configurable stylus sensitivity
  - Larger eraser mode
  - No time-pressured interactions
  - Undo functionality (growth feature)

**NFR-A3: Cognitive Accessibility**
- **Requirement:** Clear, understandable interface for all cognitive levels
- **Metric:** Simple navigation, clear feedback, no overwhelming elements
- **Validation:** User testing across age and ability ranges
- **Impact:** Effective learning for all students
- **Technical Approach:**
  - Minimal UI complexity
  - Clear visual hierarchy
  - Consistent interaction patterns
  - Patient timing (adjustable inactivity timeout)

**NFR-A4: Screen Reader Support**
- **Requirement:** Hint text and feedback accessible via screen readers
- **Metric:** All text content has proper accessibility labels
- **Validation:** VoiceOver/TalkBack testing
- **Impact:** Students with visual impairments can receive guidance
- **Technical Approach:** Semantic HTML/React Native accessibility props, ARIA labels, proper focus management

### Reliability

**Why It Matters:** Educational tools must be dependable. Data loss erodes trust. Crashes disrupt learning.

**NFR-R1: App Stability**
- **Requirement:** App remains stable during extended use
- **Metric:** <0.1% crash rate (crashes per session)
- **Measurement:** Crash analytics (Sentry, Firebase Crashlytics)
- **Impact:** Uninterrupted learning, professional quality
- **Technical Approach:** Comprehensive error handling, crash reporting, regression testing

**NFR-R2: Data Integrity**
- **Requirement:** Zero data loss for student attempts
- **Metric:** 100% of submitted steps persist (local + cloud)
- **Measurement:** Data audit logs, sync verification
- **Impact:** Trust, analytics reliability, teacher visibility
- **Technical Approach:**
  - Write-ahead logging
  - Local persistence before cloud sync
  - Sync verification and retry
  - Data integrity checks

**NFR-R3: Offline Resilience**
- **Requirement:** App handles network interruptions gracefully
- **Metric:** No data loss during connectivity issues; automatic sync on reconnection
- **Measurement:** Network interruption testing, sync success rate
- **Impact:** Reliable in imperfect network conditions
- **Technical Approach:** Offline queue, background sync, connection monitoring

**NFR-R4: External API Failure Handling**
- **Requirement:** Graceful degradation if math solver API unavailable
- **Metric:** User receives clear message; work saved for later validation
- **Measurement:** API failure scenario testing
- **Impact:** App remains usable despite dependency failure
- **Technical Approach:** Timeout handling, fallback messages, queued validation

### Compatibility

**Why It Matters:** Must work across diverse tablet hardware in schools and homes.

**NFR-C1: Platform Version Support**
- **Requirement:** Support older but common tablet OS versions
- **Metric:**
  - iOS/iPadOS 15.0+ (covers iPad 6th gen 2018+)
  - Android 10+ (API level 29+)
- **Validation:** Testing on minimum supported versions
- **Impact:** Broader device compatibility, schools with older tablets
- **Technical Approach:** React Native version selection, polyfills, feature detection

**NFR-C2: Device Screen Size Support**
- **Requirement:** Functional across tablet screen sizes
- **Metric:** Support 9.7" to 12.9" tablets, both orientations
- **Validation:** Testing on various device models
- **Impact:** Works on student's available device
- **Technical Approach:** Responsive layout, adaptive spacing, flexible canvas

**NFR-C3: Stylus Compatibility**
- **Requirement:** Works with various stylus types
- **Metric:**
  - Apple Pencil (1st & 2nd gen)
  - Samsung S-Pen
  - Wacom stylus
  - Generic capacitive stylus (reduced features)
- **Validation:** Testing with each stylus type
- **Impact:** Works with school-provided or consumer styluses
- **Technical Approach:** Platform-specific stylus APIs, graceful feature degradation

**NFR-C4: Browser Compatibility (Future Web Dashboard)**
- **Requirement:** Teacher dashboard (growth feature) works in common browsers
- **Metric:** Chrome, Safari, Firefox, Edge (latest 2 versions)
- **Validation:** Cross-browser testing
- **Impact:** Teacher accessibility
- **Technical Approach:** Modern web standards, progressive enhancement

### Maintainability

**Why It Matters:** Enables iteration, bug fixes, and feature additions. Critical for reusability across Superbuilders projects.

**NFR-M1: Code Modularity**
- **Requirement:** Handwriting and validation components are reusable
- **Metric:** Core canvas and tutoring logic are independent, exportable modules
- **Validation:** Code review, architectural documentation
- **Impact:** Reusable across multiple Superbuilders projects (per spec priority)
- **Technical Approach:**
  - Separate canvas component package
  - Abstracted validation interface
  - Clear API boundaries
  - Comprehensive component documentation

**NFR-M2: Code Quality**
- **Requirement:** Maintainable, documented codebase
- **Metric:**
  - TypeScript with strict mode
  - >80% test coverage for business logic
  - ESLint/Prettier for consistency
- **Validation:** Automated linting, test coverage reports
- **Impact:** Easier debugging, confident refactoring, team collaboration
- **Technical Approach:** Static analysis, automated testing, code reviews

**NFR-M3: Logging & Monitoring**
- **Requirement:** Observable system for debugging and performance tracking
- **Metric:** Structured logging, performance metrics, error tracking
- **Validation:** Log analysis, monitoring dashboard review
- **Impact:** Rapid issue diagnosis, proactive performance management
- **Technical Approach:** Sentry for errors, custom analytics, performance monitoring

**NFR-M4: Documentation**
- **Requirement:** Technical and user documentation
- **Metric:**
  - Architecture documentation
  - API documentation (internal & external)
  - Component usage examples
  - User guide for teachers/parents
- **Validation:** Documentation review, completeness check
- **Impact:** Team onboarding, maintenance, reusability
- **Technical Approach:** Inline code docs, Markdown docs, JSDoc/TSDoc

---

**Non-Functional Requirements Summary:**

**Critical NFRs (Make-or-Break):**
- **Performance:** <100ms stylus latency, <500ms validation (NFR-P1, NFR-P2)
- **Security:** Encryption, COPPA/FERPA compliance (NFR-S1-S5)
- **Reliability:** Zero data loss, <0.1% crash rate (NFR-R2, NFR-R1)
- **Accessibility:** WCAG 2.1 AA compliance (NFR-A1-A4)

**Important NFRs (Competitive Advantage):**
- **Scalability:** 1,000+ concurrent users (NFR-SC1)
- **Compatibility:** iOS 15+, Android 10+, multiple styluses (NFR-C1-C3)
- **Maintainability:** Modular, reusable components (NFR-M1)

These NFRs ensure the app delivers on its promise: a smooth, reliable, secure educational tool that feels like paper but tutors like an expert.

---

## References

**Source Documents:**
- **Project Specification:** Superbuilders - Handwriting Math Project.pdf (Project root)
- **Reference Implementation:** Project Chiron (inspiration and functional benchmark)

**Technical References:**
- **External API:** CameraMath API ($10 free credits for initial testing)
  - Alternative: Wolfram Alpha API (backup option)
  - Excluded: Symbolab (non-responsive vendor)
- **Framework:** React Native (tablet-focused)
- **Canvas Library:** react-native-skia (high-performance rendering)
- **Platform APIs:**
  - iOS: PencilKit for Apple Pencil integration
  - Android: Samsung S-Pen SDK, Wacom stylus protocol

**Compliance Resources:**
- COPPA compliance guidelines (Children's Online Privacy Protection Act)
- FERPA educational records privacy requirements
- WCAG 2.1 AA accessibility standards
- Apple App Store Educational category guidelines
- Google Play Family policies

**Contact:**
- **Product Owner:** Rafal Szulejko (rafal.szulejko@superbuilders.school)
- **Timezone:** UTC+1
- **Slack:** Gauntlet Slack (for urgent matters)

---

## Implementation Planning

### Epic Breakdown Required

This PRD contains 24 functional requirements and 26 non-functional requirements. These must be decomposed into implementable epics and user stories that fit within development sprint contexts.

**Recommended Epic Structure:**

1. **Foundation Epic:** Project setup, React Native configuration, basic navigation
2. **Handwriting Canvas Epic:** Stylus input, multi-color, eraser, guided lines (FR-2.x)
3. **Math Recognition Epic:** Handwriting-to-math conversion, API integration (FR-3.1)
4. **Validation Engine Epic:** Correctness + usefulness checks, progress tracking (FR-3.2-3.4)
5. **Intelligent Tutoring Epic:** Graduated hints, inactivity detection, error triggers (FR-4.x)
6. **Feedback & UX Epic:** Visual feedback, celebrations, animations (FR-5.x)
7. **Data & Cloud Epic:** Cloud storage, session management, offline queuing (FR-6.x)
8. **Settings & Configuration Epic:** Accessibility, preferences, privacy controls (FR-7.x)
9. **Performance & Polish Epic:** Latency optimization, NFR implementation
10. **Testing & QA Epic:** Device testing, accessibility audit, compliance review

### Architecture Planning Next

After epic breakdown, the following architecture decisions require specification:

**Technical Architecture Decisions Needed:**
- Backend architecture (AWS/GCP/Azure selection)
- Database schema for attempt storage
- Authentication/authorization approach
- API integration patterns
- Offline-first data sync strategy
- Canvas rendering architecture (native modules vs. pure React Native)
- State management approach (Redux, MobX, Context, etc.)
- Testing strategy (unit, integration, E2E)

**UX/UI Design Deliverables:**
- Wireframes for primary flows
- Visual design system (colors, typography, components)
- Interaction prototypes for handwriting experience
- Accessibility design specifications
- Animation and timing specifications

**Next Step:** Run `create-epics-and-stories` workflow to break down this PRD into actionable development tasks.

---

## PRD Summary

### Vision
A tablet-first handwriting math tutoring app that delivers the experience of having a patient, expert tutor watching over a student's shoulder - providing real-time dual validation (correctness + usefulness) and graduated hints that teach mathematical thinking, not just mechanical problem-solving.

### The Magic
The "magic moment" happens when a student writes a math step, and within 500ms receives intelligent feedback that validates both the correctness and strategic value of their work, followed by just-right hints that help them discover the solution themselves rather than being told the answer.

### Success Means
Students experiencing productive struggle with just-right guidance - hint escalation rarely reaches Level 3 because students discover solutions with minimal scaffolding. The technology disappears; what remains is effective learning with >95% handwriting accuracy and <100ms stylus latency creating a paper-like experience.

### Core Capabilities
1. **Natural Handwriting:** <100ms stylus latency, guided lines, automatic line splitting
2. **Dual Validation:** Correctness (is it mathematically valid?) + Usefulness (does it progress the solution?)
3. **Graduated Hints:** Three-level escalation (concept cue → directional hint → micro next step)
4. **Complete Tracking:** Cloud storage of every attempt for analytics and teacher oversight
5. **Educational Compliance:** COPPA/FERPA compliant, WCAG 2.1 AA accessible

### MVP Scope
Complete Training Mode with handwriting canvas, dual validation, graduated hints, CameraMath integration, and cloud storage. Focus on smooth tablet experience and reusable components for other Superbuilders projects.

### Growth Path
→ Guide/Teacher dashboard (bidirectional) → Tutorial mode (Direct Instruction) → Assessment mode → Voice tutoring → Adaptive learning engine → Multi-subject expansion

### Key Requirements
- **24 Functional Requirements** across 7 capability areas
- **26 Non-Functional Requirements** across 6 quality categories
- **8 "Magic Moment" Requirements** that deliver the core tutoring experience
- **Critical NFRs:** <100ms stylus, <500ms validation, zero data loss, COPPA/FERPA compliance

### Technology Stack
- **Platform:** React Native (tablet-optimized)
- **Canvas:** react-native-skia + native modules (PencilKit/S-Pen)
- **Math API:** CameraMath (preferred), Wolfram Alpha (backup)
- **Cloud:** AWS/GCP (TBD in architecture phase)
- **Target:** iPadOS 15+, Android 10+, stylus-enabled tablets

### Organizational Priority
Per specification emphasis: **"Prioritize a really nice and smooth tablet experience over implementation of extras so components can be directly brought into multiple Superbuilders projects that need handwriting functionality."**

This PRD delivers that priority through modular architecture requirements (NFR-M1) and focus on core tutoring experience quality over feature breadth.

---

_This PRD captures the essence of the Handwriting Math Tutor: invisible technology enabling visible learning, where students write naturally and discover solutions with intelligent, graduated guidance that teaches thinking - not just answers._

_Created through BMAD Method PRD workflow based on Superbuilders project specification._

**Document Version:** 1.0
**Date:** 2025-11-05
**Author:** BMad
**Status:** Ready for Epic Breakdown

