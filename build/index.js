import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import path from "path";
import { z } from "zod";
import fs from 'fs';
const server = new McpServer({
    name: "devops",
    version: "1.0.0",
});
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});
async function listSkills(category) {
    try {
        const skillsPath = category ? `skills/${category}` : 'skills';
        const response = await octokit.rest.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: skillsPath
        });
        if (!Array.isArray(response.data)) {
            throw new Error(`Le chemin '${skillsPath}' ne pointe pas vers un dossier`);
        }
        const skillFolders = response.data.filter(item => item.type === 'dir');
        const skills = skillFolders.map(folder => ({
            name: folder.name,
            path: folder.path,
            category: category || 'root',
            url: folder.html_url
        }));
        return skills;
    }
    catch (error) {
        throw new Error(`Impossible de lister les skills: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}
async function fetchSkill(skillName) {
    const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: `skills/${skillName}/skill.md`
    });
    if (!Array.isArray(response.data) && 'content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString();
        return content;
    }
    throw new Error(`Impossible de récupérer le skill "${skillName}"`);
}
async function listFiles(basePath, relativePath) {
    const fullPath = path.join(basePath, relativePath);
    if (!fs.existsSync(fullPath)) {
        return [];
    }
    const files = fs.readdirSync(fullPath);
    return files.map(file => path.join(relativePath, file));
}
async function analyzeApp(appPath) {
    const manifestPath = path.join(appPath, 'webapp/manifest.json');
    const packagePath = path.join(appPath, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const packageJson = fs.existsSync(packagePath)
        ? JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
        : {};
    return {
        appId: manifest['sap.app']?.id,
        title: manifest['sap.app']?.title,
        description: manifest['sap.app']?.description,
        version: manifest['sap.app']?.applicationVersion?.version,
        author: packageJson.author,
        dependencies: Object.keys(packageJson.dependencies || {}),
        scripts: packageJson.scripts,
        controllers: listFiles(appPath, 'webapp/controller'),
        views: listFiles(appPath, 'webapp/view'),
        models: listFiles(appPath, 'webapp/model'),
        i18n: listFiles(appPath, 'webapp/i18n'),
        dataSources: manifest['sap.app']?.dataSources,
        routes: manifest['sap.ui5']?.routing?.routes || [],
    };
}
server.registerTool("list_skills", {
    description: "Liste tous les skills DevOps disponibles dans le repository GitHub. Utilisez ce tool pour découvrir les templates de documentation, standards de code, et autres skills disponibles.",
    inputSchema: {
        category: z.string()
            .optional()
            .describe("Catégorie optionnelle pour filtrer les skills")
    }
}, async ({ category }) => {
    try {
        const skills = await listSkills(category);
        // Formatter la réponse pour être lisible
        const formattedSkills = skills.map(skill => `- **${skill.name}** (${skill.category})\n  Path: ${skill.path}`).join('\n\n');
        return {
            content: [{
                    type: "text",
                    text: `# Skills Disponibles\n\n${formattedSkills}\n\n**Total**: ${skills.length} skill(s)`
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Erreur lors de la récupération des skills: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
                }],
            isError: true
        };
    }
});
server.registerTool("fetch_skill", {
    description: "Récupère le contenu d'un skill DevOps depuis le repository GitHub",
    inputSchema: z.object({
        skillName: z.string().describe("Le nom du skill à récupérer (ex: documentation-templates)")
    })
}, async ({ skillName }) => {
    try {
        const content = await fetchSkill(skillName);
        return {
            content: [
                {
                    type: "text",
                    text: content
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
                }
            ],
            isError: true
        };
    }
});
server.registerTool("analyse_app", {
    description: "Analyse une application SAP Fiori et retourne les informations extraites du manifest et du package.json",
    inputSchema: z.object({
        appPath: z.string().describe("Le chemin local vers l'application à analyser")
    })
}, async ({ appPath }) => {
    try {
        const analysis = await analyzeApp(appPath);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(analysis, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
                }],
            isError: true
        };
    }
});
server.registerTool("get_app_documentation_data", {
    description: "Récupère le template de documentation et les données de l'application",
    inputSchema: z.object({
        appPath: z.string().describe("Chemin vers l'application"),
        templateName: z.string().describe("Nom du template de documentation à utiliser (ex: documentation-templates)")
    })
}, async ({ appPath, templateName }) => {
    try {
        const template = await fetchSkill(templateName);
        const appData = await analyzeApp(appPath);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        template: template,
                        appData: appData
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}` }],
            isError: true
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Devops MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
