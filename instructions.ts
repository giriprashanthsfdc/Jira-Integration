import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

const instructionCache: Record<string, Record<string, string[]>> = {};

export async function loadCompanyInstructions(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const baseDir = path.join(workspaceFolder.uri.fsPath, 'chatSDLC', 'instructions');

  try {
    const languages = await fs.readdir(baseDir);
    for (const language of languages) {
      const languagePath = path.join(baseDir, language);
      const langStat = await fs.stat(languagePath);
      if (!langStat.isDirectory()) continue;

      instructionCache[language] = {};

      const phases = await fs.readdir(languagePath);
      for (const phase of phases) {
        const phasePath = path.join(languagePath, phase);
        const phaseStat = await fs.stat(phasePath);
        if (!phaseStat.isDirectory()) continue;

        const files = await fs.readdir(phasePath);
        for (const file of files) {
          if (file.endsWith('.instructions.md')) {
            const fullPath = path.join(phasePath, file);
            const content = await fs.readFile(fullPath, 'utf-8');

            if (!instructionCache[language][phase]) {
              instructionCache[language][phase] = [];
            }
            instructionCache[language][phase].push(content);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load company instructions:', err);
  }
}

export async function getInstructionFor(language: string, phase: string): Promise<string> {
  const parts = instructionCache[language]?.[phase] || [];
  return parts.join('\n\n');
}
