// deployment.ts
import * as vscode from "vscode";
import { getCurrentJiraKey } from "./utils";
import {
  createGitHubBranch,
  createGitHubPullRequest,
  getGitHubRepoFromRemote,
} from "./githubintegration";
import { getJiraIssue } from "./jiraintegration";

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
  const githubToken = config.get<string>("jiraChat.GithubAccessToken") || "";
  const issueKey = getCurrentJiraKey(context);

  if (!domain || !email || !apiToken || !issueKey) {
    stream.markdown("❗ Missing Jira credentials or context.");
    return;
  }

  switch (subCommand) {
    case "create-branch": {
      const sourceBranch = args[0] || "main";
      try {
        const issue = await getJiraIssue(domain, email, apiToken, issueKey);
        const newBranch = generateBranchName(issueKey, issue.fields.summary);
        await createGitHubBranch(newBranch, sourceBranch);
        stream.markdown(`✅ Branch \`${newBranch}\` created from \`${sourceBranch}\`.`);
      } catch (err: any) {
        stream.markdown(`❌ Branch creation failed: ${err.message}`);
      }
      break;
    }

    case "create-branch-raise-pr": {
      const sourceBranch = args[0] || "main";
      try {
        const issue = await getJiraIssue(domain, email, apiToken, issueKey);
        const newBranch = generateBranchName(issueKey, issue.fields.summary);
        await createGitHubBranch(newBranch, sourceBranch);

        const githubRepo = await getGitHubRepoFromRemote();
        const prTitle = `feat(${issueKey}): ${issue.fields.summary}`;
        const prBody = `This PR resolves **${issueKey}**.`;

        const prUrl = await createGitHubPullRequest(
          githubRepo,
          prTitle,
          prBody,
          newBranch,
          sourceBranch,
          githubToken
        );
        stream.markdown(`🚀 Pull Request created: [View PR](${prUrl})`);
      } catch (err: any) {
        stream.markdown(`❌ PR creation failed: ${err.message}`);
      }
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

function generateBranchName(issueKey: string, summary: string): string {
  const sanitizedSummary = summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  return `${issueKey.toLowerCase()}-${sanitizedSummary}-${timestamp}`;
}
