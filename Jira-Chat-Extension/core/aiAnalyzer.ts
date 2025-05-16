import * as vscode from 'vscode';
import { renderPrompt } from '@vscode/prompt-tsx';
import { FileSummaryPrompt } from '../prompts/FileSummaryPrompt';
import { ComponentSummary } from '../types';

export async function analyzeFileChunkWithAI(
  content: string,
  type: string,
  filePath: string,
  chunkId: number
): Promise<Partial<ComponentSummary> & { chunkId: number; text: string }> {
  const models = await vscode.lm.selectChatModels({ family: 'gpt-4' });
  const model = models[0];

  const { messages } = await renderPrompt(
    FileSummaryPrompt,
    { content, fileType: type },
    { modelMaxPromptTokens: 8000 },
    model
  );

  const res = await model.sendRequest(messages);
  const text = await res.textResponse;

  try {
    const parsed = JSON.parse(text);
    return {
      chunkId,
      text: content,
      summary: parsed.summary || '',
      dependencies: parsed.dependencies || [],
      metadataUsed: parsed.metadataUsed || [],
      methods: parsed.methods || [],
      fixes: parsed.fixes || []
    };
  } catch {
    return {
      chunkId,
      text: content,
      summary: 'Could not parse AI response.',
      dependencies: [],
      metadataUsed: [],
      methods: [],
      fixes: []
    };
  }
}
