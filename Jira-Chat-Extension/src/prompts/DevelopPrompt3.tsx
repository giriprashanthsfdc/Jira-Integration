import {
  PromptElement,
  UserMessage,
  BasePromptElementProps,
  PromptPiece
} from '@vscode/prompt-tsx';
import { ChatContext } from 'vscode';
import { History } from './shared/History';

interface Props extends BasePromptElementProps {
  userQuery: string;
  language: string;
  history: ChatContext['history'];
}

export class DevelopPrompt extends PromptElement<Props> {
  render(): PromptPiece {
    return [
      <UserMessage priority={100}>
        You are a {this.props.language} developer. Follow company coding standards.
        Generate all necessary files like classes, metadata, configurations, and components.
      </UserMessage>,

      <History
        history={this.props.history}
        passPriority
        newer={80}
        older={0}
        flexGrow={2}
        flexReserve="/6"
      />,

      <UserMessage priority={90}>{this.props.userQuery}</UserMessage>
    ];
  }
}
