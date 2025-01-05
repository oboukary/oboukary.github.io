document.addEventListener('DOMContentLoaded', function() {
    const projectsContainer = document.getElementById('projects');
    const filtersContainer = document.getElementById('filters');
    const categories = new Map(); // Utilisation d'une Map pour compter les projets par catégorie

    // Charger les métadonnées des projets depuis le fichier JSON
    fetch('projects-metadata.json')
        .then(response => response.json())
        .then(projectsData => {
            // Générer les projets et collecter les catégories
            projectsData.forEach(project => {
                const projectElement = document.createElement('div');
                projectElement.classList.add('project');
                projectElement.setAttribute('data-categories', JSON.stringify(project.categories));
                projectElement.innerHTML = `
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <a href="${project.file}">Voir le projet</a>
                `;
                projectsContainer.appendChild(projectElement);

                // Compter les projets par catégorie
                project.categories.forEach(cat => {
                    if (!categories.has(cat)) {
                        categories.set(cat, 0);
                    }
                    categories.set(cat, categories.get(cat) + 1);
                });
            });

            // Générer les boutons de filtre avec compteur
            const allButton = document.createElement('button');
            allButton.textContent = `Tous (${projectsData.length})`;
            allButton.classList.add('filter-btn', 'active');
            allButton.onclick = () => {
                filterProjects('all');
                setActiveButton(allButton);
            };
            filtersContainer.appendChild(allButton);

            categories.forEach((count, cat) => {
                const button = document.createElement('button');
                button.innerHTML = `${cat} <span class="count">${count}</span>`;
                button.classList.add('filter-btn');
                button.onclick = () => {
                    filterProjects(cat);
                    setActiveButton(button);
                };
                filtersContainer.appendChild(button);
            });
        })
        .catch(error => console.error('Erreur lors du chargement des métadonnées:', error));
});

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

function setActiveButton(activeButton) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(button => button.classList.remove('active'));
    activeButton.classList.add('active');
}