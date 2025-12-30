// State management
let activeSection = null;
let hoveredParty = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeVennDiagram();
    renderPartyCards();
    setupEventListeners();
});

// Initialize Venn diagram interactions
function initializeVennDiagram() {
    const interactiveAreas = document.querySelectorAll('.interactive-area');

    interactiveAreas.forEach(area => {
        // Click event
        area.addEventListener('click', () => handleAreaClick(area.id));

        // Keyboard navigation
        area.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAreaClick(area.id);
            }
        });

        // Hover effects
        area.addEventListener('mouseenter', () => {
            if (activeSection !== area.id) {
                highlightArea(area.id, true);
            }
        });

        area.addEventListener('mouseleave', () => {
            if (activeSection !== area.id) {
                highlightArea(area.id, false);
            }
        });
    });
}

// Handle area click/tap
function handleAreaClick(areaId) {
    const normalizedId = areaId;

    if (activeSection === normalizedId) {
        // Close if clicking the same area
        closeInfoPanel();
    } else {
        // Open new section
        activeSection = normalizedId;
        displayPolicyInfo(normalizedId);
        highlightArea(normalizedId, true, true);
    }
}

// Display policy information
function displayPolicyInfo(sectionId) {
    const data = commonGround[sectionId];
    if (!data) return;

    const panel = document.getElementById('info-panel');
    const title = document.getElementById('info-title');
    const subtitle = document.getElementById('info-subtitle');
    const policiesList = document.getElementById('info-policies');

    // Update content
    title.textContent = data.title;
    subtitle.textContent = data.subtitle || '';
    subtitle.style.display = data.subtitle ? 'block' : 'none';

    // Clear and populate policies
    policiesList.innerHTML = '';
    data.policies.forEach(policy => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="check-icon">✓</span><span>${policy}</span>`;
        policiesList.appendChild(li);
    });

    // Style the panel border
    panel.style.borderLeftColor = data.color;
    panel.style.display = 'block';

    // Smooth scroll to panel on mobile
    if (window.innerWidth < 768) {
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Close info panel
function closeInfoPanel() {
    const panel = document.getElementById('info-panel');
    panel.style.display = 'none';

    // Remove highlight from all areas
    if (activeSection) {
        highlightArea(activeSection, false);
    }

    activeSection = null;
}

// Highlight/unhighlight SVG areas
function highlightArea(areaId, highlight, active = false) {
    const element = document.getElementById(areaId);
    if (!element) return;

    const fills = {
        'left-bloc': { default: '#DC262620', hover: '#DC262640', active: '#DC262650' },
        'right-bloc': { default: '#4B556320', hover: '#4B556340', active: '#4B556350' },
        'all-parties': { default: '#6B728030', hover: '#6B728050', active: '#6B728060' },
        'national-labour': { default: '#7C3AED30', hover: '#7C3AED50', active: '#7C3AED60' },
        'act-green': { default: '#65A30D30', hover: '#65A30D50', active: '#65A30D60' },
        'national-nzfirst': { default: '#0369A130', hover: '#0369A150', active: '#0369A160' }
    };

    const colors = fills[areaId];
    if (!colors) return;

    if (active) {
        element.setAttribute('fill', colors.active);
    } else if (highlight) {
        element.setAttribute('fill', colors.hover);
    } else {
        element.setAttribute('fill', colors.default);
    }
}

// Render party cards
function renderPartyCards() {
    const container = document.getElementById('party-cards');

    Object.entries(partyPolicies).forEach(([key, party]) => {
        const card = document.createElement('div');
        card.className = 'party-card';
        card.dataset.party = key;
        card.tabIndex = 0;
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `${party.name} party policies`);

        // Set colors
        const bgColor = partyColors[key] + '30';
        const borderColor = partyColors[key];
        const textColor = key === 'act' ? '#FDE047' : (partyColors[key] === '#1E1E1E' ? '#9CA3AF' : partyColors[key]);

        card.style.backgroundColor = bgColor;
        card.style.borderTop = `3px solid ${borderColor}`;

        card.innerHTML = `
            <h4 style="color: ${textColor}">${party.name}</h4>
            <p class="leader">${party.leader}</p>
            <p class="policy-header">Key Distinctive Policies:</p>
            <ul class="unique-policies">
                ${party.unique.map(policy => `<li>${policy}</li>`).join('')}
            </ul>
        `;

        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.classList.add('hovered');
            hoveredParty = key;
            highlightRelatedAreas(key);
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovered');
            hoveredParty = null;
            unhighlightRelatedAreas(key);
        });

        // Keyboard focus
        card.addEventListener('focus', () => {
            card.classList.add('focused');
            highlightRelatedAreas(key);
        });

        card.addEventListener('blur', () => {
            card.classList.remove('focused');
            unhighlightRelatedAreas(key);
        });

        container.appendChild(card);
    });
}

// Highlight related areas when hovering party cards
function highlightRelatedAreas(partyKey) {
    const areaMapping = {
        'labour': ['left-bloc', 'national-labour'],
        'green': ['left-bloc', 'act-green'],
        'national': ['right-bloc', 'national-labour', 'national-nzfirst'],
        'act': ['right-bloc', 'act-green'],
        'nzfirst': ['right-bloc', 'national-nzfirst']
    };

    const areas = areaMapping[partyKey] || [];
    areas.forEach(areaId => {
        if (activeSection !== areaId) {
            highlightArea(areaId, true);
        }
    });
}

// Unhighlight related areas
function unhighlightRelatedAreas(partyKey) {
    const areaMapping = {
        'labour': ['left-bloc', 'national-labour'],
        'green': ['left-bloc', 'act-green'],
        'national': ['right-bloc', 'national-labour', 'national-nzfirst'],
        'act': ['right-bloc', 'act-green'],
        'nzfirst': ['right-bloc', 'national-nzfirst']
    };

    const areas = areaMapping[partyKey] || [];
    areas.forEach(areaId => {
        if (activeSection !== areaId) {
            highlightArea(areaId, false);
        }
    });
}

// Setup additional event listeners
function setupEventListeners() {
    // Close panel button
    const closeBtn = document.getElementById('close-panel');
    closeBtn.addEventListener('click', closeInfoPanel);

    // Escape key to close panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeSection) {
            closeInfoPanel();
        }
    });

    // Click outside to close (optional)
    const panel = document.getElementById('info-panel');
    document.addEventListener('click', (e) => {
        if (activeSection && !panel.contains(e.target) && !e.target.closest('.interactive-area')) {
            const svg = document.getElementById('venn-diagram');
            if (!svg.contains(e.target)) {
                closeInfoPanel();
            }
        }
    });
}

// Accessibility: Announce changes to screen readers
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}
