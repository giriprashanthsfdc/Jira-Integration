import * as vscode from 'vscode';
import { renderPrompt } from '@vscode/prompt-tsx';
import { DevelopmentPrompt } from './prompts/developmentPrompt';
import { loadInstructions } from './instructions';

export async function handleDevelopCommand(userPrompt: string, history: any, stream: vscode.ChatResponseStream, model: vscode.LanguageModelChat, token: vscode.CancellationToken) {
  const language = vscode.workspace.getConfiguration('chatSDLC').get<string>('language') || 'salesforce';
  const instructions = await loadInstructions(language, 'develop');
  const allInstructionText = instructions.map(i => i.content).join('\n\n');

  const { messages } = await renderPrompt(
    DevelopmentPrompt,
    { userQuery: userPrompt, history, companyInstructions: allInstructionText },
    { modelMaxPromptTokens: 32000 },
    model
  );

  const response = await model.sendRequest(messages, {}, token);
  for await (const fragment of response.text) {
    stream.markdown(fragment);
  }
}