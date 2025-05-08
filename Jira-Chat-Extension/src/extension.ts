import * as vscode from "vscode";
import fetch from "node-fetch";
import * as path from "path";
import * as fs from "fs";

const BASE_PROMPT =
  "You are a helpful Jira assistant. You can retrieve, comment on, update, and create Jira issues. Be concise and return markdown-formatted responses.";

let currentIssueKey: string | null = null;
const output = vscode.window.createOutputChannel("Jira Extension Logs");

export function activate(context: vscode.ExtensionContext) {
  const handler: vscode.ChatRequestHandler = async (
    request,
    chatContext,
    stream,
    token
  ) => {
    const config = vscode.workspace.getConfiguration();
    const domain = config.get<string>("jiraChat.domain");
    const email = config.get<string>("jiraChat.email");
    const apiToken = config.get<string>("jiraChat.apiToken");

    if (!domain || !email || !apiToken) {
      stream.markdown(
        "❌ Please configure Jira credentials in settings (`jiraChat.*`)."
      );
      return;
    }

    const userInput = request.prompt.trim();
    const parts = userInput.split(" ").map((p) => p.trim());
    const firstWord = parts[0]?.toLowerCase();

    if (/^[A-Z]+-\d+$/i.test(parts[0])) {
      currentIssueKey = parts[0].toUpperCase();
      stream.markdown(`📌 Context set to **${currentIssueKey}**`);
      return;
    }

    if (firstWord === "clear") {
      currentIssueKey = null;
      stream.markdown("🧹 Jira context cleared.");
      return;
    }

    const knownCommands = [
      "get",
      "comment",
      "update-summary",
      "update-field",
      "create-subtask",
      "generate-files",
      "create-branch",
      "generatefilesandcreatepr",
      "help",
      "update-all-details-in-jira",
    ];

    if (knownCommands.includes(firstWord)) {
      await handleJiraCommand(firstWord, parts.slice(1), {
        currentIssueKey,
        domain,
        email,
        apiToken,
        context: chatContext,
        stream,
        request,
        token,
      });
      return;
    }

    const contextualPrompt = currentIssueKey
      ? `${BASE_PROMPT} The current Jira issue in context is ${currentIssueKey}.`
      : BASE_PROMPT;

    const messages = [
      vscode.LanguageModelChatMessage.User(contextualPrompt),
      ...getAssistantHistory(chatContext),
      vscode.LanguageModelChatMessage.User(userInput),
    ];

    const aiResponse = await request.model.sendRequest(messages, {}, token);
    for await (const chunk of aiResponse.text) {
      stream.markdown(chunk);
    }
  };

  const participant = vscode.chat.createChatParticipant("jiraCopilot", handler);
  context.subscriptions.push(participant);

  // ✅ Register the command here
  context.subscriptions.push(
    vscode.commands.registerCommand("jiraChat.start", () => {
      vscode.window.showInformationMessage("Jira Chat Started!");
    })
  );
  //participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "jira-icon.png");
}

