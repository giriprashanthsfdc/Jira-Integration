import {
  AssistantMessage,
  UserMessage,
  PromptElement,
  PromptSizing,
} from '@vscode/prompt-tsx';

export class FileSummaryPrompt extends PromptElement<{ content: string; fileType: string }> {
  async render(_state: void, _sizing: PromptSizing) {
    return (
      <>
        <AssistantMessage priority={300}>
          You are a senior Salesforce component analyzer. 
          Read the given {this.props.fileType} code (could be full or partial) and return:
          ```json
          {
            "summary": "what this chunk does",
            "dependencies": ["Component:Name"],
            "metadataUsed": ["Field:Object.Field__c", "PermissionSet:Name"],
            "methods": ["methodOne", "methodTwo"],
            "fixes": ["Improve error handling", "Bulkify SOQL"]
          }
          ```
          Return only valid JSON. Do not guess if unsure.
        </AssistantMessage>

        <UserMessage priority={200}>
          {this.props.content}
        </UserMessage>
      </>
    );
  }
}
