import * as vscode from 'vscode';
import { renderPrompt } from '@vscode/prompt-tsx';
import { DevelopPrompt } from '../prompts/DevelopPrompt';
import { extractCodeBlocksAndWriteFiles } from '../utils/fileWriter';

export async function handleDevelopCommand(
  action: string,
  userInput: string,
  chat: vscode.ChatContext,
  req: vscode.ChatRequest,
  stream: vscode.ChatResponseStream
) {
  if (action !== 'finalised-design') {
    stream.markdown(`❌ Unknown develop action: ${action}`);
    return;
  }

  const language = vscode.workspace.getConfiguration('chatSDLC').get<string>('language') || 'salesforce';
  const [model] = await vscode.lm.selectChatModels({ family: 'gpt-4o' });
  const prompt = await renderPrompt(DevelopPrompt, {
    history: chat.history,
    userQuery: userInput,
    language
  });

  const response = await model.sendRequest(prompt, {}, req.token);

  let fullText = '';
  for await (const chunk of response.text) {
    fullText += chunk;
    stream.markdown(chunk);
  }

  const files = await extractCodeBlocksAndWriteFiles(fullText, language);
  if (files.length > 0) {
    stream.markdown(`✅ Generated:\n${files.map(f => `- \`${f}\``).join('\n')}`);
  }
}
