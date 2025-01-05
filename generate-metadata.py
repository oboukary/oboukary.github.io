import os
import yaml
import json
import re

# Répertoire contenant les fichiers Quarto
projects_dir = 'projects'

# Fonction pour lire les métadonnées YAML d'un fichier Quarto
def read_metadata(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        # Utilisation d'une expression régulière pour extraire le bloc YAML
        yaml_regex = r'^---\s*([\s\S]*?)\s*---'
        match = re.match(yaml_regex, content)
        if match:
            return yaml.safe_load(match.group(1))
        return None

# Récupérer tous les sous-dossiers dans le répertoire
subfolders = [f for f in os.listdir(projects_dir) if os.path.isdir(os.path.join(projects_dir, f))]

# Générer un tableau de métadonnées
metadata = []
for folder in subfolders:
    file_path = os.path.join(projects_dir, folder, 'index.qmd')
    if os.path.exists(file_path):
        meta = read_metadata(file_path)
        if meta:
            metadata.append({
                'title': meta.get('title', 'Sans titre'),
                'categories': meta.get('categories', []),
                'description': meta.get('subtitle', ''),
                'image': meta.get('image', ''),
                'file': os.path.join(folder, 'index.html')  # Lien vers la version HTML du projet
            })

# Exporter les métadonnées en JSON
with open('projects-metadata.json', 'w', encoding='utf-8') as json_file:
    json.dump(metadata, json_file, ensure_ascii=False, indent=2)

print('Métadonnées exportées avec succès dans projects-metadata.json')
