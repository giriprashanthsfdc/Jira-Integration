import { PromptElement, UserMessage, BasePromptElementProps } from '@vscode/prompt-tsx';

interface Props extends BasePromptElementProps {
  userQuery: string;
  companyInstructions: string;
  history: any[];
}

export class DevelopmentPrompt extends PromptElement<Props> {
  render() {
    return (
      <>
        <UserMessage priority={100}>{this.props.companyInstructions}</UserMessage>
        <UserMessage priority={90}>{this.props.userQuery}</UserMessage>
      </>
    );
  }
}