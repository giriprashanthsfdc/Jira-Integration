import * as fs from 'fs';
import * as path from 'path';

const PROMPT_FILE = path.join(__dirname, '..', 'prompts', 'jira.prompt.md');

export async function generatePrompt(command: string, input: string): Promise<string> {
  if (!fs.existsSync(PROMPT_FILE)) {
    throw new Error('jira.prompt.md file not found.');
  }

  const fileContent = fs.readFileSync(PROMPT_FILE, 'utf8');
  const sections = splitPromptSections(fileContent);

  const section = sections.get(command);
  if (!section) {
    throw new Error(`Prompt section ## ${command} not found in jira.prompt.md`);
  }

  return interpolateVariables(section, input);
}

function splitPromptSections(content: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = content.split('\n');

  let currentKey = '';
  let buffer: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+([a-z0-9\-_]+)/i);
    if (headerMatch) {
      if (currentKey) {
        map.set(currentKey, buffer.join('\n').trim());
      }
      currentKey = headerMatch[1];
      buffer = [];
    } else if (currentKey) {
      buffer.push(line);
    }
  }

  if (currentKey) {
    map.set(currentKey, buffer.join('\n').trim());
  }

  return map;
}

function interpolateVariables(template: string, input: string): string {
  // Parse input into key=value pairs if structured, else fallback
  const parts = input.split(' ');
  const result = new Map<string, string>();

  // Named args (e.g., key=value)
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (v) result.set(k, v);
  }

  // Fallback for basic cases (e.g., `create-subtask PROJ-1 Do something`)
  if (!template.includes('${input:')) {
    return template.replace('${input}', input);
  }

  return template.replace(/\${input:([\w]+)}/g, (_, name) => {
    return result.get(name) ?? '';
  });
}
