# Contributing

All contract changes are executable interface changes and require review.

## Rules

1. Keep contracts machine-readable and versioned.
2. Preserve domain ownership boundaries.
3. Do not encode runtime implementation details into shared contracts.
4. Do not introduce broker or transport decisions through schema changes.
5. Do not include secrets, credentials, tokens, or real sensitive data.
6. Run repository-local validation before committing.
7. Run compatibility checks for changes to existing contracts.
8. Add validation fixtures when behavior changes.
9. Add compatibility fixtures when evolution behavior changes.
10. Pin tooling explicitly.

OpenAPI contracts use OpenAPI 3.1.2.

Standalone shared and event schemas use JSON Schema Draft 2020-12.

Business events follow the accepted CloudEvents-based Atlazora event-envelope decision.

Business event identifiers use RFC 9562 UUID Version 7.

Material architectural decisions must be resolved through the Atlazora ADR process before being encoded as executable contracts.

## Required Local Workflow

Install dependencies from the committed lockfile:

```text
npm ci
```

Before committing a contract change, run:

```text
npm run verify
npm audit --audit-level=high
```

`npm run verify` includes both:

- `npm run validate`
- `npm run compatibility`

Individual compatibility checks are available as:

- `npm run compatibility:openapi`
- `npm run compatibility:schemas`

OpenAPI validation uses the pinned Redocly CLI dependency.

Shared and event JSON Schema validation uses the pinned Ajv dependencies.

OpenAPI compatibility verification uses the pinned oasdiff version recorded by the repository.

When compatibility behavior changes, fixtures must demonstrate both the intended compatible behavior and the prohibited breaking behavior.

## Pull Request Expectations

A contract change should include the machine-readable contract change together with the fixtures required to prove its expected validation or compatibility behavior.

The `Contracts Validation` GitHub Actions workflow must pass for changes targeting `main`.

Do not bypass a failing validation or compatibility check by weakening an accepted contract rule. If the intended change requires a material architecture decision, resolve that decision through the Atlazora ADR process first.

## W00-WU04 Boundary

Contribution work in this repository must remain within executable contract concerns.

Do not introduce event publishing or consumption runtime code, Transactional Outbox behavior, retry or idempotent-consumption runtime mechanisms, broker configuration, routing, partitioning, DLQ, retention, replay, deployment, or infrastructure provisioning as part of W00-WU04.
