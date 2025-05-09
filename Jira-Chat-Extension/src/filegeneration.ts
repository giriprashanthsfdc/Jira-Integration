import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export async function generateFilesFromMarkdown(
  markdown: string,
  stream: vscode.ChatResponseStream
) {
  const workspacePath =
    vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
  const codeBlocks = [...markdown.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];

  if (codeBlocks.length === 0) {
    stream.markdown("⚠️ No valid file blocks found in the markdown.");
    return;
  }

  const createdFiles: string[] = [];

  for (const [, language, block] of codeBlocks) {
    const fileMatch = block.match(/\/\/\s*File:\s*(.+)/i);
    if (!fileMatch) continue;

    const relativePath = fileMatch[1].trim();
    const absPath = path.join(workspacePath, relativePath);

    const codeWithoutPath = block.replace(fileMatch[0], "").trim();
    if (!codeWithoutPath) continue;

    try {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, codeWithoutPath, "utf-8");
      createdFiles.push(relativePath);
      stream.markdown(`✅ Created \`${relativePath}\``);
    } catch (err: any) {
      stream.markdown(`❌ Failed to create \`${relativePath}\`: ${err.message}`);
    }
  }

  if (createdFiles.length === 0) {
    stream.markdown("⚠️ No files were generated.");
  }
}
