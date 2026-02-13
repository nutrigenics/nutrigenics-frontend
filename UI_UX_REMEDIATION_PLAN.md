# Frontend UI/UX Remediation Plan

## Scope
Strict remediation of role flow correctness, navigation reliability, UX-functional integrity, accessibility, responsiveness, and theme consistency.

## Prioritized TODO List

## P1 - Critical UX/Flow Defects
- [x] Enforce role boundaries for patient routes.
- [x] Keep `/` role-agnostic redirect working for all authenticated users.
- [x] Prevent access to non-functional public onboarding pages by redirecting old onboarding URLs to shared `/onboarding`.
- [x] Remove dead help navigation path (`/help`) by adding a valid route alias.
- [x] Make sidebar and command palette role-aware so users only see valid destinations.
- [x] Fix guest login redirects to valid routes only.
- [x] Wire recipe `min_time` filter from UI to API request params.
- [x] Replace fake auth CTA behavior (`alert`) with non-breaking product feedback.
- [x] Wire Settings "Delete Account" CTA to actual delete flow + confirmation dialog.

## P2 - Accessibility and Interaction Defects
- [x] Replace mouse-only clickable notification rows with keyboard-accessible button semantics.
- [x] Add missing form labels/aria labels in auth flows.
- [x] Restore reliable focus visibility for inputs and textarea controls.
- [x] Fix search stats section layout for small screens (avoid horizontal compression/overflow).
- [x] Add missing aria labels to icon-only controls in chats, recipes, meal plan, analytics, and dashboard widgets.
- [x] Improve keyboard accessibility for expandable dietitian cards in hospital view.

## P3 - Consistency and Product Polish
- [x] Support both WebSocket env names (`VITE_WEBSOCKET_URL`, `VITE_WS_BASE_URL`) for migration safety.
- [x] Normalize misleading appearance controls in Settings (show clear "light only" behavior).
- [x] Follow-up pass for color/typography consistency and tiny text usage.
- [x] Update metadata/favicon/title and content polish in a dedicated branding pass.
- [x] Fix invalid utility class typos (`center-0`, `h-`, `:border-*`) causing silent UI defects.

## P2.5 - Production Hardening
- [x] Remove impure render-time randomness and unstable time calculations in shared UI/auth components.
- [x] Eliminate render-time ref access in AI chat streaming flow.
- [x] Resolve lint-blocking logic defects (including duplicate branch conditions in mock data generation).
- [x] Stabilize lint pipeline to zero errors (warnings remain for progressive cleanup).
- [x] Rework Vite chunk strategy to remove Recharts circular chunk warning and reduce oversized vendor chunk pressure.

## Execution Sequence
1. Routing and role safety.
2. Broken user journeys.
3. Accessibility/responsiveness.
4. Config and consistency.
5. Verification.

## Acceptance Criteria
- No navigation element leads to an invalid route.
- Each role only sees and accesses role-valid routes.
- All critical CTA buttons perform a concrete action or are explicitly disabled with truthful messaging.
- Keyboard users can operate notifications and auth controls.
- Core pages remain usable on mobile widths without horizontal overflow artifacts.
