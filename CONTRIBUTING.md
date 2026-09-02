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
