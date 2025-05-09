import * as vscode from 'vscode';
import fetch from 'node-fetch';
import {
  generateCreateStoryPrompt,
  generateUpdateStoryPrompt,
  generateSubtaskPrompt,
  generateSprintPrompt
} from './promptGenerators/jiraPromptGenerator';
import {
  createStory,
  updateStory,
  createSubTask,
  getSubTasks,
  getSpecificSubTask,
  updateSubTask,
  updateComments,
  createSprint
} from './jiraintegration';

export async function handleContextCommand(chat: vscode.ChatRequest, stream: vscode.ChatResponseStream) {
  const input = chat.prompt?.trim() || '';
  const [_, action, ...args] = input.split(' ');
  const command = action?.toLowerCase();
  const remainder = args.join(' ').trim();

  switch (command) {
    case 'create-story': {
      const prompt = await generateCreateStoryPrompt(remainder);
      const response = await vscode.chat.sendRequest([
        { role: 'system', content: 'You are an assistant that generates Jira payloads from user stories using JSON format.' },
        { role: 'user', content: prompt }
      ]);
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)```/);
      if (!jsonMatch) return stream.markdown('⚠️ Could not extract JSON payload.');
      await createStory(JSON.parse(jsonMatch[1]), stream);
      break;
    }

    case 'update-story': {
      const [issueKey, ...rest] = remainder.split(' ');
      const updateText = rest.join(' ');
      const prompt = await generateUpdateStoryPrompt(issueKey, updateText);
      const response = await vscode.chat.sendRequest([{ role: 'user', content: prompt }]);
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)```/);
      if (!jsonMatch) return stream.markdown('⚠️ Could not extract fields JSON.');
      await updateStory(issueKey, JSON.parse(jsonMatch[1]), stream);
      break;
    }

    case 'create-subtask': {
      const [parentKey, ...task] = remainder.split(' ');
      const prompt = await generateSubtaskPrompt(parentKey, task.join(' '));
      const response = await vscode.chat.sendRequest([{ role: 'user', content: prompt }]);
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)```/);
      if (!jsonMatch) return stream.markdown('⚠️ Could not extract sub-task list.');
      await createSubTask(parentKey, JSON.parse(jsonMatch[1]), stream);
      break;
    }

    case 'get-subtasks':
      await getSubTasks(remainder, stream);
      break;

    case 'get-subtask':
      await getSpecificSubTask(remainder, stream);
      break;

    case 'update-subtask': {
      const [issueKey, ...rest] = remainder.split(' ');
      const prompt = `Generate fields for sub-task update:\n\n${rest.join(' ')}`;
      const response = await vscode.chat.sendRequest([{ role: 'user', content: prompt }]);
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)```/);
      if (!jsonMatch) return stream.markdown('⚠️ Could not extract update fields.');
      await updateSubTask(issueKey, JSON.parse(jsonMatch[1]), stream);
      break;
    }

    case 'update-comment': {
      const [issueKey, ...rest] = remainder.split(' ');
      await updateComments(issueKey, rest.join(' '), stream);
      break;
    }

    case 'create-sprint': {
      const prompt = await generateSprintPrompt(remainder);
      const response = await vscode.chat.sendRequest([{ role: 'user', content: prompt }]);
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)```/);
      if (!jsonMatch) return stream.markdown('⚠️ Could not extract sprint JSON.');
      await createSprint(JSON.parse(jsonMatch[1]), stream);
      break;
    }

    default:
      stream.markdown(`⚠️ Unknown context command: ${command}`);
  }
}
