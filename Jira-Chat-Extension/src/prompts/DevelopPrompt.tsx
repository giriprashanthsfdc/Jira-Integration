import { PromptElement, UserMessage } from '@vscode/prompt-tsx';
import { History } from './components/History';
import { loadCompanyInstructions } from '../utils/instructionLoader';

export class DevelopPrompt extends PromptElement<{ history: any; userQuery: string; language: string }> {
  async render() {
    const instructions = await loadCompanyInstructions(this.props.language);
    return (
      <>
        <UserMessage priority={100}>You are a senior developer. Follow these coding standards:\n\n{instructions}</UserMessage>
        <History history={this.props.history} passPriority older={0} newer={80} />
        <UserMessage priority={90}>{this.props.userQuery}</UserMessage>
      </>
    );
  }
}
