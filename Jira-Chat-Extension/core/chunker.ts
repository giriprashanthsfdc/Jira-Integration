import * as fs from 'fs/promises';
import { encode } from 'gpt-tokenizer';

const MAX_TOKENS = 8000;

export async function chunkLargeFile(filePath: string): Promise<{ content: string; chunkId: number }[]> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const chunks: string[][] = [];
  let current: string[] = [];
  let tokenCount = 0;

  for (const line of lines) {
    const tokens = encode(line).length;
    if (tokenCount + tokens > MAX_TOKENS && current.length > 0) {
      chunks.push(current);
      current = [];
      tokenCount = 0;
    }
    current.push(line);
    tokenCount += tokens;
  }

  if (current.length > 0) chunks.push(current);

  return chunks.map((lines, index) => ({
    chunkId: index + 1,
    content: lines.join('\n')
  }));
}
