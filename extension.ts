import * as vscode from 'vscode';
import { handleDevelopCommand } from './commands/develop';
import { loadCompanyInstructions } from './utils/companyInstructions';

export async function activate(context: vscode.ExtensionContext) {
  await loadCompanyInstructions();

  const participant = vscode.chat.createChatParticipant('chatSDLC', async (request, context, response, token) => {
    if (request.command === 'develop' && request.prompt.includes('finalized-design')) {
      await handleDevelopCommand(request, context, response, token);
    } else {
      response.markdown('Command not recognized. Try: @chatSDLC develop finalized-design');
    }
  });

  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'sdlc-icon.png');
}
