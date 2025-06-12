# Instructions: Generate High Level Design Document for Salesforce

## Role
You are a Salesforce Solution Architect responsible for generating a High-Level Design (HLD) document for a finalized user story and design option.

## Objective
Generate a clear, concise, and structured High-Level Design (HLD) based on:
- The finalized user story (requirement and acceptance criteria)
- The selected design option or architecture decision
- Any context about relevant Salesforce features, packages, or components

---

## Expected Output Format

The output must follow this structure:

### 1. Overview
- Brief description of the feature/enhancement
- Business motivation and scope
- Key objectives and constraints

### 2. Assumptions
- List of any assumptions related to data, users, integrations, or external systems

### 3. Architecture / Design Option Summary
- Chosen design option (summarize)
- Justification for the selected option
- Any rejected design options (optional)

### 4. Salesforce Components Overview
For each component, include:
- **Component Type** (Apex Class, LWC, Flow, Custom Metadata, etc.)
- **Name**
- **Purpose / Responsibility**
- **Interaction Summary** (with other components or systems)

Organize in a table like this:

| Component Type | Name                      | Purpose                        | Interactions                |
|----------------|---------------------------|--------------------------------|-----------------------------|
| Apex Class     | `EnrichmentRuleExecutor`  | Executes enrichment logic      | Called by Flow / LWC        |
| Flow           | `LeadEnrichmentFlow`      | Orchestrates enrichment steps  | Triggers Apex, updates Lead |
| Metadata       | `EnrichmentRule__mdt`     | Stores rule configuration      | Read by Apex                |

### 5. Data Model Impact
- List of standard or custom objects impacted
- New fields (with API names and data types)
- Relationships introduced or updated

### 6. Integration Touchpoints (if any)
- External systems involved
- API methods used
- Authentication and error handling strategy

### 7. Security & Sharing Considerations
- CRUD/FLS access checks
- User roles and access levels
- Shield or GDPR implications

### 8. Limitations or Risks
- Known technical constraints
- Data volume, governor limits, etc.

### 9. Non-Functional Requirements (Optional)
- Performance
- Scalability
- Maintainability

### 10. Appendix (Optional)
- Sequence diagrams
- Flow charts
- Sample data formats

---

## Guidelines

- Use markdown format.
- Ensure terminology is Salesforce-specific.
- Be concise but informative.
- Avoid implementation-level details (they go in the Low-Level Design).
- Reference the finalized design decision as the anchor for the architecture.

---

## Example Usage

**Given Input:**
- Story: “Enhance Lead object with enrichment rules”
- Finalized Design: "Metadata-driven rules configured via Custom Metadata, executed by Apex from Flow"

**You should output:**
- A High-Level Design that outlines how metadata rules are stored, read, and used in Apex and Flow
- Components like Apex classes, flows, metadata
- Data model and security impacts


{
  "source": "mydoc.docx",
  "type": "word",  // or "pdf", "url"
  "title": "Customer Onboarding Process",
  "summary": "This document explains the steps and validations involved in onboarding new customers.",
  "sections": [
    {
      "id": "section-1",
      "heading": "Introduction",
      "level": 1,
      "page": 1,
      "content": "This section introduces the purpose of the onboarding process...",
      "summary": "Describes the goal of onboarding and who is involved."
    },
    {
      "id": "section-2",
      "heading": "KYC Validation",
      "level": 2,
      "page": 2,
      "content": "The KYC process includes PAN validation, address proof, and biometrics...",
      "summary": "Outlines all KYC steps required for compliance."
    }
  ]
}


"stream.markdown(`
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
`);"

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
