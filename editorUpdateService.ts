// src/services/editorUpdateService.ts
import * as vscode from 'vscode';
import { diffLines, Change } from 'diff';

/**
 * Applies block-level diffs with Accept/Discard buttons for each change,
 * and a top-level "Accept All Changes" button.
 */
export async function applyDeltaWithInlineButtons(
  oldContent: string,
  newContent: string,
  fileUri: vscode.Uri
): Promise<void> {
  const editor = await vscode.window.showTextDocument(fileUri);
  const diffs = diffLines(oldContent, newContent);
  const edit = new vscode.WorkspaceEdit();

  const decorations: vscode.DecorationOptions[] = [];
  let currentLine = 0;
  let changeBlocks: { range: vscode.Range; newText: string; id: string }[] = [];

  for (let i = 0; i < diffs.length; i++) {
    const part = diffs[i];
    const lineCount = part.count ?? part.value.split('\n').length - 1;

    if (part.added) {
      const range = new vscode.Range(currentLine, 0, currentLine, 0);
      const id = `change-${currentLine}-${Date.now()}`;
      changeBlocks.push({ range, newText: part.value, id });
    } else if (part.removed) {
      const range = new vscode.Range(currentLine, 0, currentLine + lineCount, 0);
      edit.delete(fileUri, range);
    } else {
      currentLine += lineCount;
    }
  }

  await vscode.workspace.applyEdit(edit);
  await showChangeButtons(editor, changeBlocks);
}

/**
 * Adds per-block Accept/Discard buttons and a top-level Accept All option.
 */
async function showChangeButtons(
  editor: vscode.TextEditor,
  blocks: { range: vscode.Range; newText: string; id: string }[]
): Promise<void> {
  const lensProvider: vscode.CodeLensProvider = {
    provideCodeLenses(document) {
      const lenses: vscode.CodeLens[] = [];

      for (const block of blocks) {
        lenses.push(
          new vscode.CodeLens(block.range, {
            title: '✔ Accept Change',
            command: 'chatSDLC.acceptBlockChange',
            arguments: [block]
          }),
          new vscode.CodeLens(block.range, {
            title: '✘ Discard Change',
            command: 'chatSDLC.discardBlockChange',
            arguments: [block]
          })
        );
      }

      // Add top-level Accept All button
      lenses.push(
        new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
          title: '✔ Accept All Changes',
          command: 'chatSDLC.acceptAllChanges'
        })
      );

      return lenses;
    },
    resolveCodeLens(codeLens) {
      return codeLens;
    }
  };

  vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, lensProvider);
}
