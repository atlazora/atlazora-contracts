# Atlazora Contracts

Authoritative repository for Atlazora shared executable contracts.

## Scope

- Versioned OpenAPI definitions.
- Shared JSON Schemas.
- Structured and versioned event schemas.
- Shared event envelope contracts.
- Contract validation.
- Compatibility and breaking-change verification.

## Specification Baseline

- OpenAPI 3.1.2.
- JSON Schema Draft 2020-12.
- CloudEvents 1.0 semantics for the foundational event envelope.
- RFC 9562 UUID Version 7 for business event identifiers.
- Repository-local pinned validation tooling.

## Repository Layout

- openapi/v1 — versioned synchronous API contracts.
- schemas/shared/v1 — shared machine-readable schemas.
- schemas/events/v1 — event envelope and event payload schemas.
- scripts — local validation and compatibility automation.
- tests/fixtures — valid, invalid, compatible, and breaking fixtures.
- .github/workflows — repository CI validation.

## Boundaries

This repository defines executable contracts only.

W00-WU04 does not implement event publishers, consumers, Transactional Outbox runtime behavior, retry mechanics, idempotent-consumption runtime behavior, broker selection, routing, partitioning, DLQ, retention, replay, or infrastructure provisioning.

Those runtime concerns remain owned by later work units, including W00-WU05.
