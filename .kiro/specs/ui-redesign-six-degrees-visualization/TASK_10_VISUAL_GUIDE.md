# Task 10: Search Input - Visual Guide

## Component States

### 1. Initial State (Idle)
```
┌─────────────────────────────────────────────────────────────┐
│ SEARCH                                                       │
│ Describe the gap you are trying to cross.                   │
│ Keep it plain. The graph is only useful if the problem      │
│ statement is specific.                                       │
│                                                              │
│ [AI SaaS founder] [Operator to founder] [Japan to global]   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Describe the challenge, transition, or person-shaped │   │
│ │ gap you are trying to cross...                       │   │
│ │                                                       │   │
│ │                                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [Future Self]  [Comrade]  [Guide]  [Any path ✓]            │
│                                                              │
│ [Calculate your destiny]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. With Input + Suggestions
```
┌─────────────────────────────────────────────────────────────┐
│ SEARCH                                                       │
│ Describe the gap you are trying to cross.                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ I want to start a company                            │   │
│ │                                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ⚠️ SUGGESTIONS                                              │
│ • Consider adding your industry or field                    │
│ • Mention your current stage or position                    │
│ • Add more context for better matches                       │
│                                                              │
│ [Future Self]  [Comrade]  [Guide]  [Any path ✓]            │
│                                                              │
│ [Calculate your destiny]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. Validation Error
```
┌─────────────────────────────────────────────────────────────┐
│ SEARCH                                                       │
│ Describe the gap you are trying to cross.                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ short                                                 │   │ (RED BORDER)
│ │                                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│ ❌ Please provide more detail (at least 10 characters)      │
│                                                              │
│ [Future Self]  [Comrade]  [Guide]  [Any path ✓]            │
│                                                              │
│ [Calculate your destiny]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 4. Loading State (Calculating Destiny)
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                        ◉◉◉                                  │
│                      ◉     ◉                                │
│                     ◉   ⟳   ◉                               │
│                      ◉     ◉                                │
│                        ◉◉◉                                  │
│                                                              │
│              Mapping the constellation...                    │
│              This may take a moment                          │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Implemented

### ✅ Input Validation
- Minimum 10 characters
- Maximum 500 characters
- Non-empty validation
- Real-time error clearing

### ✅ Smart Refinements
- Suggests adding industry
- Suggests adding stage/position
- Suggests more context for short inputs
- Only shows when relevant

### ✅ Target Type Selection
- 4 options with clear descriptions
- Visual selection state
- Easy to switch between types

### ✅ Example Prompts
- 3 pre-written examples
- One-click to populate
- Helps guide user input

### ✅ Custom Loading Animation
- Three-layer animated design
- No generic spinners
- Feels intentional and meaningful

### ✅ Destiny-Themed Messages
Cycles through:
1. "Calculating your path..."
2. "Mapping the constellation..."
3. "Tracing the threads of connection..."
4. "Discovering hidden bridges..."
5. "Aligning the stars..."

## User Flow

```
1. User lands on page
   ↓
2. Sees example prompts → Can click to populate
   ↓
3. Types their challenge
   ↓
4. Sees refinement suggestions (if applicable)
   ↓
5. Selects target type (Future Self, Comrade, Guide, Any)
   ↓
6. Clicks "Calculate your destiny"
   ↓
7. Validation runs
   ├─ Error? → Shows error message
   └─ Valid? → Shows loading animation
              ↓
              Cycles through destiny messages
              ↓
              Search completes
```

## Design Principles Applied

### 🎯 Meaningful Language
- "Calculate your destiny" not "Search"
- "Gap you are trying to cross" not "What are you looking for"
- Destiny-themed loading messages

### 🎨 Visual Hierarchy
- Clear section headers
- Grouped related elements
- Consistent spacing and borders

### 💫 Smooth Interactions
- Transitions on hover
- Error states with visual feedback
- Loading animation that maintains engagement

### 🚀 User Guidance
- Example prompts
- Refinement suggestions
- Clear error messages
- Descriptive placeholders

## Technical Implementation

### React Hooks Used
- `useState`: Managing validation, refinements, messages
- `useEffect`: Cycling messages, generating refinements

### Validation Logic
```typescript
const validateInput = (value: string): string | null => {
  if (!value.trim()) return 'Please describe your challenge';
  if (value.trim().length < 10) return 'Please provide more detail';
  if (value.trim().length > 500) return 'Please keep it under 500 characters';
  return null;
};
```

### Refinement Generation
```typescript
const generateRefinements = (value: string): string[] => {
  const refinements: string[] = [];
  if (!value.includes('industry')) {
    refinements.push('Consider adding your industry or field');
  }
  if (!value.includes('stage')) {
    refinements.push('Mention your current stage or position');
  }
  if (value.length < 50) {
    refinements.push('Add more context for better matches');
  }
  return refinements;
};
```

### Message Cycling
```typescript
useEffect(() => {
  if (isSearching) {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % DESTINY_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }
}, [isSearching]);
```

## Test Coverage

✅ 20 tests, all passing
- Input validation (5 tests)
- Refinement suggestions (4 tests)
- Target type selection (3 tests)
- Example prompts (2 tests)
- Loading state (3 tests)
- Form submission (3 tests)

## Accessibility

- Semantic HTML
- Clear focus states
- Descriptive placeholders
- Error messages associated with inputs
- Keyboard navigable

## Performance

- Minimal re-renders
- Efficient state updates
- Cleanup of intervals
- No memory leaks
