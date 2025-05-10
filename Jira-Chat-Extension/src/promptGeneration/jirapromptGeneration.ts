import * as fs from 'fs';
import * as path from 'path';

const PROMPT_FILE = path.join(__dirname, '..', '.github', 'prompts', 'jira.prompt.md');

export async function generatePrompt(command: string, input: string): Promise<string> {
  if (!fs.existsSync(PROMPT_FILE)) throw new Error('jira.prompt.md not found');
  const content = fs.readFileSync(PROMPT_FILE, 'utf8');
  const sections = splitPromptSections(content);
  const section = sections.get(command);
  if (!section) throw new Error(`Prompt section ## ${command} not found`);
  return interpolate(section, input);
}

function splitPromptSections(content: string): Map<string, string> {
  const map = new Map();
  const lines = content.split('\n');
  let current = '', buffer: string[] = [];
  for (const line of lines) {
    const header = line.match(/^##\s+([a-z0-9\-]+)/i);
    if (header) {
      if (current) map.set(current, buffer.join('\n').trim());
      current = header[1];
      buffer = [];
    } else if (current) buffer.push(line);
  }
  if (current) map.set(current, buffer.join('\n').trim());
  return map;
}

function interpolate(template: string, input: string): string {
  const parts = input.split(' ');
  const values = new Map();
  for (const p of parts) {
    const [k, v] = p.includes('=') ? p.split('=') : [null, null];
    if (k && v) values.set(k, v);
  }
  return template.replace(/\${input:([a-zA-Z0-9]+)}/g, (_, key) => values.get(key) || input);
}
