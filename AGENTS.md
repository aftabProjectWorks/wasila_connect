# AGENTS.md

## Project

This repository contains a modular web application for managing members, groups, cards, policies, activities, payments, financial records, settlements, and administrative operations.

The application must be simple for non-technical users while maintaining strong security, auditability, and financial consistency.

---

# 1. Core Architecture

Use a modular monolith.

## Frontend

- Next.js
- TypeScript
- Responsive web UI
- Mobile-first member experience
- Accessible UI
- Reusable components

## Backend

- Python
- FastAPI
- Modular service architecture
- Explicit business logic
- Strong validation
- Automated tests

## Platform

- Supabase PostgreSQL
- Supabase Authentication
- Google authentication
- PostgreSQL Row Level Security
- Supabase Storage where required

## Deployment

Maintain separate:

- development
- staging
- production

Do not mix environments.

---

# 2. Architectural Principle

Do NOT build microservices unless explicitly requested.

Use:

    One application
        ↓
    Modular backend
        ↓
    PostgreSQL

Modules must have clear boundaries so they can be separated later if required.

---

# 3. Source of Truth

Before implementing a feature:

1. Read V1_REQUIREMENTS.md.
2. Read relevant business rules.
3. Read ARCHITECTURE.md.
4. Check existing implementation.
5. Check existing tests.
6. Identify dependencies.
7. Implement only what is specified.

Never invent financial or authorization rules.

If a requirement is ambiguous and affects money, permissions, security, identity, or data ownership:

STOP and identify the ambiguity.

Do not silently choose a business rule.

---

# 4. Business Entities

The primary entities include:

- Member
- Group
- Group Lead
- Association
- Card
- Card Template
- Card Template Version
- Policy
- Policy Version
- Activity
- Payment
- Ledger Account
- Ledger Entry
- Settlement
- Refund
- Eligibility Rule
- Eligibility Decision
- Audit Event

Keep identity, relationships, and financial records conceptually separate.

---

# 5. Identity

Google authentication identifies the application user.

The system generates the Member ID.

A normal member cannot join without an existing association.

Initial association is authorized only by the Group Lead.

Normal onboarding does not require manual Admin approval.

Do not use email address as the permanent business identity.

Email may change.

Member ID must remain stable.

---

# 6. Roles

## Admin

Admin controls:

- platform configuration
- groups
- policies
- card templates
- eligibility rules
- financial oversight
- settlements
- audit
- system configuration

## Group Lead

Lead manages:

- group activity
- member activity
- group health
- member assistance
- permitted activity approvals

Lead does NOT automatically gain ownership of another member's account or money.

## Member

Member controls their own:

- account
- profile
- cards
- activities
- permitted payment actions
- requests

## System

The system:

- validates rules
- evaluates eligibility
- calculates policy outcomes
- records events
- generates recommendations
- manages temporary group transitions
- enforces limits

---

# 7. Group Lead Succession

If a Lead becomes unavailable, leaves, or becomes ineligible:

1. Group enters TRANSITIONING state.
2. System temporarily manages the group.
3. System evaluates eligible members.
4. System recommends a candidate.
5. Candidate confirms.
6. Admin approves.
7. New Lead becomes active.

Do not automatically grant permanent Lead authority to a member.

Application activity may be used as one eligibility signal.

Do not rely on Gmail online status or continuous device tracking as a primary eligibility mechanism.

---

# 8. Member Independence

An associated member may request independence.

The existing Group Lead generates a one-time verification code.

The member authenticates and provides the required Member ID.

The system verifies the code.

The member can then become independent according to the applicable workflow.

One-time codes must:

- expire
- be single-use
- be securely stored
- be invalidated after successful use
- produce an audit event

---

# 9. Cards

Cards are created from Card Templates.

Card Templates are versioned.

A Card permanently references the applicable template/policy version used at creation.

Never silently rewrite the financial rules of an existing card when Admin changes a template.

New policies should create new versions.

---

# 10. Dynamic Policies

Policies are configurable by Admin.

Possible parameters include:

- card value
- customer price
- platform/service fee
- required activity/sticks
- activity calculation
- daily limits
- validity
- status zones
- maximum cards
- age/eligibility requirements
- performance requirements
- exit conditions
- exit fees
- refund rules
- closure conditions

Do not hard-code these values into application logic.

Policy evaluation must be version-aware.

---

