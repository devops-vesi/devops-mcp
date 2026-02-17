import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

async function testTool() {
    console.error("=== Test du tool fetch_skill ===\n");

    try {
        const response = await octokit.rest.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: "skills/documentation-templates/skill.md"
        });

        if (!Array.isArray(response.data) && 'content' in response.data) {
            const content = Buffer.from(response.data.content, 'base64').toString();
            console.error("✅ Skill récupéré avec succès!\n");
            console.error("Contenu du skill:");
            console.error("=".repeat(60));
            console.log(content);  // stdout pour le contenu complet
            console.error("=".repeat(60));
        }
    } catch (error) {
        console.error("❌ Erreur:", error.message);
    }
}

testTool();
