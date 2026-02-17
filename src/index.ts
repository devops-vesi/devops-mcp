import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import { z } from "zod";

const server = new McpServer({
    name: "devops",
    version: "1.0.0",
});

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});


async function listSkills(category?: string): Promise<any[]> {
    try {
        const skillsPath = category ? `skills/${category}` : 'skills';

        const response = await octokit.rest.repos.getContent({
            owner: process.env.GITHUB_OWNER!,
            repo: process.env.GITHUB_REPO!,
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

    } catch (error) {
        throw new Error(`Impossible de lister les skills: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

async function fetchSkill(skillName: string) {
    const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: `skills/${skillName}/skill.md`
    });

    if (!Array.isArray(response.data) && 'content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString();
        return content;
    }

    throw new Error(`Impossible de récupérer le skill "${skillName}"`);
}

server.registerTool(
    "list_skills",
    {
        description: "Liste tous les skills DevOps disponibles dans le repository GitHub. Utilisez ce tool pour découvrir les templates de documentation, standards de code, et autres skills disponibles.",
        inputSchema: {
            category: z.string()
                .optional()
                .describe("Catégorie optionnelle pour filtrer les skills")
        }
    },
    async ({ category }) => {
        try {
            const skills = await listSkills(category);

            const formattedSkills = skills.map(skill =>
                `- **${skill.name}** (${skill.category})\n  Path: ${skill.path}`
            ).join('\n\n');

            return {
                content: [{
                    type: "text",
                    text: `# Skills Disponibles\n\n${formattedSkills}\n\n**Total**: ${skills.length} skill(s)`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Erreur lors de la récupération des skills: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
                }],
                isError: true
            };
        }
    }
);

server.registerTool(
    "fetch_skill",
    {
        description: "Récupère le contenu d'un skill DevOps depuis le repository GitHub",
        inputSchema: z.object({
            skillName: z.string().describe("Le nom du skill à récupérer")
        })
    },
    async ({ skillName }) => {
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
        } catch (error) {
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
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Devops MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});