async function handleJiraCommand(
  command: string,
  args: string[],
  {
    currentIssueKey,
    domain,
    email,
    apiToken,
    context,
    stream,
    request,
    token,
  }: {
    currentIssueKey: string | null;
    domain: string;
    email: string;
    apiToken: string;
    context: vscode.ChatContext;
    stream: vscode.ChatResponseStream;
    request: vscode.ChatRequest;
    token: vscode.CancellationToken;
  }
) {
  const userInput = args.join(" ");

  if (command !== "generate-files" && !currentIssueKey) {
    stream.markdown("❗ No Jira issue set. Please start with `JIRA-123`.");
    return;
  }

  switch (command) {
    case "get": {
      const issue = await getJiraIssue(
        domain,
        email,
        apiToken,
        currentIssueKey!
      );
      stream.markdown(
        `### 🧾 ${issue.key}: ${issue.fields.summary}\n\n**Status:** ${
          issue.fields.status.name
        }\n**Description:** ${
          issue.fields.description?.content?.[0]?.content?.[0]?.text ||
          "No description"
        }`
      );
      break;
    }

    case "comment": {
      let value = userInput || getLastAssistantMarkdown(context) || "";
      if (!value) {
        stream.markdown("❗ Please provide a comment or run Copilot first.");
        return;
      }
      await addJiraComment(domain, email, apiToken, currentIssueKey!, value);
      stream.markdown(`💬 Comment added to ${currentIssueKey}`);
      break;
    }

    case "update-summary": {
      let value = userInput || getLastAssistantMarkdown(context) || "";
      if (!value) {
        stream.markdown("❗ Provide a summary or generate one first.");
        return;
      }
      await updateJiraSummary(domain, email, apiToken, currentIssueKey!, value);
      stream.markdown(`✏️ Summary updated for ${currentIssueKey}`);
      break;
    }

    case "update-field": {
      const [fieldName, ...rest] = args;
      let value = rest.join(" ") || getLastAssistantMarkdown(context) || "";
      if (!fieldName || !value) {
        stream.markdown(
          "❗ Usage: `update-field fieldName value` or run Copilot first."
        );
        return;
      }
      await updateJiraField(
        domain,
        email,
        apiToken,
        currentIssueKey!,
        fieldName,
        value
      );
      stream.markdown(`📝 Updated **${fieldName}** for ${currentIssueKey}`);
      break;
    }

    case "create-subtask": {
      const rawText = userInput || getLastAssistantMarkdown(context) || "";
      if (!rawText.trim()) {
        stream.markdown("❗ Provide one or more sub-task summaries.");
        return;
      }

      const matches = rawText.match(/(?:^|\n)\s*\d+\.\s*(.+)/g);
      const summaries = matches
        ? matches.map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
        : [rawText.trim()];

      for (const summary of summaries) {
        const subtask = await createJiraSubtask(
          domain,
          email,
          apiToken,
          currentIssueKey!,
          summary
        );
        stream.markdown(
          `🧷 Created sub-task [${subtask.key}](${domain}/browse/${subtask.key}) - ${summary}`
        );
      }

      break;
    }
    case "generate-files": {
      const markdown = getLastAssistantMarkdown(context);
      if (!markdown) {
        stream.markdown(
          "❗ No previous Copilot response found to extract files."
        );
        return;
      }
      output.appendLine(
        "Generating files from markdown content xxx..." + markdown
      );
      output.show();
      console.log("Generating files from markdown content..." + markdown);
      await generateFilesFromMarkdown(markdown, stream);
      break;
    }
    case "implement": {
      if (!userInput) {
        stream.markdown(
          "❗ Please provide a feature description to implement."
        );
        return;
      }

      const prompt = currentIssueKey
        ? `The current Jira issue is ${currentIssueKey}. Implement the following using Salesforce best practices and output files in markdown format with correct folder structure:\n\n${userInput}`
        : `Implement the following using Salesforce best practices and output files in markdown format with correct folder structure:\n\n${userInput}`;

      const messages = [
        vscode.LanguageModelChatMessage.User(prompt),
        ...getAssistantHistory(context),
      ];

      const aiResponse = await request.model.sendRequest(messages, {}, token);
      let fullResponse = "";
      output.appendLine(
        "Generating files from markdown content..." + aiResponse
      );
      output.show();
      for await (const chunk of aiResponse.text) {
        stream.markdown(chunk);
        fullResponse += chunk;
      }

      //const result = await generateSalesforceFilesFromMarkdown(fullResponse, stream);
      // if (!result) {
      // stream.markdown("⚠️ No valid file blocks found in the Copilot response.");
      //}

      break;
    }
    case "generatefilesandcreatepr": {
      const [sourceBranch = "main"] = args;

      if (!currentIssueKey) {
        stream.markdown(
          "❗ Please set the Jira issue context (e.g. `JIRA-1234`) before proceeding."
        );
        return;
      }

      const issue = await getJiraIssue(
        domain,
        email,
        apiToken,
        currentIssueKey
      );
      const rawSummary = issue.fields.summary;
      const sanitizedSummary = rawSummary
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14);
      const newBranchName = `${currentIssueKey.toLowerCase()}-${sanitizedSummary}-${timestamp}`;

      const exec = require("util").promisify(require("child_process").exec);
      const workspacePath =
        vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
      const sfdxPath = path.join(workspacePath, "force-app", "main", "default");

      try {
        stream.markdown(
          `🔄 Switching to \`${sourceBranch}\` and pulling latest changes...`
        );
        await exec(`git checkout ${sourceBranch}`);
        await exec(`git pull origin ${sourceBranch}`);

        stream.markdown(`🌿 Creating new branch \`${newBranchName}\`...`);
        await exec(`git checkout -b ${newBranchName}`);

        // Prompt Copilot to implement
        const markdown = getLastAssistantMarkdown(context);
        if (!markdown) {
          stream.markdown(
            "❗ No previous Copilot response found to extract files."
          );
          return;
        }
        output.appendLine(
          "Generating files from markdown content xxx..." + markdown
        );
        output.show();
        console.log("Generating files from markdown content..." + markdown);
        await generateFilesFromMarkdown(markdown, stream);
        // Git commit & push
        await exec(`git add ${sfdxPath}`);
        await exec(
          `git commit -m "feat(${currentIssueKey}): generated files for ${rawSummary}"`
        );
        await exec(`git push --set-upstream origin ${newBranchName}`);

        // Create Pull Request
        const prTitle = `feat(${currentIssueKey}): ${rawSummary}`;
        const prBody = `This PR resolves **${currentIssueKey}**.\n\nGenerated via Copilot Assistant.`;

        const { stdout: prOutput } = await exec(
          `/opt/homebrew/bin/gh pr create --base ${sourceBranch} --head ${newBranchName} --title "${prTitle}" --body "${prBody}"`
        );
        stream.markdown(`🚀 Pull Request created:\n${prOutput}`);
      } catch (err: any) {
        console.error("❌ Git or PR Error:", err.message);
        stream.markdown(`❌ Failed: ${err.message}`);
      }

      break;
    }
    case "create-branch": {
      const [sourceBranch = "main"] = args;

      if (!currentIssueKey) {
        stream.markdown(
          "❗ Please set the Jira issue context (e.g. `JIRA-1234`) before creating a branch."
        );
        return;
      }

      const issue = await getJiraIssue(
        domain,
        email,
        apiToken,
        currentIssueKey
      );
      const rawSummary = issue.fields.summary;
      const sanitizedSummary = rawSummary
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14); // e.g. 20240505121200
      const branchName = `${currentIssueKey.toLowerCase()}-${sanitizedSummary}-${timestamp}`;

      const exec = require("util").promisify(require("child_process").exec);
      try {
        stream.markdown(
          `🚧 Creating branch \`${branchName}\` from \`${sourceBranch}\`...`
        );

        await exec(`git fetch origin ${sourceBranch}`);
        await exec(`git checkout -b ${branchName} origin/${sourceBranch}`);

        // Add generated Salesforce files
        const workspacePath =
          vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
        const sfdxPath = path.join(
          workspacePath,
          "force-app",
          "main",
          "default"
        );

        await exec(`git add ${sfdxPath}`);
        await exec(
          `git commit -m "feat(${currentIssueKey}): initial commit for ${rawSummary}"`
        );
        await exec(`git push --set-upstream origin ${branchName}`);

        stream.markdown(`✅ Created and pushed branch \`${branchName}\`.`);

        // ✅ Create Pull Request
        const prTitle = `feat(${currentIssueKey}): ${rawSummary}`;
        const prBody = `This PR resolves **${currentIssueKey}**.\n\nAuto-generated from Copilot assistant.`;
        const { stdout: prResult } = await exec(
          `/opt/homebrew/bin/gh pr create --base ${sourceBranch} --head ${branchName} --title "${prTitle}" --body "${prBody}"`
        );

        stream.markdown(`🚀 Created Pull Request:\n\n${prResult}`);
      } catch (err: any) {
        console.error("Git error:", err.message);
        stream.markdown(`❌ Failed to create or push branch: ${err.message}`);
      }

      break;
    }
    case "update-all-details-in-jira": {
      if (!currentIssueKey) {
        stream.markdown("❗ No Jira issue set. Please start with `JIRA-123`.");
        return;
      }
    
      const config = vscode.workspace.getConfiguration();
      const storyFields = config.get<any[]>("jiraChat.schema.storyFields") || [];
      const subtaskFields = config.get<any[]>("jiraChat.schema.subtaskFields") || [];
    
      const storyMarkdown = getLastAssistantMarkdown(context);
      
      if (!storyMarkdown || !storyMarkdown.trim()) {
        stream.markdown("❗ Please provide a valid user story in markdown format before running this command.");
        return;
      }
    
      const chatHistory = getChatMessagesSinceJiraContext(context, currentIssueKey);
      output.appendLine(
        "storyMarkdown xxx...\n" + storyMarkdown);
      output.show();
      output.appendLine(
        "chatHistory xxx...\n" + storyMarkdown);
      output.show();
      
      const prompt = `
    You are a helpful Jira assistant.
    
    Can you generate a story for the following requirement with all the fields necessary for sprint planning?
    - The acceptance criteria must be in **Gherkin format**.
    - The sub-tasks should follow standard **SDLC phases**.
    - Return a single valid **JSON object** that can be directly used to update a Jira story and create sub-tasks.
    - ⚠️ Do NOT use field keys like \`customfield_12345\`. Use human-readable field names like "sprint", "epicLink", etc.
    - Sub-task summaries should be under \`subtasks[].name\`.
    
    Here is the current story in markdown:
    
    ---
    ${storyMarkdown}
    `;
    
      const messages = [...chatHistory, vscode.LanguageModelChatMessage.User(prompt)];
      const aiResponse = await request.model.sendRequest(messages, {}, token);
    
      output.appendLine(
        "aiResponse xxx...\n" + aiResponse);
      output.show();
      let fullResponse = "";
      for await (const chunk of aiResponse.text) {
        fullResponse += chunk;
      }
    
      let modelPayload: any;
      try {
        modelPayload = JSON.parse(fullResponse.replace(/^```json|```$/g, "").trim());
        output.appendLine(
          "modelPayload xxx...\n" + JSON.stringify(modelPayload));
        output.show();
      } catch (e) {
        stream.markdown("❌ Failed to parse model response as JSON.");
        return;
      }
    
      if (!modelPayload?.fields) {
        stream.markdown("❌ Model did not return valid 'fields'.");
        return;
      }
    
      const storyFieldPayload = buildFieldPayloadFromNames(modelPayload.fields, storyFields);
      output.appendLine(
        "storyFieldPayload xxx...\n" + JSON.stringify(storyFieldPayload));
      output.show();
      await updateJiraFields(domain, email, apiToken, currentIssueKey, storyFieldPayload);
      stream.markdown(`✅ Updated fields for story \`${currentIssueKey}\`.`);
    
      const subTasks = modelPayload.subtasks || [];
      output.appendLine('subTasks xxx...\n' + JSON.stringify(subTasks));
      for (const sub of subTasks) {
        const subtaskFieldMap = buildFieldPayloadFromNames(sub, subtaskFields);
        output.appendLine(
          "subtaskFieldMap xxx...\n" + JSON.stringify(subtaskFieldMap)); 
        const created = await createJiraSubtask(
          domain,
          email,
          apiToken,
          currentIssueKey,
          subtaskFieldMap.summary || subtaskFieldMap.name,
          subtaskFieldMap.description
        );
        stream.markdown(`🧷 Created sub-task [${created.key}](${domain}/browse/${created.key}) - ${sub.name}`);
      }
    
      break;
    }    
    /*case "update-all-details-in-jira": {
      if (!currentIssueKey) {
        stream.markdown("❗ No Jira issue set. Please start with `JIRA-123`.");
        return;
      }
    
      const storyMarkdown = getLastAssistantMarkdown(context);
      if (!storyMarkdown || !storyMarkdown.trim()) {
        stream.markdown("❗ Please provide a valid user story in markdown format before running this command.");
        return;
      }
    
      const config = vscode.workspace.getConfiguration();
      const storyFields = config.get<any[]>("jiraChat.schema.storyFields") || [];
      const subtaskFields = config.get<any[]>("jiraChat.schema.subtaskFields") || [];
      output.appendLine(
        "storyMarkdown xxx...\n" + storyMarkdown);
      output.show();
      const storyPayload = generatePayloadFromMarkdown(storyMarkdown, storyFields);
      output.appendLine(
        "storyMarkdown xxx...\n" + JSON.stringify(storyMarkdown, null, 2)
      );
      output.show();
      output.appendLine(
        "storyPayload xxx..." + JSON.stringify(storyPayload, null, 2)
      );
      output.show();
      await updateJiraFields(domain, email, apiToken, currentIssueKey, storyPayload);
      stream.markdown(`✅ Updated fields for story \`${currentIssueKey}\`.`);
    
      const subTasks = extractSubTasksFromStory(storyMarkdown);
      output.appendLine(
        "subtaskPayload xxx..." + JSON.stringify(subTasks, null, 2)
      );
      output.show();
      if (Array.isArray(subTasks) && subTasks.length) {
        for (const sub of subTasks) {
          const subMarkdown = `**Summary**: ${sub.title}\n**Description**: ${sub.description}`;
          const subtaskPayload = generatePayloadFromMarkdown(subMarkdown, subtaskFields);
          output.appendLine(
            "subtaskPayload xxx..." + JSON.stringify(subtaskPayload, null, 2)
          );
          output.show();
          const created = await createJiraSubtask(
            domain,
            email,
            apiToken,
            currentIssueKey,
            subtaskPayload.summary,
            subtaskPayload.description
          );
    
          stream.markdown(
            `🧷 Created sub-task [${created.key}](${domain}/browse/${created.key}) - ${sub.title}`
          );
        }
      } else {
        stream.markdown("ℹ️ No subtasks found in markdown.");
      }
    
      break;
    }    */
    case "help":
      {
        stream.markdown(`
        ### Available Commands:
        - **get**: Retrieve the current issue details.
        - **comment**: Add a comment to the current issue.
        - **update-summary**: Update the issue summary.
        - **update-field**: Update a specific field of the issue.
        - **create-subtask**: Create a sub-task under the current issue.
        - **generate-files**: Generate Salesforce files from Copilot response.
        - **create-branch**: Create a new branch for the current issue.
        - **clear**: Clear the current Jira context.
      `);
      }
      break;
    default:
      stream.markdown("❓ Unknown command.");
  }
}
function buildFieldPayloadFromNames(
  input: Record<string, any>,
  schema: { name: string; apiName: string; type: string }[]
): Record<string, any> {
  const payload: Record<string, any> = {};

  // Create a case-insensitive map of the input
  const normalizedInput = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k.toLowerCase(), v])
  );

  output.appendLine("Normalized Input: " + JSON.stringify(normalizedInput, null, 2));
  output.appendLine("Schema: " + JSON.stringify(schema, null, 2));
  output.show();
  for (const field of schema) {
    const { name, apiName, type } = field;
    const fieldKey = name.toLowerCase();
    const value = normalizedInput[fieldKey];

    if (value === undefined || value === null) continue;

    switch (type) {
      case "doc":
        payload[apiName] = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: String(value) }],
            },
          ],
        };
        break;

      case "array":
        payload[apiName] = Array.isArray(value)
          ? value
          : String(value).split(",").map((v) => v.trim());
        break;

      case "number":
        payload[apiName] = parseFloat(value);
        break;

      default:
        payload[apiName] = value;
    }
  }

  return payload;
}

