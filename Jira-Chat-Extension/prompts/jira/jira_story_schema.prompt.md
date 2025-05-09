# Jira Story Schema

Please generate a JSON object with this structure:

- `summary`: short string describing the story.
- `description`: detailed markdown description of the story.
- `customfield_10031`: Acceptance criteria in Gherkin format (if applicable).
- `issuetype`: object with `"name": "Story"`.
- `project`: object with `"key": "ABC"` (hardcoded for now, can be parameterized).
- `storyPoints`: integer from 1–13.

Example:
```json
{
  "summary": "Allow user login via LinkedIn",
  "description": "We need to support OAuth login through LinkedIn...",
  "customfield_10031": "Given user clicks LinkedIn login\nWhen they authenticate\nThen they are logged into the app",
  "issuetype": { "name": "Story" },
  "project": { "key": "ABC" },
  "storyPoints": 5
}
