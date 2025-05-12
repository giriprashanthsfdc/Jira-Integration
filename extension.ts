import * as vscode from 'vscode';
import { handleDevelop } from './handlers/develop';

export function activate(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant('chatSDLC', async (request, chatContext, stream, token) => {
    const [scope, command] = request.command?.split(' ') || [];
    if (scope === 'develop') {
      await handleDevelop(request, chatContext, stream, token);
    }
  });

  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'chatSDLC.png');
}
