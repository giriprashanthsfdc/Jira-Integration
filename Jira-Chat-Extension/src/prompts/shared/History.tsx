import {
  UserMessage,
  AssistantMessage,
  PromptElement,
  BasePromptElementProps,
  PrioritizedList
} from '@vscode/prompt-tsx';
import { ChatContext, ChatRequestTurn, ChatResponseTurn } from 'vscode';

export class HistoryMessages extends PromptElement<{ history: ChatContext['history'] } & BasePromptElementProps> {
  render() {
    const history = this.props.history.map(turn =>
      turn instanceof ChatRequestTurn
        ? <UserMessage>{turn.prompt}</UserMessage>
        : <AssistantMessage name={turn.participant}>{turn.parts.map(p => p.text).join('\n')}</AssistantMessage>
    );

    return (
      <PrioritizedList priority={this.props.priority || 0} descending={false}>
        {history}
      </PrioritizedList>
    );
  }
}

export class History extends PromptElement<{ history: ChatContext['history'], newer: number, older: number, passPriority: true }> {
  render() {
    return (
      <>
        <HistoryMessages history={this.props.history.slice(0, -2)} priority={this.props.older} />
        <HistoryMessages history={this.props.history.slice(-2)} priority={this.props.newer} />
      </>
    );
  }
}
