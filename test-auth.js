import dotenv from "dotenv";
import { Octokit } from "octokit";

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

async function testAuth() {
    try {
        // Test 1: Vérifier l'utilisateur
        console.log("Test 1: Vérification de l'authentification...");
        const { data: user } = await octokit.rest.users.getAuthenticated();
        console.log(`✅ Connecté en tant que: ${user.login}`);

        // Test 2: Accéder au repo
        console.log("\nTest 2: Accès au repository...");
        const { data: repo } = await octokit.rest.repos.get({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO
        });
        console.log(`✅ Repository trouvé: ${repo.full_name}`);
        console.log(`   Visibilité: ${repo.private ? 'Privé' : 'Public'}`);

        //Test 3: Lister le contenu du dossier skills
        console.log("\nTest 3: Contenu du dossier 'skills'...");
        const { data: skillsContent } = await octokit.rest.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: "skills"
        });
        console.log(`✅ Dossiers trouvés:`, Array.isArray(skillsContent) ? skillsContent.map(f => f.name) : [skillsContent.name]);

    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        if (error.status === 401) {
            console.error("   → Le token est invalide ou expiré");
        } else if (error.status === 404) {
            console.error("   → Le repository n'existe pas ou le token n'a pas accès");
        }
    }
}

testAuth();
