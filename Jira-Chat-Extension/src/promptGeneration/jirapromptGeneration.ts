import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const PROMPT_DIR = path.join(__dirname, '..', 'prompts');

function resolveIncludes(content: string, baseDir: string, seen = new Set<string>()): string {
  return content.replace(/\[.*?\]\((.+?\.prompt\.md)\)/g, (_, relPath) => {
    const absPath = path.join(baseDir, relPath);
    if (seen.has(absPath)) return `<!-- skipped circular include: ${relPath} -->`;
    if (!fs.existsSync(absPath)) return `<!-- missing include: ${relPath} -->`;
    seen.add(absPath);
    const included = fs.readFileSync(absPath, 'utf8');
    return resolveIncludes(included, baseDir, seen);
  });
}

export async function generateJiraPrompt(storyText: string): Promise<string | undefined> {
  const promptPath = path.join(PROMPT_DIR, 'create-story.prompt.md');
  if (!fs.existsSync(promptPath)) {
    vscode.window.showErrorMessage('Prompt file not found.');
    return;
  }
  const base = fs.readFileSync(promptPath, 'utf8');
  const resolved = resolveIncludes(base, PROMPT_DIR);
  return resolved.replace('{{story}}', storyText);
}
