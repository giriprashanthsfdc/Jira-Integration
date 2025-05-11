import {
  AssistantMessage,
  BasePromptElementProps,
  ChatContext,
  ChatRequestTurn,
  ChatResponseTurn,
  PrioritizedList,
  PromptElement,
  PromptPiece,
  UserMessage
} from '@vscode/prompt-tsx';

interface HistoryMessagesProps extends BasePromptElementProps {
  history: ChatContext['history'];
}

class HistoryMessages extends PromptElement<HistoryMessagesProps> {
  render(): PromptPiece {
    const elements = this.props.history.map((turn) => {
      if (turn instanceof ChatRequestTurn) {
        return <UserMessage>{turn.prompt}</UserMessage>;
      } else if (turn instanceof ChatResponseTurn) {
        return (
          <AssistantMessage name={turn.participant}>
            {turn.parts.map((part) => ('text' in part ? part.text : '')).join('\n')}
          </AssistantMessage>
        );
      }
      return null;
    });

    return <PrioritizedList priority={this.props.priority || 0}>{elements}</PrioritizedList>;
  }
}

interface HistoryProps extends BasePromptElementProps {
  history: ChatContext['history'];
  newer: number;
  older: number;
  passPriority: true;
}

export class History extends PromptElement<HistoryProps> {
  render(): PromptPiece {
    const { history, newer, older } = this.props;
    return [
      <HistoryMessages history={history.slice(0, -2)} priority={older} />,
      <HistoryMessages history={history.slice(-2)} priority={newer} />
    ];
  }
}
