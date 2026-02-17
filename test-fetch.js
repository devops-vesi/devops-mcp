import dotenv from "dotenv";
import { Octokit } from "octokit";

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

async function testFetch() {
    try {
        console.log("Testing GitHub API...");
        console.log(`Owner: ${process.env.GITHUB_OWNER}`);
        console.log(`Repo: ${process.env.GITHUB_REPO}`);

        // Lister le contenu du dossier documentation-templates
        console.log("\n1. Contenu de skills/documentation-templates:");
        const dirResponse = await octokit.rest.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: "skills/documentation-templates"
        });
        console.log("Fichiers:", Array.isArray(dirResponse.data) ? dirResponse.data.map(f => f.name) : [dirResponse.data.name]);

        // Récupérer le fichier skill.md
        console.log("\n2. Récupération de skill.md:");
        const response = await octokit.rest.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: "skills/documentation-templates/skill.md"
        });

        if (!Array.isArray(response.data) && 'content' in response.data) {
            const content = Buffer.from(response.data.content, 'base64').toString();
            console.log("\n✅ SUCCESS! Skill content:");
            console.log("=".repeat(50));
            console.log(content.substring(0, 500));
            console.log("=".repeat(50));
        }
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        console.error("Status:", error.status);
    }
}

testFetch();
