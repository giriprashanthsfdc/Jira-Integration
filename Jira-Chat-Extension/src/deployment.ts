// deployment.ts
import * as vscode from "vscode";
import { getCurrentJiraKey } from "./utils";
import { createBranchAndPR, createBranchOnly } from "./githubintegration";

export async function handleDeploymentCommand(
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
    case "create-branch-raise-pr": {
      const sourceBranch = args[0] || "main";
      await createBranchAndPR(issueKey, sourceBranch, stream);
      break;
    }

    case "create-branch": {
      const sourceBranch = args[0] || "main";
      await createBranchOnly(issueKey, sourceBranch, stream);
      break;
    }

    case "generate-pre-deployment-steps": {
      const prompt = `You are a Salesforce release manager.
Based on the current Jira story and previous AI conversation, generate a **pre-deployment checklist** that includes:
- Required validations, test coverage
- Setup changes (custom settings, metadata records)
- User permissions, profiles, feature activations
- Dependency deployments (objects, flows, etc.)
- Any blackout/maintenance windows

Return this in markdown checklist format.`;
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);
      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    case "generate-post-deployment-steps": {
      const prompt = `You are a Salesforce release manager.
Generate a **post-deployment checklist** including:
- Smoke testing actions
- Data migration or record updates
- Permission assignments
- Feature validation by QA/business
- Rollback criteria or monitoring

Return in markdown checklist format.`;
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);
      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    default:
      stream.markdown("❓ Unknown deployment command.");
  }
}
