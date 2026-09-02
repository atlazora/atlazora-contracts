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

- `openapi/v1` — versioned synchronous API contracts.
- `schemas/shared/v1` — shared machine-readable schemas.
- `schemas/events/v1` — event envelope and event payload schemas.
- `scripts` — local validation and compatibility automation.
- `tests/fixtures` — valid, invalid, compatible, and breaking fixtures.
- `.github/workflows` — repository CI validation.

## Local Verification

Install the pinned repository dependencies from `package-lock.json`:

```text
npm ci
```

Run the complete contract verification workflow:

```text
npm run verify
```

`npm run verify` runs both contract validation and compatibility verification.

Validation can also be run independently:

```text
npm run validate
```

The validation workflow covers:

- OpenAPI validation with Redocly CLI.
- Shared JSON Schema validation with Ajv.
- Event-envelope validation with Ajv.
- Positive and negative validation fixtures.

Compatibility verification can be run independently:

```text
npm run compatibility
```

The compatibility workflow covers:

- OpenAPI breaking-change checks through `compatibility:openapi` using the pinned oasdiff version.
- Repository-local JSON Schema compatibility checks through `compatibility:schemas`.
- Compatible and intentionally breaking fixtures.

A prohibited breaking-change fixture must be rejected with a non-zero verification result.

## Continuous Integration

The `Contracts Validation` GitHub Actions workflow runs on pushes and pull requests targeting `main`, and can also be started manually.

The workflow:

1. Checks out the repository.
2. Sets up the repository Node.js and Go toolchains required by contract verification.
3. Installs dependencies with `npm ci`.
4. Runs `npm run verify`.
5. Runs `npm audit --audit-level=high`.

The CI workflow validates executable contracts only. It does not deploy, publish, provision infrastructure, or implement runtime messaging behavior.

## Boundaries

This repository defines executable contracts only.

W00-WU04 does not implement event publishers, consumers, Transactional Outbox runtime behavior, retry mechanics, idempotent-consumption runtime behavior, broker selection, routing, partitioning, DLQ, retention, replay, or infrastructure provisioning.

Those runtime concerns remain owned by later work units, including W00-WU05.
