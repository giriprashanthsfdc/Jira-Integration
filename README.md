stream.markdown(`
### 🤖 Jira Chat Assistant – Help Menu

**🧭 Context Commands:**
- \`set-context project <project-key>\` – Set current project (e.g., \`ABC\`)
- \`set-context story <story-key>\` – Set current story (e.g., \`ABC-123\`)
- \`set-context defect <defect-key>\` – Set current defect (e.g., \`ABC-456\`)
- \`set-context sprint <sprint-name>\` – Set active sprint (e.g., \`Sprint 12\`)
- \`set-context backlog\` – Use backlog as the target context
- \`clear-context\` – Clear all current context
- \`show-context\` – Show current project, story, and sprint context

**🧪 Examples:**
- \`set-context project ABC\`
- \`set-context story ABC-123\`
- \`set-context sprint Sprint 14\`
- \`set-context backlog\`

Type any of the above commands to begin interacting with Jira!
`);

@jira set-context project <project-key>	Sets the current Jira project context (e.g., ABC).
@jira set-context story <story-key>	Sets the current story issue (e.g., ABC-123).
@jira set-context defect <defect-key>	Sets the current defect issue (e.g., ABC-456).
@jira set-context sprint <sprint-id-or-name>	Sets the active sprint context (e.g., Sprint 12).
@jira set-context backlog	Indicates issues should go to backlog (no active sprint).
@jira clear-context	Clears all context: project, story/defect, sprint, backlog.
@jira show-context	Displays the current working context for project, issue, and sprint.

function extractRepoPath(gitUrl) {
  const sshMatch = gitUrl.match(/^git@[^:]+:([^/]+\/[^/]+)\.git$/);
  const httpsMatch = gitUrl.match(/^https:\/\/[^/]+\/([^/]+\/[^/]+)(\.git)?$/);

  if (sshMatch) return sshMatch[1]; // e.g., my-org/my-repo
  if (httpsMatch) return httpsMatch[1]; // e.g., my-org/my-repo
  throw new Error("Unsupported Git URL format");
}

// Example usage:
const url = "git@github.com:my-org/my-repo.git";
const repoPath = extractRepoPath(url);
console.log(repoPath); // ➜ "my-org/my-repo"

 create an aura component code to capture lead fields include the explanation as well by including the file path as per salesforce package.xml as below file path should be inside the code block // File: force-app/main/default/classes/WeightageProcessor.cls

git remote add origin https://github.com/your-username/my-repo.git

# Salesforce DX Project: Next Steps

Now that you’ve created a Salesforce DX project, what’s next? Here are some documentation resources to get you started.

## How Do You Plan to Deploy Your Changes?

Do you want to deploy a set of changes, or create a self-contained application? Choose a [development model](https://developer.salesforce.com/tools/vscode/en/user-guide/development-models).

## Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

## Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
