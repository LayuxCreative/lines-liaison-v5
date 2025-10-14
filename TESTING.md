# Testing Guide

This document provides comprehensive information about testing in the Lines Liaison V5 project.

## Testing Framework

We use **Vitest** as our testing framework along with **Testing Library** for component testing.

### Key Dependencies

- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `jsdom` - DOM environment for testing

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  }
});
```

### Test Setup (`src/test/setup.ts`)

The setup file configures:
- Testing Library matchers
- Environment variables
- Supabase client mocks
- Browser API mocks (matchMedia, IntersectionObserver, ResizeObserver)

## Writing Tests

### Component Testing Structure

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ComponentName from '../ComponentName';

// Mock external dependencies
vi.mock('../dependency', () => ({
  default: () => <div>Mocked Component</div>
}));

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Mocking Guidelines

1. **External Libraries**: Mock Supabase, React Router, etc.
2. **Child Components**: Mock complex child components to isolate tests
3. **Browser APIs**: Mock APIs not available in jsdom environment

### Test File Organization

```
src/
├── components/
│   └── dashboard/
│       ├── ComponentName.tsx
│       └── __tests__/
│           └── ComponentName.test.tsx
```

## Available Test Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- ComponentName.test.tsx

# Run tests in watch mode
npm test -- --watch
```

## Current Test Coverage

### Tested Components

- ✅ `DatabaseStatusWidget` - Database connection status monitoring
- ✅ `FileUploadModal` - File upload interface
- ✅ `FileViewer` - File viewing and management
- ✅ `ProjectCard` - Project information display

### Test Categories

1. **Rendering Tests**: Verify components render without errors
2. **Props Tests**: Test component behavior with different props
3. **Interaction Tests**: Test user interactions and event handling
4. **State Tests**: Test component state management
5. **Integration Tests**: Test component integration with contexts

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good - tests behavior
expect(screen.getByText('Submit')).toBeInTheDocument();

// ❌ Bad - tests implementation
expect(component.state.isSubmitting).toBe(false);
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good
it('displays error message when form submission fails')

// ❌ Bad
it('handles error')
```

### 3. Mock External Dependencies

```typescript
// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  })
}));
```

### 4. Test Edge Cases

- Empty states
- Loading states
- Error states
- Missing props
- Invalid data

### 5. Keep Tests Focused

Each test should verify one specific behavior or outcome.

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure correct import paths and exports
2. **Mock Issues**: Verify mocks match the actual component structure
3. **Async Operations**: Use `waitFor` for async operations
4. **Context Providers**: Wrap components with necessary providers

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run single test file with debugging
npm test -- ComponentName.test.tsx --reporter=verbose
```

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Increase test coverage to 90%+
- [ ] Add visual regression testing
- [ ] Implement performance testing
- [ ] Add accessibility testing