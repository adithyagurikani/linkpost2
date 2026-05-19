# OpenAI Codex Setup & Antigravity Integration Walkthrough

We have successfully installed the official **OpenAI Codex CLI** (`@openai/codex`) on your system and integrated it directly into your **Google Antigravity** environment as a Model Context Protocol (MCP) server. 

This enables both you (as a developer) and autonomous agents in the Antigravity workspace to call Codex's specialized code editing, review, and terminal execution features directly.

---

## 🛠️ Step 1: Global Installation of OpenAI Codex CLI
We verified that your system uses `NVM` for Node.js management, ensuring you have write permissions to your global NPM directory without needing `sudo`. We ran:

```bash
npm install -g @openai/codex
```

### Verification Details
- **Binary Path**: `/home/arvind/.nvm/versions/node/v24.12.0/bin/codex`
- **CLI Version**: `codex-cli 0.130.0`
- **Primary Command**: `codex`

---

## 🔌 Step 2: Integration with Google Antigravity (MCP Server)
To allow Antigravity agents to orchestrate Codex and utilize its capabilities as a tool, we registered the Codex CLI as an **MCP server** in your Antigravity configuration file.

### Config File Edited
- **Location**: [mcp_config.json](file:///home/arvind/.gemini/antigravity/mcp_config.json)

### Registered Server Configuration
We appended `openai-codex` to the list of `mcpServers` using the absolute path to your global `codex` executable:

```json
{
  "mcpServers": {
    "chrome-devtools-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    },
    "openai-codex": {
      "command": "/home/arvind/.nvm/versions/node/v24.12.0/bin/codex",
      "args": [
        "mcp-server"
      ]
    }
  }
}
```

This starts Codex as a local MCP server running via standard I/O (`stdio`), seamlessly exposing tools like code edits, refactoring, and AI-driven feedback directly inside this workspace.

---

## 🚀 How to Use Codex

### 1. From the Terminal (CLI)
You can run Codex interactively by running the following command from the root of your project:
```bash
codex
```
*Note: On your first run, Codex will prompt you to authenticate with your OpenAI/ChatGPT account.*

### 2. Common CLI Operations
*   **Run a Code Review**:
    ```bash
    codex review
    ```
*   **Execute a Prompt Non-Interactively**:
    ```bash
    codex exec "Create a new helper function to format LinkedIn post timestamps"
    ```
*   **Apply Latest Agent Changes**:
    ```bash
    codex apply
    ```

---

> [!IMPORTANT]
> **Authentication Notice**: Since the Codex CLI runs locally on your machine and communicates with OpenAI's models via your own account, make sure you are logged in by running `codex login` in your terminal if prompted.
