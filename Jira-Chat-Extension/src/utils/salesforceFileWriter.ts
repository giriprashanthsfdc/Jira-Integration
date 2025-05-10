import * as vscode from 'vscode';
import { LanguageSpecificCodeWriter } from './fileWriter';

export async function extractSalesforceFilesFromLLM(llmOutput: string): Promise<string[]> {
  const createdFiles: string[] = [];
  const rootFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
  const matches = Array.from(llmOutput.matchAll(/```([a-zA-Z0-9\-]*)\n([\s\S]*?)```/g));

  const writer = await import('../writers/salesforceWriter').then(m => m.default as LanguageSpecificCodeWriter);

  for (const [, lang, code] of matches) {
    const file = await writer.write(code, lang, rootFolder);
    if (file) createdFiles.push(file);
  }

  return createdFiles;
}