function getChatMessagesSinceJiraContext(
  context: vscode.ChatContext,
  issueKey: string
): vscode.LanguageModelChatMessage[] {
  const messages: vscode.LanguageModelChatMessage[] = [];
  let contextSet = false;

  for (const h of context.history) {
    if ((h as any).message?.prompt) {
      const text = (h as any).message.prompt;
      if (text.includes(issueKey)) contextSet = true;
      if (contextSet && text.trim()) {
        messages.push(vscode.LanguageModelChatMessage.User(text.trim()));
      }
    } else if (h instanceof vscode.ChatResponseTurn) {
      let content = "";
      for (const part of h.response) {
        if (
          typeof part === "object" &&
          "value" in part &&
          typeof part.value === "object" &&
          "value" in part.value
        ) {
          content += part.value.value;
        }
      }
      if (contextSet && content.trim()) {
        messages.push(
          vscode.LanguageModelChatMessage.Assistant(content.trim())
        );
      }
    }
  }

  return messages;
}


function generatePayloadFromMarkdown(markdown: string, fieldSchema: any[]): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const field of fieldSchema) {
    const { name, key, type } = field;

    const regex = new RegExp(`\\*\\*${escapeRegExp(name)}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n---|$)`, "i");
    const match = markdown.match(regex);
    if (!match) continue;

    let value = match[1].trim();

    switch (type) {
      case "doc":
        payload[key] = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: value }]
            }
          ]
        };
        break;

      case "array":
        payload[key] = value.split(",").map((item) => item.trim());
        break;

      case "number":
        payload[key] = parseFloat(value);
        break;

      default:
        payload[key] = value;
        break;
    }
  }

  return payload;
}

