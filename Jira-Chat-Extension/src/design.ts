// design.ts
import * as vscode from "vscode";
import { getLastAssistantMarkdown } from "./copilotintegration";
import { getJiraIssue, createJiraSubtask, updateJiraField } from "./jiraintegration";

export async function handleDesignCommand(
  subCommand: string,
  args: string[],
  stream: vscode.ChatResponseStream,
  context: vscode.ChatContext,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  const description = getLastUserInputDescription(context);
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
    case "generate-design-options": {
      const prompt = `You are a Salesforce Solution Architect. Based on the following requirement, propose 2-3 design options with pros, cons, estimated complexity, and suitable use cases. Include standard out-of-the-box features, custom development, batch/real-time integration options in a comparison table:

---
${description}
---`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);

      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    case "finalise-design": {
      const designNumber = args[0];
      const fullDesign = getLastAssistantMarkdown(context);
      if (!fullDesign) {
        stream.markdown("❗ No previous design options found to finalise.");
        return;
      }

      const selected = extractDesignOption(fullDesign, designNumber);
      const subtask = await createJiraSubtask(
        domain,
        email,
        apiToken,
        issueKey,
        "Design",
        selected || fullDesign
      );

      await updateJiraField(domain, email, apiToken, issueKey, "Description", selected || fullDesign);
      stream.markdown(`📌 Finalised design and created sub-task [${subtask.key}](${domain}/browse/${subtask.key})`);
      break;
    }

    case "create-design-document": {
      const designContent = getLastAssistantMarkdown(context);
      if (!designContent) {
        stream.markdown("❗ No design content found to generate document.");
        return;
      }
      // In future you can export this to a Confluence page, PDF or markdown file
      stream.markdown(`📄 **Design Document Generated:**

${designContent}`);
      break;
    }

    default:
      stream.markdown("❓ Unknown design command.");
  }
}

function extractDesignOption(markdown: string, numberArg?: string): string | null {
  const lines = markdown.split("\n");
  const options: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#+\s*Option\s*\d+/i.test(line)) {
      if (current.length > 0) options.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) options.push(current);

  const index = numberArg ? parseInt(numberArg) - 1 : 0;
  return options[index] ? options[index].join("\n") : null;
}

function getCurrentJiraKey(context: vscode.ChatContext): string | null {
  for (const h of [...context.history].reverse()) {
    if ((h as any).message?.prompt?.match(/^[A-Z]+-\d+$/)) {
      return (h as any).message.prompt.trim();
    }
  }
  return null;
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
