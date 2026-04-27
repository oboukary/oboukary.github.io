document.addEventListener('DOMContentLoaded', function() {
    const filtersContainer = document.getElementById('filters');
    const projectsContainer = document.getElementById('projects');
    const categories = new Set();

    // Charger les projets dynamiquement
    fetch('../../assets/projects-metadata.json')
        .then(response => response.json())
        .then(projectsData => {
            // Générer les projets et collecter les catégories
            projectsData.forEach(project => {
                const projectElement = document.createElement('div');
                projectElement.classList.add('project');
                projectElement.setAttribute('data-categories', JSON.stringify(project.categories));
                projectElement.innerHTML = `
                    <img src="${project.image}" alt="${project.title}">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <a href="${project.file}">Voir le projet</a>
                `;
                projectsContainer.appendChild(projectElement);

                // Compter les projets par catégorie
                project.categories.forEach(cat => categories.add(cat));
            });

            // Générer les boutons de filtre
            const allButton = document.createElement('button');
            allButton.textContent = `Tous (${projectsData.length})`;
            allButton.classList.add('filter-btn', 'active');
            allButton.setAttribute('data-category', 'all');
            allButton.onclick = () => {
                filterProjects('all');
                setActiveButton(allButton);
            };
            filtersContainer.appendChild(allButton);

            categories.forEach(cat => {
                const count = projectsData.filter(project => project.categories.includes(cat)).length;
                const button = document.createElement('button');
                button.textContent = `${cat} (${count})`;
                button.classList.add('filter-btn');
                button.setAttribute('data-category', cat);
                button.onclick = () => {
                    filterProjects(cat);
                    setActiveButton(button);
                };
                filtersContainer.appendChild(button);
            });
        })
        .catch(error => console.error('Erreur lors du chargement des métadonnées:', error));
});

// Fonction pour filtrer les projets
function filterProjects(category) {
    const projects = document.querySelectorAll('.project');
    projects.forEach(project => {
        const projectCategories = JSON.parse(project.getAttribute('data-categories'));
        if (category === 'all' || projectCategories.includes(category)) {
            project.style.display = 'block';
        } else {
            project.style.display = 'none';
        }
    });
}

// Fonction pour définir le bouton actif
function setActiveButton(activeButton) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(button => button.classList.remove('active'));
    activeButton.classList.add('active');
}