// requirement.ts
import * as vscode from "vscode";
import { getLastAssistantMarkdown } from "./copilotintegration";
import { updateJiraField, getJiraIssue } from "./jiraintegration";

export async function handleRequirementCommand(
  subCommand: string,
  args: string[],
  stream: vscode.ChatResponseStream,
  context: vscode.ChatContext,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  const storyDescription = getLastUserInputDescription(context);

  switch (subCommand) {
    case "refine-story": {
      const prompt = `You are a Salesforce business analyst. Refine the following user story with Salesforce best practices, platform capabilities, and clean formatting:\n\n---\n${storyDescription}\n---`;

      const messages = [
        vscode.LanguageModelChatMessage.User(prompt)
      ];

      const aiResponse = await request.model.sendRequest(messages, {}, token);
      let full = "";
      for await (const chunk of aiResponse.text) {
        full += chunk;
        stream.markdown(chunk);
      }
      break;
    }

    case "generate-acceptence-criteria": {
      const prompt = `Based on the following user story, generate acceptance criteria in Gherkin format:\n\n---\n${storyDescription}\n---`;

      const messages = [
        vscode.LanguageModelChatMessage.User(prompt)
      ];

      const aiResponse = await request.model.sendRequest(messages, {}, token);
      let full = "";
      for await (const chunk of aiResponse.text) {
        full += chunk;
        stream.markdown(chunk);
      }
      break;
    }

    case "update-acceptence-criteria": {
      const acText = getLastAssistantMarkdown(context);
      if (!acText) {
        stream.markdown("❗ No acceptance criteria found in context.");
        return;
      }

      const config = vscode.workspace.getConfiguration();
      const domain = config.get<string>("jiraChat.domain") || "";
      const email = config.get<string>("jiraChat.email") || "";
      const apiToken = config.get<string>("jiraChat.apiToken") || "";
      const issueKey = getCurrentJiraKey(context);

      if (!domain || !email || !apiToken || !issueKey) {
        stream.markdown("❗ Missing Jira config or context.");
        return;
      }

      await updateJiraField(domain, email, apiToken, issueKey, "Acceptance Criteria", acText);
      stream.markdown(`✅ Acceptance Criteria updated in Jira issue \`${issueKey}\`.`);
      break;
    }

    default:
      stream.markdown("❓ Unknown requirement command.");
  }
}

function getLastUserInputDescription(context: vscode.ChatContext): string {
  for (const h of [...context.history].reverse()) {
    if ((h as any).message?.prompt) {
      const text = (h as any).message.prompt;
      if (text.toLowerCase().includes("description") || text.length > 30) return text;
    }
  }
  return "";
}

function getCurrentJiraKey(context: vscode.ChatContext): string | null {
  for (const h of [...context.history].reverse()) {
    if ((h as any).message?.prompt?.match(/^[A-Z]+-\d+$/)) {
      return (h as any).message.prompt.trim();
    }
  }
  return null;
}
