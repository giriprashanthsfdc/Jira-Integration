import * as vscode from 'vscode';
import { ChatContext, ChatRequest, ChatResponseStream } from 'vscode';
import { renderPrompt } from '@vscode/prompt-tsx';
import { DevelopPrompt } from '../prompts/DevelopPrompt';
import { extractSalesforceFilesFromLLM } from '../utils/salesforceFileWriter';
import { getCurrentJiraContext, getJiraIssueDetails } from '../jira/jiraIntegration';

export async function handleDevelopCommand(
  action: string,
  remainingInput: string,
  chat: ChatContext,
  request: ChatRequest,
  stream: ChatResponseStream
) {
  if (action !== 'finalised-design') {
    stream.markdown(`❌ Unknown develop action: \`${action}\``);
    return;
  }

  const language = vscode.workspace.getConfiguration('chatSDLC').get<string>('language') || 'salesforce';
  const userInput = remainingInput.trim();
  const designText = userInput || await getDesignFromJiraContext(stream);

  if (!designText) {
    stream.markdown('⚠️ No design input provided, and no design found in Jira context.');
    return;
  }

  const prompt = await renderPrompt(DevelopPrompt, {
    history: chat.history,
    userQuery: designText,
    language
  });

  const llm = await request.languageModel();
  const response = await llm.sendRequest(prompt, {}, request.token);

  let fullText = '';
  for await (const chunk of response.text) {
    fullText += chunk;
    stream.markdown(chunk);
  }

  const files = await extractSalesforceFilesFromLLM(fullText);
  if (files.length) {
    stream.markdown(`\n\n✅ **Generated Files:**\n${files.map(f => `- \`${f}\``).join('\n')}`);
  }
}

async function getDesignFromJiraContext(stream: ChatResponseStream): Promise<string> {
  const issueKey = await getCurrentJiraContext();
  if (!issueKey) return '';

  try {
    const { description, acceptanceCriteria } = await getJiraIssueDetails(issueKey);
    return `From Jira story ${issueKey}:\n\n${description || ''}\n\n${acceptanceCriteria || ''}`;
  } catch (err: any) {
    stream.markdown(`⚠️ Failed to fetch design from Jira story ${issueKey}: ${err.message}`);
    return '';
  }
}
