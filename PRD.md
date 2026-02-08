# **PRD: Fretboard Mastery Pro**
**Version:** 2.0  
**Date:** January 2026  
**Status:** Phase 2 - User Testing & Future Features  

---

## **1. Executive Summary**

### **Project Status**
The MVP (Phase 1) has been successfully completed with all P0 features implemented:
- ✅ **Configurable Interactive Fretboard** (5/5 tasks)
- ✅ **Highlight Zone System** (5/5 tasks)
- ✅ **Note Identification Quiz Mode** (5/5 tasks)
- ✅ **Interval/Chord Tone Quiz Mode** (5/5 tasks)
- ✅ **Application State & Configuration** (5/5 tasks)

**Total: 25/25 MVP tasks complete | 1522 unit tests passing**

### **Phase 2 Goals**
1. **User Testing & Refinement** - Gather feedback manually through direct conversations and observation
2. **Adaptive Learning Algorithm** - Intelligent question selection based on user performance
3. **User Accounts** - Persistent progress tracking across devices

### **Success Criteria - Phase 2**
1. User testing feedback documented and incorporated through manual testing sessions
2. Adaptive algorithm demonstrably improves learning outcomes
3. User accounts enable seamless cross-device experience
4. Codebase maintains high test coverage (>90%)

---

## **2. Current State Assessment**

### **Completed MVP Features**

| Feature | Description | Tests |
|---------|-------------|-------|
| Fretboard Display | CSS Grid-based responsive fretboard with viewport controls | 67 |
| Highlight Zones | Arbitrary note selection with visual feedback & interaction constraints | 316 |
| Note Quiz | Complete quiz flow with question generation, validation, feedback | 747 |
| Interval Quiz | Root note highlighting, interval calculations, compound interval support | 1100 |
| App State | Zustand store with persistence, settings UI, routing | 1522 |

### **Architecture Ready for Phase 2**
The MVP architecture was explicitly designed for these future features:
- **Adaptive Learning:** Task timing already implemented, user progress structure defined
- **Multi-Instrument:** Instrument class abstracted, supports 7 instrument types
- **User Accounts:** State persistence system extendable to backend, anonymous IDs ready

---

## **3. Phase 2A: User Testing & Refinement**

### **Objective**
Refine the MVP based on initial user feedback, focusing on viewport interaction, visual alignment, and UI cleanup.

**Priority:** P0 (Required before Phase 2B)

### **Refinement Tasks**

#### **UTR-001: Viewport Resize Handles**
Replace the Viewport Settings panel with intuitive drag handles for resizing the viewport.

- Add draggable resize handles on the left and right sides of the fretboard
- Handles should visually integrate with fretboard styling
- Dragging left handle adjusts start fret (panning)
- Dragging right handle adjusts visible fret count
- **AC:** Users can resize viewport by dragging handles; no settings panel needed

#### **UTR-002: Viewport Position Slider**
Add a stylized slider below the fretboard for viewport positioning.

- Create horizontal slider matching fretboard color palette and aesthetic
- Slider controls the viewport start position (panning)
- Slider track shows full fret range; thumb shows visible window
- **AC:** Slider allows smooth panning; visual style matches fretboard

#### **UTR-003: Vertical Alignment Fix**
Fix misalignment between fret numbers, note highlights, and fret markers.

- Fret markers have correct vertical centering
- Align fret numbers to same vertical axis as fret markers
- Align note highlights (zone highlights) to same vertical axis as fret markers
- **AC:** All elements visually aligned on the same vertical center

#### **UTR-004: String Overhang Fix (17+ Frets)** 
Fix strings not extending past the rightmost fret when displaying 17+ frets.

- Strings should always extend slightly past the last visible fret
- Ensure consistent string overhang regardless of visible fret count
- **AC:** Strings visibly extend past rightmost fret at all viewport sizes

#### **UTR-005: Remove Unnecessary Panels**
Remove the "Selected Note Panel" and "Viewport Settings Panel" from the home page.

- Remove ViewportControls component usage from HomePage
- Remove click feedback panel showing selected note details
- Keep zone testing controls for development purposes
- **AC:** HomePage shows only fretboard, display controls, and zone testing (for now)

---

