---
applyTo: "**"
---

# Salesforce Company Coding Standards

## Apex Standards
- Use `with sharing` by default.
- All classes must include unit tests (≥ 75% coverage).
- Always use bulk-safe logic in triggers and classes.
- Prefer `@AuraEnabled(cacheable=true)` for getters.
- Use `Database.insert(record, allOrNone)` for controlled DML.
- Apply guard clauses in triggers to avoid recursion.

## Naming Conventions
- Apex Classes: PascalCase (`MyLeadHandler`)
- Apex Triggers: `{ObjectName}Trigger` (`LeadTrigger`)
- Lightning Web Components: kebab-case for folder names (`lead-card`)
- Variables: camelCase
- Constants: ALL_CAPS
- Custom Objects: PascalCase (`Candidate__c`)
- Custom Fields: camelCase with trailing `__c` (`status__c`)

## LWC Standards
- Split template, JS, and meta.xml into separate files.
- Avoid `@track` unless reactive updates are truly needed.
- Use `@wire` for calling Apex in component initialization.
- Avoid inline CSS – use SLDS classes.

## Flows & Automation
- Use record-triggered flows over process builders.
- Include entry criteria and error handling.
- Name flows with `{Object}Automation_{Purpose}` format.

## Meta Files
- Ensure `meta.xml` accompanies every class/component.
- Set `<apiVersion>` to the latest available (e.g., 59.0).
