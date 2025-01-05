const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Répertoire contenant les fichiers Quarto
const projectsDir = path.join(__dirname, 'projects'); // Remplacez par le chemin de votre répertoire de projets

// Fonction pour lire les métadonnées YAML d'un fichier Quarto
function readMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const yamlRegex = /^---\s*([\s\S]*?)\s*---/;
    const match = content.match(yamlRegex);
    if (match) {
        return yaml.load(match[1]);
    }
    return null;
}

// Récupérer tous les fichiers Quarto dans le répertoire
const projectFiles = fs.readdirSync(projectsDir).filter(file => file.endsWith('.qmd'));

// Générer un tableau de métadonnées
const metadata = projectFiles.map(file => {
    const filePath = path.join(projectsDir, file);
    const meta = readMetadata(filePath);
    return {
        title: meta.title || 'Sans titre',
        categories: meta.categories || [],
        description: meta.description || '',
        file: file.replace('.qmd', '.html') // Lien vers la version HTML du projet
    };
});

// Exporter les métadonnées en JSON
fs.writeFileSync(path.join(__dirname, 'projects-metadata.json'), JSON.stringify(metadata, null, 2));

console.log('Métadonnées exportées avec succès dans projects-metadata.json');