function escapeRegExp(text: string) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
function extractSubTasksFromStory(markdown: string): { title: string; description?: string }[] {
  const subTaskBlocks = markdown
    .split(/### \*\*Sub-Tasks:\*\*/i)[1]?.split(/\n(?=\d+\.\s+\*\*)/) || [];

  const subtasks: { title: string; description?: string }[] = [];

  for (const block of subTaskBlocks) {
    const match = block.match(/\d+\.\s+\*\*(.+?)\*\*\s*\n([\s\S]+?)(?=(\n\d+\.|\n###|$))/);
    if (match) {
      const title = match[1].trim();
      const description = match[2].replace(/^- /gm, "").trim();
      subtasks.push({ title, description });
    }
  }

  return subtasks;
}

async function getJiraFieldSchema(domain: string, email: string, token: string) {
  const res = await fetch(`${domain}/rest/api/3/field`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch field schema: ${res.statusText}`);
  const fields = await res.json();
  const fieldMap: Record<string, any> = {};
  for (const field of fields) {
    fieldMap[field.name] = { id: field.id, schema: field.schema };
  }
  return { fields: fieldMap };
}


function generateFilesFromMarkdown(
  markdown: string,
  stream: vscode.ChatResponseStream
) {
  const codeBlocks = [...markdown.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];

  if (codeBlocks.length === 0) {
    stream.markdown("⚠️ No valid file blocks found in the markdown.");
    return;
  }

  const metaWritten = new Set<string>();

  for (const match of codeBlocks) {
    const language = match[1];
    const codeBlock = match[2];

    const fileLineMatch = codeBlock.match(
      /^\s*(\/\/|<!--)\s*File:\s*(.+?)\s*(-->)*$/m
    );
    if (!fileLineMatch) continue;

    const relativePath = fileLineMatch[2].trim();
    const cleanedCode = codeBlock.replace(fileLineMatch[0], "").trim();
    if (!relativePath || !cleanedCode) continue;

    const absPath = path.join(
      vscode.workspace.workspaceFolders?.[0].uri.fsPath || "",
      relativePath
    );

    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, cleanedCode, "utf-8");
    stream.markdown(`✅ Created \`${relativePath}\``);

    // META FILE GENERATION
    const metaContent = buildMetaXML(relativePath);
    if (!metaContent) continue;

    const ext = path.extname(relativePath);
    const dir = path.dirname(relativePath);
    const baseName = path.basename(relativePath, ext);

    // Handle Aura Components
    if (dir.includes("/aura/")) {
      if (ext === ".cmp" && !metaWritten.has(relativePath)) {
        const metaPath = path.join(
          vscode.workspace.workspaceFolders?.[0].uri.fsPath || "",
          `${dir}/${baseName}.cmp-meta.xml`
        );
        fs.writeFileSync(metaPath, metaContent, "utf-8");
        metaWritten.add(relativePath);
        stream.markdown(
          `📝 Created metadata \`${path.relative(process.cwd(), metaPath)}\``
        );
      }
    }

    // Handle LWC Components
    else if (dir.includes("/lwc/")) {
      const metaPath = path.join(
        vscode.workspace.workspaceFolders?.[0].uri.fsPath || "",
        `${dir}/${baseName}.js-meta.xml`
      );
      if (!metaWritten.has(metaPath)) {
        fs.writeFileSync(metaPath, metaContent, "utf-8");
        metaWritten.add(metaPath);
        stream.markdown(
          `📝 Created metadata \`${path.relative(process.cwd(), metaPath)}\``
        );
      }
    }

    // Apex, Trigger, etc.
    else {
      const metaPath = absPath + "-meta.xml";
      fs.writeFileSync(metaPath, metaContent, "utf-8");
      stream.markdown(`📝 Created metadata \`${relativePath}-meta.xml\``);
    }
  }
}

function buildMetaXML(relativePath: string): string | null {
  const ext = path.extname(relativePath);
  const folder = relativePath.toLowerCase();

  if (folder.includes("/lwc/")) {
    // For LWC components: always return a standard JS meta file
    return `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata" fqn="${getComponentName(
      relativePath
    )}">
  <apiVersion>58.0</apiVersion>
  <isExposed>true</isExposed>
  <targets>
    <target>lightning__RecordPage</target>
    <target>lightning__AppPage</target>
    <target>lightning__HomePage</target>
  </targets>
</LightningComponentBundle>`;
  }

  if (folder.includes("/aura/")) {
    // For Aura components: only .cmp gets meta
    if (ext === ".cmp") {
      return `<?xml version="1.0" encoding="UTF-8"?>
<AuraDefinitionBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>58.0</apiVersion>
  <description>${getComponentName(relativePath)} Aura component</description>
</AuraDefinitionBundle>`;
    }
    return null;
  }

  // Apex Classes
  if (ext === ".cls") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>58.0</apiVersion>
  <status>Active</status>
</ApexClass>`;
  }

  // Apex Triggers
  if (ext === ".trigger") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>58.0</apiVersion>
  <status>Active</status>
</ApexTrigger>`;
  }

  // Visualforce Page
  if (ext === ".page") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApexPage xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>58.0</apiVersion>
  <label>${getComponentName(relativePath)}</label>
</ApexPage>`;
  }

  // Visualforce Component
  if (ext === ".component") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApexComponent xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>58.0</apiVersion>
  <description>${getComponentName(relativePath)}</description>
</ApexComponent>`;
  }

  return null;
}

function getComponentName(relativePath: string): string {
  return path.basename(relativePath, path.extname(relativePath));
}

async function getJiraIssue(
  domain: string,
  email: string,
  token: string,
  issueKey: string
) {
  const response = await fetch(`${domain}/rest/api/3/issue/${issueKey}`, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      Accept: "application/json",
    },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch issue: ${response.statusText}`);
  return await response.json();
}

async function addJiraComment(
  domain: string,
  email: string,
  token: string,
  issueKey: string,
  comment: string
) {
  const response = await fetch(
    `${domain}/rest/api/3/issue/${issueKey}/comment`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: comment }],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add comment: ${response.statusText}\n${error}`);
  }
}

