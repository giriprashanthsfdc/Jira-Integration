// design.ts
import * as vscode from "vscode";
import { getLastAssistantMarkdown } from "./copilotintegration";
import { getJiraIssue, createJiraSubtask, updateJiraField } from "./jiraintegration";

export async function handleDesignCommand(
  subCommand: string,
  args: string[],
  stream: vscode.ChatResponseStream,
  context: vscode.ChatContext,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  const description = getLastUserInputDescription(context);
  const config = vscode.workspace.getConfiguration();
  const domain = config.get<string>("jiraChat.domain") || "";
  const email = config.get<string>("jiraChat.email") || "";
  const apiToken = config.get<string>("jiraChat.apiToken") || "";
  const issueKey = getCurrentJiraKey(context);

  if (!domain || !email || !apiToken || !issueKey) {
    stream.markdown("❗ Missing Jira credentials or context.");
    return;
  }

  switch (subCommand) {
    case "generate-design-options": {
      const prompt = `You are a Salesforce Solution Architect.

Given the following requirement, generate **3 detailed design options**. For each option:

---

### 🧩 Include a Comparison Table with:

| Attribute         | Option 1: [Title]       | Option 2: [Title]       | Option 3: [Title]       |
|------------------|-------------------------|--------------------------|--------------------------|
| **Approach**       | Standard / Hybrid / Custom |
| **Integration**    | Real-time / Batch / Event-driven / None |
| **Configurable**   | High / Medium / Low (e.g. metadata-driven, static config) |
| **Bulk Handling**  | Yes / No (explain safety in large volume) |
| **Security**       | CRUD, FLS, Sharing (Yes/No and how) |
| **Extensibility**  | High / Medium / Low |
| **Complexity**     | Low / Medium / High |
| **Best Use Case**  | When should this be preferred |

---

### 🔍 For each Option, provide:

#### 📌 Option X: [Title]
- **Overview**: Explain the architecture in 2-3 sentences.
- **Pros**: At least 3 benefits of using this option.
- **Cons**: At least 3 limitations or trade-offs.
- **Estimated Complexity**: Low / Medium / High with reasoning (based on effort, config/code needed, testing, deployment, etc.)
- **Ideal When**: Describe situations this option is best suited for.

---

### 🛠️ Consider the following while proposing designs:
- Declarative tools: Flows, Validation Rules, Assignment Rules, Approval Process, Record Types
- Hybrid solutions: Config + Apex, Flow + Callout, Flow + Custom Metadata
- Custom solutions: Apex Classes, Triggers, Platform Events, Batch Apex, Queueables
- Integration patterns: Real-time (HTTP), Batch (Scheduled), Event-driven (Pub/Sub, Change Data Capture)
- Configurability: Use of Custom Metadata Types, Custom Settings, Dynamic Apex
- Scalability: Handling bulk records, SOQL/SOSL limits, async processing
- Security: CRUD/FLS enforcement, Sharing rules, user role/access control
- Extensibility: Future enhancement potential, plug-in design, modularity
- Complexity assessment: Dev/test/deploy effort, dependency on external systems or teams

---

**User Story**:
${description}

**Acceptance Criteria**:
{Insert acceptance criteria here}

---

Now generate the response in the specified format.`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);

      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
      }
      break;
    }

    case "finalise-design": {
      const designNumber = args[0];
      const fullDesign = getLastAssistantMarkdown(context);
      if (!fullDesign) {
        stream.markdown("❗ No previous design options found to finalise.");
        return;
      }

      const selected = extractDesignOption(fullDesign, designNumber);
      const subtask = await createJiraSubtask(
        domain,
        email,
        apiToken,
        issueKey,
        "Design",
        selected || fullDesign
      );

      await updateJiraField(domain, email, apiToken, issueKey, "Description", selected || fullDesign);
      stream.markdown(`📌 Finalised design and created sub-task [${subtask.key}](${domain}/browse/${subtask.key})`);
      break;
    }

    case "create-design-document": {
      const designContent = getLastAssistantMarkdown(context);
      if (!designContent) {
        stream.markdown("❗ No design content found to generate document.");
        return;
      }
      // In future you can export this to a Confluence page, PDF or markdown file
      stream.markdown(`📄 **Design Document Generated:**

${designContent}`);
      break;
    }

    default:
      stream.markdown("❓ Unknown design command.");
  }
}

function extractDesignOption(markdown: string, numberArg?: string): string | null {
  const lines = markdown.split("\n");
  const options: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#+\s*Option\s*\d+/i.test(line)) {
      if (current.length > 0) options.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) options.push(current);

  const index = numberArg ? parseInt(numberArg) - 1 : 0;
  return options[index] ? options[index].join("\n") : null;
}

function getCurrentJiraKey(context: vscode.ChatContext): string | null {
  for (const h of [...context.history].reverse()) {
    if ((h as any).message?.prompt?.match(/^[A-Z]+-\d+$/)) {
      return (h as any).message.prompt.trim();
    }
  }
  return null;
}

function getLastUserInputDescription(context: vscode.ChatContext): string {
  for (const h of [...context.history].reverse()) {
    if ((h as any).message?.prompt) {
      const text = (h as any).message.prompt;
      if (text.toLowerCase().includes("description") || text.length > 30) return text;
    }
  }
  return "";
}
