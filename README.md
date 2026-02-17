# DevOps MCP

MCP (Model Context Protocol) server pour récupérer des skills DevOps depuis GitHub (templates de documentation SAP Fiori, standards de code, bonnes pratiques).

## Installation

### Installation simplifiée (pour vos collègues)

1. Installer le package :
```bash
npm install -g @devops/mcp
```

2. Cliquer sur ce lien pour auto-configurer VS Code (configuration complète incluse) :

**[📦 Installer DevOps MCP - Vinci Energies](vscode:mcp/install?%7B%22name%22%3A%22devops%22%2C%22command%22%3A%22node%22%2C%22args%22%3A%5B%22%40devops%2Fmcp%22%5D%2C%22env%22%3A%7B%22GITHUB_OWNER%22%3A%22devops-vesi%22%2C%22GITHUB_REPO%22%3A%22devops-skills%22%7D%7D)**

✅ **C'est tout !** Aucune configuration supplémentaire nécessaire.

---

### Configuration manuelle (alternative)

```bash
npm install -g @devops/mcp
```

Puis ajoutez cette configuration dans `.cursor/mcp.json` :

```json
{
  "mcpServers": {
    "devops": {
      "command": "node",
      "args": ["@devops/mcp"],
      "env": {
        "GITHUB_OWNER": "devops-vesi",
        "GITHUB_REPO": "devops-skills"
      }
    }
  }
}
```

## Outils disponibles

### `list_skills`
Liste tous les skills DevOps disponibles dans votre repository GitHub.

### `fetch_skill`
Récupère le contenu d'un skill spécifique depuis GitHub.

## Exemples d'utilisation

Demandez simplement à Copilot :
- "Liste les skills disponibles"
- "Récupère le skill documentation-templates"
- "Génère la documentation pour ce projet Fiori"

## License

MIT
