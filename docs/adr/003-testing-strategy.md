# ADR 002: Testing Strategy

## Status
Accepted

## Context
Ensuring the reliability and accuracy of the Hairlan International ERP is paramount, given its role in managing production, finances, and payroll. A structured testing approach is necessary to maintain high code quality and prevent regressions.

## Decision
We have adopted a multi-layered testing strategy:

### 1. Unit Testing
- **Scope**: Individual functions, hooks, and utility classes.
- **Tooling**: Vitest.
- **Coverage Requirement**: 90% line coverage, 85% branch coverage.
- **Focus**: Edge cases (nulls, empty strings, boundary values), asynchronous logic, and business rule validation (e.g., payroll calculations, wastage thresholds).

### 2. Integration Testing
- **Scope**: API routes and complex component interactions.
- **Tooling**: Vitest with MSW (Mock Service Worker) for API mocking.
- **Focus**: Data flow between components, API contract validation, and database interactions (via Prisma mocks).

### 3. End-to-End (E2E) Testing
- **Scope**: Critical user journeys.
- **Tooling**: Playwright.
- **Focus**: Happy paths (e.g., creating a procurement, approving a daily record) and critical failure modes.

### 4. Visual Regression Testing
- **Scope**: UI consistency across breakpoints.
- **Tooling**: Playwright screenshots.
- **Focus**: Ensuring the responsive design remains intact across the breakpoint matrix (320px to 1920px+).

## Consequences
- Higher initial development time due to test authoring.
- Significantly reduced risk of regressions during future updates.
- Improved documentation through executable test cases.
- Greater confidence in the accuracy of financial and production data.