async function updateJiraSummary(
  domain: string,
  email: string,
  token: string,
  issueKey: string,
  summary: string
) {
  const response = await fetch(`${domain}/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: { summary } }),
  });
  if (!response.ok)
    throw new Error(`Failed to update summary: ${response.statusText}`);
}

async function updateJiraField(
  domain: string,
  email: string,
  token: string,
  issueKey: string,
  field: string,
  value: string
) {
  const fieldPayload: Record<string, any> = {};

  if (field === "description") {
    fieldPayload[field] = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: value }],
        },
      ],
    };
  } else {
    fieldPayload[field] = value;
  }

  const response = await fetch(`${domain}/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: fieldPayload }),
  });

  if (!response.ok)
    throw new Error(
      `Failed to update field '${field}': ${response.statusText}`
    );
}

async function createJiraSubtask(
  domain: string,
  email: string,
  token: string,
  parentKey: string,
  summary: string,
  description?: string
) {
  const projectKey = parentKey.split("-")[0];

  const response = await fetch(`${domain}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        summary,
        parent: { key: parentKey },
        project: { key: projectKey },
        issuetype: { name: "Task" },
        ...(description && {
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: description }],
              },
            ],
          },
        }),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create sub-task: ${response.statusText} - ${body}`);
  }

  return await response.json();
}