# 11. Performance and Eligibility

Eligibility may consider policy-defined factors such as:

- age
- activity
- account history
- completed cards
- unresolved obligations
- policy violations
- group participation
- availability
- other explicitly configured criteria

Performance must not become an unexplained hidden financial score.

The system must be able to explain why an eligibility decision was produced.

---

# 12. Financial Architecture

Never treat a database balance as sufficient financial truth.

Maintain a traceable ledger.

Every financial change must have a corresponding record.

Separate:

- customer payment
- card value
- service/platform fee
- activity
- settlement
- refund

The frontend must never determine financial truth.

The backend must calculate and validate financial operations.

Payment provider confirmation must be verified server-side.

---

# 13. Payment Safety

Never trust:

- frontend payment success
- frontend amount
- frontend card balance
- frontend stick count
- frontend authorization claims

Use server-side validation.

Payment webhooks must be idempotent.

A payment provider transaction must not be processed twice.

Refunds must also be idempotent.

---

# 14. Financial Prototype

Development may use simulated/test transactions.

The platform owner's personal savings account must NOT become a hard-coded production assumption.

Before accepting real customer funds, the appropriate payment/custody/business structure must be established.

The codebase must keep payment infrastructure replaceable.

---

# 15. Security

Use defense in depth.

Required layers:

1. Authentication
2. Backend authorization
3. PostgreSQL RLS
4. Input validation
5. Database constraints
6. Audit logging
7. Idempotency
8. Rate limiting where appropriate
9. Secure secret management
10. Security testing

Never rely only on frontend route protection.

---

# 16. Audit

Audit sensitive actions.

Examples:

- policy changes
- group changes
- Lead changes
- member association
- independence conversion
- card creation
- payment events
- refunds
- settlements
- Admin actions
- permission changes

Audit records should identify:

- actor
- action
- target
- timestamp
- relevant before/after state
- request/event identifier
- reason when applicable

---

# 17. UI Philosophy

The member interface must be understandable by a person with very little technical knowledge.

Prefer:

- simple language
- clear actions
- minimal screens
- obvious status
- visual progress
- confirmation before financial actions
- helpful error messages
- mobile-first layouts

Avoid unnecessary:

- technical terminology
- database terminology
- financial jargon
- complex dashboards for ordinary members
- excessive forms

Admin UI may be significantly more detailed.

---

# 18. Financial Confirmation

Before an irreversible or financially significant action, show:

- current state
- amount
- applicable fee
- expected result
- remaining amount
- relevant policy
- confirmation action

Never surprise users with a calculated financial consequence after confirmation.

---

# 19. Coding Standards

Every implementation must include:

- type safety
- validation
- error handling
- tests
- logging where appropriate
- documentation for non-obvious logic

Do not duplicate business rules across frontend and backend.

Backend is authoritative.

Frontend mirrors rules only for user experience.

---

# 20. Database Rules

Prefer database constraints for invariants.

Use:

- foreign keys
- unique constraints
- check constraints
- indexes
- transactions
- RLS

Do not rely exclusively on application code for data integrity.

---

# 21. Testing Requirement

A feature is not complete when the code works once.

A feature is complete when:

- normal case works
- invalid input fails correctly
- unauthorized access fails
- duplicate requests are handled
- concurrent requests are handled
- relevant edge cases are tested
- financial calculations are tested
- audit behavior is tested

---

# 22. AI Agent Behavior

Agents must:

1. Inspect before modifying.
2. Read relevant documentation.
3. Make minimal changes.
4. Preserve existing functionality.
5. Add tests.
6. Run tests.
7. Report changed files.
8. Report assumptions.
9. Report unresolved issues.
10. Never fabricate successful integrations.

Do not rewrite the entire project for a small feature.

Do not create duplicate implementations.

Do not introduce a new framework without justification.

---

# 23. Definition of Done

A feature is DONE only when:

- requirements are satisfied
- implementation exists
- tests exist
- security is considered
- authorization is tested
- UI is usable
- error states exist
- documentation is updated
- migrations are included where needed
- no known regression exists

---

# 24. Human Approval Required

The human project owner must approve changes involving:

- financial rules
- fees
- refunds
- payment custody
- eligibility criteria
- policy semantics
- role permissions
- data deletion
- production credentials
- production deployment
- legal/compliance assumptions

Agents implement decisions.

Agents do not independently create business policy.