# Jira Sprint Creation Schema

Return a JSON object with:

- `name`: Sprint name
- `startDate`: ISO format (e.g., `2025-05-10T00:00:00.000+05:30`)
- `endDate`: ISO format
- `originBoardId`: Numeric ID of the board
- `goal`: Optional sprint goal

Example:
```json
{
  "name": "Sprint 14",
  "startDate": "2025-05-10T00:00:00.000+05:30",
  "endDate": "2025-05-20T00:00:00.000+05:30",
  "originBoardId": 15,
  "goal": "Finalize Q2 features"
}