## **4. Phase 2B: Adaptive Learning Algorithm**

### **Objective**
Implement intelligent question selection that adapts to individual user performance, accelerating learning by focusing on weak areas while maintaining engagement.

**Priority:** P1 (Core differentiation feature)
**Dependencies:** UTR-001, UTR-002 (need baseline feedback from manual testing)

### **Algorithm Design**

#### **Core Concept: Spaced Repetition + Performance Weighting**
- Questions are selected based on probability weights
- Weights increase for incorrect answers, decrease for correct
- Time decay brings weights back up for review
- Difficulty progression unlocks harder content as mastery demonstrated

#### **Data Model**

```typescript
interface UserPerformance {
  // Per pitch class (12 entries for C through B)
  pitchClassStats: Map<PitchClass, PitchClassPerformance>;
  
  // Per interval (all simple + compound intervals)
  intervalStats: Map<IntervalShortName, IntervalPerformance>;
  
  // Per fretboard region (CAGED positions, etc.)
  regionStats: Map<RegionId, RegionPerformance>;
  
  // Session-level data
  sessionHistory: SessionSummary[];
  
  // Computed metrics
  overallAccuracy: number;
  masteryLevel: MasteryLevel;
  lastPracticeDate: Date;
}

interface ItemPerformance {
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptDate: Date;
  lastCorrectDate: Date;
  currentStreak: number;
  longestStreak: number;
  averageResponseTime: number;
  difficultyRating: number; // 1-5, adjusted based on performance
  selectionWeight: number; // Computed probability weight
}
```

### **Algorithm Tasks**

#### **ALA-001: Performance Tracking System**
- Create `UserPerformance` data structure
- Implement performance recording on each answer
- Calculate rolling statistics (last 10, last 50, all-time)
- **AC:** All answer attempts stored with timing and context

#### **ALA-002: Selection Weight Calculator**
- Implement spaced repetition weight formula
- Factor in: accuracy, time since last attempt, streak, difficulty
- Normalize weights for probability distribution
- **AC:** Weight formula produces valid probability distribution

#### **ALA-003: Adaptive Question Generator**
- Replace random selection with weighted selection
- Implement difficulty progression gates
- Add "review mode" for high-weight items
- **AC:** Question selection demonstrably different from random

#### **ALA-004: Difficulty Calibration**
- Define difficulty tiers for notes (natural → sharps/flats → all)
- Define difficulty tiers for intervals (P5,P4 → M3,m3 → all)
- Define difficulty tiers for fretboard regions (open → middle → all)
- **AC:** Difficulty unlocks gate harder content appropriately

#### **ALA-005: Performance Visualization**
- Heat map showing pitch class mastery
- Progress chart over time
- Weak area identification
- **AC:** Users can see their progress and focus areas

#### **ALA-006: Algorithm Tuning**
- A/B testing framework for algorithm parameters
- Feedback loop for algorithm refinement
- Manual override for users who want specific practice
- **AC:** Algorithm parameters adjustable without code changes

### **Algorithm Parameters (Initial Values)**

| Parameter | Value | Description |
|-----------|-------|-------------|
| Base weight | 1.0 | Starting weight for new items |
| Incorrect multiplier | 2.5 | Weight increase on wrong answer |
| Correct decay | 0.8 | Weight decay on correct answer |
| Time decay rate | 0.1/day | Daily weight increase for review |
| Mastery threshold | 0.85 | Accuracy needed to reduce difficulty |
| Streak bonus | 0.9^streak | Additional decay for consecutive correct |
| Min weight | 0.1 | Prevents items from never appearing |
| Max weight | 10.0 | Caps weight to prevent fixation |

---

## **5. Phase 2C: User Accounts**

### **Objective**
Enable persistent progress tracking across devices with secure user authentication.

**Priority:** P1 (Enables Phase 2B to be meaningful)
**Dependencies:** ALA-001 (need performance data to sync)

### **Account System Design**

#### **Authentication Strategy**
- **Primary:** Magic link email authentication (no passwords)
- **Secondary:** OAuth (Google, Apple) for convenience
- **Fallback:** Local-only mode continues to work without account

