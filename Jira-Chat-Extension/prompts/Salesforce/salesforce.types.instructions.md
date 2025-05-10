---
applyTo: "**/*.cls,**/*.trigger,**/*.js,**/*.html"
---

# Component-Specific Best Practices

## Apex Classes
- All utility methods must be `static`.
- Services should live in `services` namespace or folder.
- Avoid SOQL in loops. Use maps or `AggregateResult` when needed.

## Triggers
- Use a trigger handler pattern: `TriggerName → Handler Class`
- Only one trigger per object.
- Avoid business logic in triggers directly.

## Lightning Web Components
- Use default exports.
- Use event bubbling to communicate with parent components.
- Do not access DOM directly via `querySelector` unless necessary.

## Metadata Rules
- Ensure meta.xml sets correct `isExposed`, `targets`, and `apiVersion`.
