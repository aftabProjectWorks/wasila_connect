# Skill: Core Engineering

## Purpose

Build maintainable, testable production-quality software.

## Rules

- Inspect existing code before editing.
- Prefer small changes.
- Keep modules cohesive.
- Avoid unnecessary abstractions.
- Avoid premature microservices.
- Use clear naming.
- Keep business logic out of UI components.
- Keep financial calculations centralized.
- Never duplicate authoritative business rules.

## Required behavior

Before coding:

1. Identify affected modules.
2. Identify existing interfaces.
3. Identify database impact.
4. Identify security impact.
5. Identify tests required.

After coding:

1. Run formatting.
2. Run type checks.
3. Run tests.
4. Inspect the diff.
5. Update documentation if behavior changed.

## Never

- delete unrelated code
- rewrite working modules unnecessarily
- silently change business behavior
- invent missing requirements
- commit secrets