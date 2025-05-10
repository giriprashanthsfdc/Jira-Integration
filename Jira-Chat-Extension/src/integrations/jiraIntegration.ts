import * as vscode from 'vscode';
import fetch from 'node-fetch';

const config = vscode.workspace.getConfiguration();
const jiraDomain = config.get<string>('jira.domain');
const jiraEmail = config.get<string>('jira.email');
const apiToken = config.get<string>('jira.apiToken');
const baseHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(`${jiraEmail}:${apiToken}`).toString('base64')}`
};

function buildUrl(path: string): string {
  return `${jiraDomain}/rest/api/3/${path}`;
}

export async function createStory(payload: any, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl('issue'), {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ fields: payload })
  });
  if (!res.ok) return stream.markdown('❌ Failed to create story');
  const json = await res.json();
  stream.markdown(`✅ Story created: [${json.key}](${jiraDomain}/browse/${json.key})`);
}

export async function updateStory(issueKey: string, fields: any, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl(`issue/${issueKey}`), {
    method: 'PUT',
    headers: baseHeaders,
    body: JSON.stringify({ fields })
  });
  if (!res.ok) return stream.markdown('❌ Failed to update story');
  stream.markdown(`✅ Story [${issueKey}] updated.`);
}

export async function createSubTask(parentKey: string, subTasks: any[], stream: vscode.ChatResponseStream) {
  for (const task of subTasks) {
    const body = {
      fields: {
        ...task,
        issuetype: { name: 'Sub-task' },
        parent: { key: parentKey }
      }
    };
    const res = await fetch(buildUrl('issue'), {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const json = await res.json();
      stream.markdown(`✅ Sub-task created: [${json.key}](${jiraDomain}/browse/${json.key})`);
    }
  }
}

export async function getSubTasks(issueKey: string, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl(`search?jql=parent=${issueKey}`), {
    headers: baseHeaders
  });
  const data = await res.json();
  const tasks = data.issues.map((i: any) => `- [${i.key}] ${i.fields.summary}`).join('\n');
  stream.markdown(`### Sub-tasks for ${issueKey}:\n${tasks}`);
}

export async function getSpecificSubTask(issueKey: string, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl(`issue/${issueKey}`), { headers: baseHeaders });
  const task = await res.json();
  stream.markdown(`**${task.key}**: ${task.fields.summary}\n${task.fields.description}`);
}

export async function updateSubTask(issueKey: string, fields: any, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl(`issue/${issueKey}`), {
    method: 'PUT',
    headers: baseHeaders,
    body: JSON.stringify({ fields })
  });
  if (!res.ok) return stream.markdown('❌ Failed to update sub-task');
  stream.markdown(`✅ Sub-task [${issueKey}] updated.`);
}

export async function updateComments(issueKey: string, commentBody: string, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl(`issue/${issueKey}/comment`), {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ body: commentBody })
  });
  if (!res.ok) return stream.markdown('❌ Failed to add comment');
  stream.markdown(`💬 Comment added to [${issueKey}](${jiraDomain}/browse/${issueKey})`);
}

export async function createSprint(payload: any, stream: vscode.ChatResponseStream) {
  const res = await fetch(buildUrl('sprint'), {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(payload)
  });
  if (!res.ok) return stream.markdown('❌ Failed to create sprint');
  const json = await res.json();
  stream.markdown(`🚀 Sprint created: ${json.name}`);
}
