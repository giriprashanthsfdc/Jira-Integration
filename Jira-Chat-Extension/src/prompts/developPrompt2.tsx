import {
  PromptElement,
  UserMessage,
  BasePromptElementProps
} from '@vscode/prompt-tsx';
import { History } from './shared/History';

interface Props extends BasePromptElementProps {
  userQuery: string;
  language: string;
  history: any[];
}

export class DevelopPrompt extends PromptElement<Props> {
  render() {
    return (
      <>
        <UserMessage priority={100}>
          You are a Salesforce developer. Follow company standards. Generate Apex classes, triggers, LWC, flows, and metadata as needed.
        </UserMessage>
        <History history={this.props.history} passPriority newer={80} older={0} flexGrow={2} flexReserve="/6" />
        <UserMessage priority={90}>{this.props.userQuery}</UserMessage>
      </>
    );
  }
}