/*async function createJiraSubtask(
  domain: string,
  email: string,
  token: string,
  parentKey: string,
  summary: string
) {
  const projectKey = parentKey.split("-")[0];

  const metaResponse = await fetch(
    `${domain}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`,
    {
      headers: {
        Authorization: "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
        Accept: "application/json",
      },
    }
  );

  if (!metaResponse.ok) {
    const metaText = await metaResponse.text();
    throw new Error(`Failed to fetch project metadata: ${metaResponse.statusText}\n${metaText}`);
  }

  const meta = await metaResponse.json();
  const subtaskType = meta.projects?.[0]?.issuetypes?.find((t: any) => t.subtask === true);
  if (!subtaskType) throw new Error("⚠️ This project doesn't support sub-tasks.");

  const response = await fetch(`${domain}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        summary,
        issuetype: { id: subtaskType.id },
        parent: { key: parentKey },
        project: { key: projectKey },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create sub-task: ${response.statusText}\n${text}`);
  }

  return await response.json();
}*/

function getAssistantHistory(
  context: vscode.ChatContext
): vscode.LanguageModelChatMessage[] {
  const assistantMessages: vscode.LanguageModelChatMessage[] = [];
  for (const h of context.history) {
    if (h instanceof vscode.ChatResponseTurn) {
      let content = "";
      for (const part of h.response) {
        if (
          typeof part === "object" &&
          "value" in part &&
          typeof part.value === "object" &&
          "value" in part.value
        ) {
          content += (part as any).value.value + "\n";
        }
      }
      if (content.trim()) {
        assistantMessages.push(
          vscode.LanguageModelChatMessage.Assistant(content.trim())
        );
      }
    }
  }
  return assistantMessages;
}

