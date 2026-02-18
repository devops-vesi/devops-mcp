
# DevOps MCP

MCP (Model Context Protocol) server to fetch DevOps skills from GitHub (SAP Fiori documentation templates, code standards, best practices).

## Installation

### Quick installation (for your colleagues)

1. Install the package:
```bash
npm install -g @devops-vinci/mcp
```

2. Click this link to auto-configure VS Code (fully pre-configured):

**[📦 Install DevOps MCP - Vinci Energies](vscode:mcp/install?%7B%22name%22%3A%22devops%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22%40devops-vinci%2Fmcp%22%5D%2C%22env%22%3A%7B%22GITHUB_OWNER%22%3A%22devops-vesi%22%2C%22GITHUB_REPO%22%3A%22devops-skills%22%7D%7D)**

✅ **That's it!** No further configuration needed.

---

### Manual configuration (alternative)

```bash
npm install -g @devops-vinci/mcp
```

Then add this configuration to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "devops": {
      "command": "node",
      "args": ["@devops-vinci/mcp"],
      "env": {
        "GITHUB_OWNER": "devops-vesi",
        "GITHUB_REPO": "devops-skills"
      }
    }
  }
}
```

## Available tools

### `list_skills`
Lists all available DevOps skills in your GitHub repository.

### `fetch_skill`
Fetches the content of a specific skill from GitHub.

## Usage examples

Just ask Copilot:
- "List available skills"
- "Fetch the documentation-templates skill"
- "Generate documentation for this Fiori project"

## License

MIT
