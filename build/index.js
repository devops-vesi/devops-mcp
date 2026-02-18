#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import { z } from "zod";
const server = new McpServer({
    name: "devops",
    version: "1.0.0",
});
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || undefined
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
server.registerTool("list_skills", {
    description: "Lists all available DevOps skills (SAP Fiori documentation templates, code standards, best practices). Use this tool BEFORE generating documentation or reading project content.",
    inputSchema: {
        category: z.string()
            .optional()
            .describe("Optional category to filter skills")
    }
}, async ({ category }) => {
    try {
        const skills = await listSkills(category);
        const formattedSkills = skills.map(skill => `- **${skill.name}** (${skill.category})\n  Path: ${skill.path}`).join('\n\n');
        return {
            content: [{
                    type: "text",
                    text: `# Available Skills\n\n${formattedSkills}\n\n**Total**: ${skills.length} skill(s)`
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error while fetching skills: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
            isError: true
        };
    }
});
server.registerTool("fetch_skill", {
    description: "Fetches a DevOps skill from GitHub (documentation templates, code standards, best practices). Use when the user requests to generate documentation, apply standards, or use a template.",
    inputSchema: z.object({
        skillName: z.string().describe("The name of the skill to fetch")
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
                    text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
                }
            ],
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
