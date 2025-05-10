import * as vscode from 'vscode';

export interface LanguageSpecificCodeWriter {
  write(code: string, language: string, rootFolder: string): Promise<string | null>;
}

export async function extractCodeBlocksAndWriteFiles(
  llmOutput: string,
  language: string
): Promise<string[]> {
  const matches = Array.from(llmOutput.matchAll(/```([a-zA-Z]*)\n([\s\S]*?)```/g));
  const createdFiles: string[] = [];

  const module = await import(`../writers/${language}Writer`);
  const writer = module.default as LanguageSpecificCodeWriter;

  for (const [, codeLang, code] of matches) {
    const filePath = await writer.write(code, codeLang, vscode.workspace.workspaceFolders?.[0].uri.fsPath || '');
    if (filePath) createdFiles.push(filePath);
  }

  return createdFiles;
}
