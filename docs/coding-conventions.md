# REVIVE Coding Conventions

## Language Policy

- Code identifiers: English (`camelCase` for variables/functions, `PascalCase` for components/classes).
- UI text: Portuguese (labels, mensagens, titulos e feedback ao usuario).
- API payload keys: preserve backward compatibility. New keys should prefer English only when versioned.

## Migration Strategy

- New code must follow the policy above.
- Existing Portuguese identifiers can be kept temporarily behind aliases to avoid breaking behavior.
- During refactors, migrate internals first, then update imports/usages incrementally.
