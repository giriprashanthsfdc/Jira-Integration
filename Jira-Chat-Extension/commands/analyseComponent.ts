import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { detectComponentType } from '../core/typeResolver';
import { updateComponentGraph } from '../core/graph';
import { chunkLargeFile } from '../core/chunker';
import { analyzeFileChunkWithAI } from '../core/aiAnalyzer';
import { ComponentIndex, ComponentSummary } from '../types';

const CONTEXT_FILE = path.join('.chatSDLC', 'context', 'component-index.json');
const ANALYSIS_DIR = path.join('.chatSDLC', 'repo-analysis');

export async function analyseComponent(entryPath?: string) {
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!rootPath) return;

  const basePath = entryPath ? path.resolve(rootPath, entryPath) : rootPath;
  const allFiles = await readAllFiles(basePath);

  const index: ComponentIndex = {
    projectMetadata: {
      projectName: path.basename(rootPath),
      analyzedAt: new Date().toISOString(),
      salesforceAPI: '59.0'
    },
    components: {},
    graph: { nodes: [], edges: [] },
    searchableMap: {}
  };

  await fs.mkdir(ANALYSIS_DIR, { recursive: true });

  for (const filePath of allFiles) {
    const type = detectComponentType(filePath);
    if (!type) continue;

    const chunks = await chunkLargeFile(filePath);
    const results = [];

    for (const chunk of chunks) {
      const analyzed = await analyzeFileChunkWithAI(chunk.content, type, filePath, chunk.chunkId);
      results.push(analyzed);
    }

    const name = path.basename(filePath).split('.')[0];
    const componentKey = `${type}:${name}`;

    const merged: ComponentSummary = {
      name,
      type,
      path: filePath,
      summary: results.map(r => r.summary).join('\n\n'),
      dependencies: [...new Set(results.flatMap(r => r.dependencies))],
      metadataUsed: [...new Set(results.flatMap(r => r.metadataUsed))],
      methods: [...new Set(results.flatMap(r => r.methods))],
      fixes: [...new Set(results.flatMap(r => r.fixes))],
      chunks: results.map(r => ({
        chunkId: r.chunkId,
        text: r.text,
        summary: r.summary
      }))
    };

    index.components[componentKey] = merged;
    index.searchableMap[name] = componentKey;

    await fs.writeFile(
      path.join(ANALYSIS_DIR, `${componentKey.replace(':', '-')}.json`),
      JSON.stringify(merged, null, 2)
    );
  }

  updateComponentGraph(index);
  await fs.mkdir(path.dirname(CONTEXT_FILE), { recursive: true });
  await fs.writeFile(CONTEXT_FILE, JSON.stringify(index, null, 2));

  vscode.window.showInformationMessage(`🔍 Analysed ${Object.keys(index.components).length} components.`);
}

async function readAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await readAllFiles(fullPath));
    } else if (!entry.name.endsWith('.meta.xml')) {
      files.push(fullPath);
    }
  }
  return files;
}
