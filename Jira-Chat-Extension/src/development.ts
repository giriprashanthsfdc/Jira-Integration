// development.ts
import * as vscode from "vscode";
import { getLastAssistantMarkdown } from "./copilotintegration";
import { getJiraIssue, updateJiraField } from "./jiraintegration";
import { generateFilesFromMarkdown } from "./filegeneration";

export async function handleDevelopmentCommand(
  subCommand: string,
  args: string[],
  stream: vscode.ChatResponseStream,
  context: vscode.ChatContext,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  const config = vscode.workspace.getConfiguration();
  const domain = config.get<string>("jiraChat.domain") || "";
  const email = config.get<string>("jiraChat.email") || "";
  const apiToken = config.get<string>("jiraChat.apiToken") || "";
  const issueKey = getCurrentJiraKey(context);

  if (!domain || !email || !apiToken || !issueKey) {
    stream.markdown("❗ Missing Jira credentials or context.");
    return;
  }

  switch (subCommand) {
    case "implement": {
      const design = getLastAssistantMarkdown(context);
      if (!design) {
        stream.markdown("❗ No finalized design found in recent chat history.");
        return;
      }

      const prompt = `You are a senior Salesforce developer.
Implement the solution based on the following design. Ensure best practices:
- Apex separation of concerns
- Exception handling and logging
- Bulk-safe and scalable code
- Metadata/config-driven if applicable
- Code must follow correct folder structure
- Output the code using this markdown format:

### File: classes/MyClass.cls
\`\`\`apex
<code here>
\`\`\`

Also include a valid package.xml reflecting only the changed/added components.

---
${design}`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);

      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    case "generate-components": {
      const markdown = getLastAssistantMarkdown(context);
      if (!markdown) {
        stream.markdown("❗ No component definitions found in markdown.");
        return;
      }
      await generateFilesFromMarkdown(markdown, stream);
      break;
    }

    case "scan-for-vulnerabilities": {
      const code = getLastAssistantMarkdown(context);
      if (!code) {
        stream.markdown("❗ No Apex code found to scan.");
        return;
      }

      const prompt = `You are a Salesforce code auditor.
Please scan the following Apex code for:
- SOQL injection
- Missing bulkification
- Unhandled exceptions
- Hardcoded values
- CRUD/FLS issues

---
${code}`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);

      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    case "deploy-to-org": {
      stream.markdown("🚀 Deploying to org... (You can hook Salesforce CLI or Metadata API here)");
      break;
    }

    case "develop-test-classes": {
      const code = getLastAssistantMarkdown(context);
      if (!code) {
        stream.markdown("❗ No Apex class found to generate tests for.");
        return;
      }

      const prompt = `Write test classes for the following Apex code with:
- >90% coverage
- Tests for bulk, async, exception, and positive/negative cases
- Use mock data factories if needed

---
${code}`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);

      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    default:
      stream.markdown("❓ Unknown development command.");
  }
}

function getCurrentJiraKey(context: vscode.ChatContext): string | null {
  for (const h of [...context.history].reverse()) {
    if ((h as any).message?.prompt?.match(/^[A-Z]+-\d+$/)) {
      return (h as any).message.prompt.trim();
    }
  }
  return null;
}
