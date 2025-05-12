import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface Instruction {
  content: string;
  fileName: string;
}

export async function loadInstructions(language: string, phase: string): Promise<Instruction[]> {
  const folderPath = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', 'chatSDLC', 'instructions', language, phase);
  try {
    const files = await fs.readdir(folderPath);
    const instructions = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async fileName => {
        const content = await fs.readFile(path.join(folderPath, fileName), 'utf-8');
        return { content, fileName };
      })
    );
    return instructions;
  } catch (err) {
    console.error('Failed to load instructions:', err);
    return [];
  }
}