#### **Data Synchronization**
- Sync `UserPerformance` data to cloud
- Conflict resolution: Most recent wins for atomic values, merge for arrays
- Offline support with automatic sync when online

### **Account Tasks**

#### **USR-001: Backend Infrastructure**
- Choose backend: Supabase (recommended) or Firebase
- Set up database schema for user data
- Implement authentication endpoints
- **AC:** Backend accepts and returns user data via API

#### **USR-002: Magic Link Authentication**
- Email input and validation
- Send magic link with secure token
- Token verification and session creation
- Session persistence (refresh tokens)
- **AC:** Users can sign in via email link

#### **USR-003: OAuth Integration**
- Google OAuth setup
- Apple OAuth setup (required for iOS App Store if future app)
- Account linking (OAuth → existing email account)
- **AC:** Users can sign in with Google/Apple

#### **USR-004: Data Synchronization**
- Implement sync protocol
- Handle offline/online transitions
- Conflict resolution logic
- Sync status UI indicator
- **AC:** Data syncs within 5 seconds of going online

#### **USR-005: Account Management UI**
- Sign in/sign out UI
- Account settings page
- Data export (user's data belongs to them)
- Account deletion
- **AC:** Users can manage their account fully in-app

#### **USR-006: Migration Path**
- Detect existing local data on first sign-in
- Offer to merge or replace cloud data
- One-time migration flow
- **AC:** Existing users don't lose progress when creating account

### **Privacy Considerations**
- GDPR compliance: Export and delete functionality
- Minimal data collection: Only what's needed for features
- Clear privacy policy explaining data usage
- No data selling or sharing with third parties

---

## **6. Testing Strategy - Phase 2**

### **Automated Testing**

#### **New Test Categories**
| Category | Description | Target Coverage |
|----------|-------------|-----------------|
| Algorithm Tests | Weight calculations, selection distribution | 100% |
| Sync Tests | Conflict resolution, offline behavior | 90% |
| Auth Tests | Token handling, session management | 100% |
| Integration Tests | Full user flows with backend | 80% |

#### **Performance Benchmarks**
- Algorithm weight calculation: <10ms
- Question selection: <50ms
- Sync operation: <2s
- Auth flow: <5s end-to-end

### **Manual Testing Checklist - Phase 2**

#### **User Testing Validation**
- [ ] Testing session notes documented for all cohorts
- [ ] Feedback patterns identified and categorized
- [ ] Onboarding tour completes without issues (observed)
- [ ] Mobile touch targets all >44px (hands-on verification)

#### **Adaptive Algorithm Validation**
- [ ] Incorrect answers increase question frequency
- [ ] Mastered items appear less frequently
- [ ] Difficulty progression feels natural
- [ ] Performance visualization updates in real-time

#### **Account System Validation**
- [ ] Magic link arrives within 30 seconds
- [ ] OAuth sign-in works on all supported browsers
- [ ] Data syncs correctly across two devices
- [ ] Offline mode works without account
- [ ] Account deletion removes all data

---

## **7. Development Timeline**

### **Phase 2A: User Testing (2-3 weeks)**
| Week | Focus |
|------|-------|
| 1 | UTR-001, UTR-002: Setup testing protocol, begin sessions |
| 2 | Continue user testing sessions, document feedback |
| 3 | UTR-003, UTR-004, UTR-005: Address feedback, implement fixes |

### **Phase 2B: Adaptive Algorithm (3-4 weeks)**
| Week | Focus |
|------|-------|
| 4 | ALA-001, ALA-002: Performance tracking & weights |
| 5 | ALA-003, ALA-004: Question generation & difficulty |
| 6 | ALA-005, ALA-006: Visualization & tuning |
| 7 | Testing and refinement |

### **Phase 2C: User Accounts (3-4 weeks)**
| Week | Focus |
|------|-------|
| 8 | USR-001, USR-002: Backend & magic link |
| 9 | USR-003, USR-004: OAuth & sync |
| 10 | USR-005, USR-006: UI & migration |
| 11 | Testing and refinement |

**Total Phase 2 Estimate: 10-12 weeks**

---

## **8. Future Considerations (Phase 3+)**

### **Features Architected For But Not In Scope**
1. **Audio Recognition** - Use microphone to detect played notes
2. **Multi-Instrument Deep Support** - Bass, ukulele with optimized quiz content
3. **Social Features** - Leaderboards, challenges, sharing
4. **Premium Features** - Advanced statistics, custom zones, export

### **Technical Debt to Address**
- Evaluate CSS-in-JS vs current CSS files approach
- Consider React Server Components if adding SSR
- Review bundle size and lazy loading opportunities

---

## **9. Appendix: Task ID Reference**

### **Phase 2A: User Testing & Refinement**
- UTR-001: Viewport Resize Handles
- UTR-002: Viewport Position Slider
- UTR-003: Vertical Alignment Fix
- UTR-004: String Overhang Fix (17+ Frets)
- UTR-005: Remove Unnecessary Panels

### **Phase 2B: Adaptive Learning Algorithm**
- ALA-001: Performance Tracking System
- ALA-002: Selection Weight Calculator
- ALA-003: Adaptive Question Generator
- ALA-004: Difficulty Calibration
- ALA-005: Performance Visualization
- ALA-006: Algorithm Tuning

### **Phase 2C: User Accounts**
- USR-001: Backend Infrastructure
- USR-002: Magic Link Authentication
- USR-003: OAuth Integration
- USR-004: Data Synchronization
- USR-005: Account Management UI
- USR-006: Migration Path

---

**Document History:**
- v1.0 (November 2024): Initial MVP specification
- v2.0 (January 2026): Phase 2 specification after MVP completion
- [ ] JavaScript disabled - informative message

#### **Musical Accuracy Validation** [CRITICAL]
*Must be verified by someone with music theory knowledge*

✅ **Validation 1: Fretboard Accuracy**
- [ ] Open strings: E2, A2, D3, G3, B3, E4 (scientific pitch notation)
- [ ] 12th fret harmonics match open strings one octave higher
- [ ] All intervals calculated correctly across entire fretboard
- [ ] Enharmonic equivalents treated as correct answers (G# = A♭)

✅ **Validation 2: Interval Calculations**
- [ ] Perfect intervals: P1, P4, P5, P8, P11, P12, P15
- [ ] Major/minor: m2, M2, m3, M3, m6, M6, m7, M7
- [ ] Augmented/diminished: d5, A4, A5, etc.
- [ ] Compound intervals calculated correctly

✅ **Validation 3: Quiz Question Validity**
- [ ] No impossible questions generated (target note outside zone)
- [ ] Questions respect user's note selection (sharps/flats)
- [ ] Interval questions have at least one valid answer in zone
- [ ] Question difficulty distribution feels appropriate

---

## **4. Technical Architecture**

### **Directory Structure**
```
src/
├── core/                    # Business logic (framework-agnostic)
│   ├── music-theory/        # Note, Interval, Scale, Chord classes
│   ├── instruments/         # Instrument, Tuning, Fretboard classes
│   ├── quiz/               # Quiz engines, question generators
│   └── utils/              # Zone, Config, Validation utilities
├── state/                   # State management
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript interfaces
├── components/              # React components
│   ├── fretboard/          # Fretboard visualization
│   ├── quiz/               # Quiz UI components
│   ├── zones/              # Zone visualization/editing
│   ├── settings/           # Settings panels
│   └── shared/             # Reusable UI components
├── hooks/                   # Custom React hooks
├── config/                  # Configuration files
│   ├── colors.ts           # Color schemes
│   ├── defaults.ts         # Default settings
│   └── instruments.ts      # Instrument definitions
└── tests/
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── fixtures/           # Test data
```

### **Key Design Decisions**
1. **Framework Choice**: React + TypeScript + Zustand
   - React: Component reusability, large ecosystem
   - TypeScript: Musical concepts benefit from strong typing
   - Zustand: Simpler than Redux, adequate for MVP complexity

2. **State Management Strategy**
   - Musical state (notes, intervals) immutable
   - UI state (selections, active zones) mutable
   - Clear separation between musical logic and UI

3. **Testing Strategy**
   - Unit tests for all musical logic
   - Integration tests for user flows
   - Manual approval for UI/UX polish

4. **Styling Approach**
   - Tailwind CSS for utility-first styling
   - CSS Custom Properties for dynamic theming
   - Mobile-first responsive design

5. **Build & Deployment**
   - Vite for fast development builds
   - GitHub Actions for CI/CD
   - Netlify/Vercel for hosting

---

## **5. Development Phases**

### **Phase 1: Core Foundation (Week 1-2)**
1. **Week 1**: Musical Core + Fretboard
   - Complete FRT-001 to FRT-005
   - Complete HLZ-001 to HLZ-003
   - Setup project with TypeScript, React, testing

2. **Week 2**: Quiz Engines
   - Complete NQI-001 to NQI-005
   - Complete INT-001 to INT-003
   - Integration testing between components

### **Phase 2: Polish & Configuration (Week 3)**
1. **Week 3**: UI/UX Polish
   - Complete INT-004 to INT-005
   - Complete APP-001 to APP-005
   - Complete HLZ-004 to HLZ-005
   - Manual testing and bug fixes

### **Phase 3: Testing & Launch (Week 4)**
1. **Week 4**: Quality Assurance
   - Complete all automated tests
   - Manual approval testing checklist
   - Performance optimization
   - Documentation

---

## **6. Future Feature Hooks**

### **Built-in Architecture for Phase 2 Features**
1. **Adaptive Learning Algorithm**
   - Task timing already implemented
   - User progress structure defined in state
   - Configuration system ready for threshold tuning

2. **Multi-Instrument Support**
   - Instrument class abstracted
   - Fretboard component instrument-agnostic
   - Configuration system supports instrument definitions

3. **Audio Recognition**
   - Audio context initialization placeholder
   - Microphone permission flow considered
   - Note validation ready for audio input

4. **User Accounts**
   - State persistence system extendable to backend
   - Anonymous user IDs already implemented
   - Progress data structure exportable

---

## **7. Success Metrics for MVP Launch**

### **Technical Metrics**
- [ ] 100% musical logic test coverage
- [ ] < 100ms note click response time
- [ ] < 3 second initial load time
- [ ] 100% passing manual approval tests
- [ ] Zero high-severity bugs open

### **User Experience Metrics**
- [ ] Users can complete quiz without instructions
- [ ] Mobile touch targets > 44px
- [ ] Color contrast ratio > 4.5:1 for all text
- [ ] All interactive elements have clear states

### **Code Quality Metrics**
- [ ] TypeScript strict mode enabled
- [ ] ESLint with strict rules passing
- [ ] All components under 200 lines
- [ ] All functions under 50 lines
- [ ] Documentation for all public APIs

---

## **8. Risk Mitigation**

### **Technical Risks**
1. **Audio API Browser Compatibility**
   - **Mitigation**: Phase 3 feature, can use polyfills
   - **Fallback**: Manual note entry option

2. **Mobile Performance**
   - **Mitigation**: Limit mobile fret count, virtualize rendering
   - **Fallback**: Simplified mobile view option

3. **Music Theory Complexity**
   - **Mitigation**: Extensive unit testing, peer review
   - **Fallback**: Reference known-correct libraries

### **Product Risks**
1. **User Engagement**
   - **Mitigation**: Immediate feedback, clear progression
   - **Fallback**: Add simple scoring system in MVP if needed

2. **Learning Curve**
   - **Mitigation**: Tooltips, guided tour (future)
   - **Fallback**: Video tutorial linked from app

---

## **9. Dependencies & Assumptions**

### **External Dependencies**
- React 18+ (UI framework)
- TypeScript 5+ (type safety)
- Zustand (state management)
- Testing Library (testing utilities)
- Web Audio API (future - Phase 3)

### **Assumptions**
1. Users have basic guitar knowledge (knows what frets/strings are)
2. Modern browser usage (Chrome 90+, Firefox 88+, Safari 14+)
3. Screen readers not required for MVP (aria labels added where possible)
4. No IE11 support required

---

**APPROVALS REQUIRED:**
- [ ] Product Owner: Requirements completeness
- [ ] Lead Developer: Technical feasibility
- [ ] UX Designer: Interaction design approval
- [ ] QA Lead: Testing strategy approval

*This PRD provides complete specification for MVP development. Each task is independently testable and deliverable. The architecture is explicitly designed for the three future features mentioned in the original concept.*