function getLastAssistantMarkdown(context: vscode.ChatContext): string | null {
  const history = [...context.history].reverse();
  for (const h of history) {
    if (h instanceof vscode.ChatResponseTurn) {
      let message = "";
      for (const part of h.response) {
        if (
          typeof part === "object" &&
          "value" in part &&
          typeof part.value === "object" &&
          "value" in part.value
        ) {
          message += (part as any).value.value;
        }
      }
      if (message.trim()) return message.trim();
    }
  }
  return null;
}

function parseSubTasksFromMarkdown(
  md: string
): { title: string; desc: string }[] {
  const lines = md.split("\n");
  const tasks: { title: string; desc: string }[] = [];

  let current: { title: string; desc: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^####\s+\d+\.\s+/.test(trimmed)) {
      if (current) tasks.push(current);
      current = { title: trimmed.replace(/^####\s+\d+\.\s+/, ""), desc: "" };
    } else if (current && trimmed) {
      current.desc += (current.desc ? " " : "") + trimmed;
    }
  }

  if (current) tasks.push(current);
  return tasks;
}

async function updateJiraFields(domain: string, email: string, token: string, issueKey: string, fields: Record<string, any>) {
  const response = await fetch(`${domain}/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: {
      Authorization: "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to update fields: ${response.statusText} - ${body}`);
  }
}
