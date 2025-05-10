---
applyTo: "**"
---

# Jira Prompt Format Reference

Use these guidelines to define consistent prompts for Jira operations. All fields should be provided in JSON format and match Jira's REST API schema.

## create-story

Include:
- `summary`: concise title
- `description`: markdown body
- `customfield_10031`: Gherkin-style acceptance criteria
- `issuetype`: `{ "name": "Story" }`
- `project`: `{ "key": "ABC" }`
- Optional: `storyPoints`

## update-story

- Input: `issueKey`, `updateText`
- Output: only the `fields` object with updates
- Avoid including unchanged fields

## create-subtask

- Input: `parentKey`, `subtaskDescription`
- Output: an array of objects each with `summary`, `description`, optional `labels`, `assignee`

## update-subtask

- Input: `issueKey`, `fields`
- Output: `fields` object only

## create-sprint

- Input: `name`, `startDate`, `endDate`, `goal`, `originBoardId`
- ISO 8601 format for dates

## update-comment

- Input: `issueKey`, `comment`
- Output: plain comment string only
Jir
