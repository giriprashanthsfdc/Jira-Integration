import * as vscode from 'vscode';
import fetch from 'node-fetch';

const getAuthHeaders = () => {
  const jiraDomain = vscode.workspace.getConfiguration().get<string>('jira.domain');
  const jiraToken = vscode.workspace.getConfiguration().get<string>('jira.apiToken');
  const jiraEmail = vscode.workspace.getConfiguration().get<string>('jira.email');

  if (!jiraDomain || !jiraToken || !jiraEmail) {
    throw new Error('Missing Jira configuration in settings.');
  }

  const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`;
  return {
    jiraDomain,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  };
};

export async function createStory(payload: any, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/issue`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields: payload })
    });

    if (res.ok) {
      const body = await res.json();
      stream.markdown(`✅ Story created: [${body.key}](${jiraDomain}/browse/${body.key})`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to create Jira story:\n\n\`\`\`json\n${err}\n\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error: ${error.message}`);
  }
}

export async function updateStory(issueKey: string, fields: any, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fields })
    });

    if (res.ok) {
      stream.markdown(`✅ Story [${issueKey}] updated successfully.`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to update story:\n\n\`\`\`json\n${err}\n\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error: ${error.message}`);
  }
}

export async function createProject(projectPayload: any, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/project`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(projectPayload)
    });

    if (res.ok) {
      const body = await res.json();
      stream.markdown(`✅ Project created: ${body.key}`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to create project:\n\n\`\`\`json\n${err}\n\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error: ${error.message}`);
  }
}

export async function createSprint(sprintPayload: any, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/agile/1.0/sprint`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(sprintPayload)
    });

    if (res.ok) {
      const body = await res.json();
      stream.markdown(`✅ Sprint created: ${body.name}`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to create sprint:\n\n\`\`\`json\n${err}\n\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error: ${error.message}`);
  }
}

export async function createSubTask(parentKey: string, subTasks: any[], stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/issue`;

    for (const subTask of subTasks) {
      const payload = {
        fields: {
          ...subTask,
          issuetype: { name: 'Sub-task' },
          parent: { key: parentKey }
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const body = await res.json();
        stream.markdown(`✅ Sub-task created: [${body.key}](${jiraDomain}/browse/${body.key})`);
      } else {
        const err = await res.text();
        stream.markdown(`❌ Failed to create sub-task:\n\n\`\`\`json\n${err}\n\`\`\``);
      }
    }
  } catch (error: any) {
    stream.markdown(`❌ Error: ${error.message}`);
  }
}

export async function getSubTasks(parentKey: string, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/search?jql=${encodeURIComponent(`parent=${parentKey}`)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers
    });

    if (res.ok) {
      const body = await res.json();
      if (body.issues.length === 0) {
        stream.markdown(`ℹ️ No sub-tasks found for parent [${parentKey}](${jiraDomain}/browse/${parentKey}).`);
        return;
      }

      for (const issue of body.issues) {
        stream.markdown(`🔹 Sub-task: [${issue.key}](${jiraDomain}/browse/${issue.key}) - ${issue.fields.summary}`);
      }
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to fetch sub-tasks:\n\n\`\`\`json\n${err}\n\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error: ${error.message}`);
  }
}

export async function getSpecificSubTask(issueKey: string, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}`;

    const res = await fetch(url, {
      method: 'GET',
      headers
    });

    if (res.ok) {
      const issue = await res.json();
      const subtaskUrl = `${jiraDomain}/browse/${issue.key}`;
      stream.markdown(`🔍 Sub-task details for [${issue.key}](${subtaskUrl}):\n\n- **Summary**: ${issue.fields.summary}\n- **Status**: ${issue.fields.status.name}\n- **Assignee**: ${issue.fields.assignee?.displayName || 'Unassigned'}\n- **Created**: ${issue.fields.created}`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to fetch sub-task [${issueKey}]:\n\n\`\`\`json\n${err}\n\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error fetching sub-task [${issueKey}]: ${error.message}`);
  }
}
export async function updateSubTask(issueKey: string, fields: any, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fields })
    });

    if (res.ok) {
      stream.markdown(`✅ Sub-task [${issueKey}] updated successfully.`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to update sub-task:

\`\`\`json
${err}
\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error updating sub-task [${issueKey}]: ${error.message}`);
  }
}

export async function updateComments(issueKey: string, commentBody: string, stream: vscode.ChatResponseStream) {
  try {
    const { jiraDomain, headers } = getAuthHeaders();
    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}/comment`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: commentBody })
    });

    if (res.ok) {
      const comment = await res.json();
      stream.markdown(`💬 Comment added to [${issueKey}](${jiraDomain}/browse/${issueKey}): _${comment.body}_`);
    } else {
      const err = await res.text();
      stream.markdown(`❌ Failed to add comment to [${issueKey}]:

\`\`\`json
${err}
\`\`\``);
    }
  } catch (error: any) {
    stream.markdown(`❌ Error adding comment to [${issueKey}]: ${error.message}`);
  }
}
