// Religion data with shared and unique principles
const religionData = {
    christianity: {
        name: 'Christianity',
        color: '#FF6B6B',
        position: { cx: 350, cy: 300 },
        unique: [
            'Belief in Jesus Christ as the Son of God and Savior',
            'Trinity: Father, Son, and Holy Spirit',
            'Salvation through faith in Jesus Christ',
            'The Bible as sacred scripture (Old and New Testament)',
            'Resurrection of Jesus as central doctrine',
            'Communion/Eucharist as sacrament',
            'Baptism as initiation ritual'
        ]
    },
    islam: {
        name: 'Islam',
        color: '#4ECDC4',
        position: { cx: 650, cy: 300 },
        unique: [
            'Muhammad as the final prophet',
            'The Quran as the literal word of God',
            'Five Pillars: Shahada, Salat, Zakat, Sawm, Hajj',
            'Strict monotheism (Tawhid)',
            'No intercession between God and humanity',
            'Sharia as religious law',
            'Prohibition of idolatry and images of God'
        ]
    },
    judaism: {
        name: 'Judaism',
        color: '#45B7D1',
        position: { cx: 500, cy: 200 },
        unique: [
            'Chosen people covenant with God',
            'Torah as the core of written law',
            'Talmud and rabbinic traditions',
            'Bar/Bat Mitzvah coming of age ceremony',
            'Emphasis on ethical monotheism',
            'Sabbath observance (Shabbat)',
            'Kosher dietary laws',
            'Waiting for the Messiah'
        ]
    },
    buddhism: {
        name: 'Buddhism',
        color: '#F7DC6F',
        position: { cx: 350, cy: 500 },
        unique: [
            'Four Noble Truths about suffering',
            'Eightfold Path to enlightenment',
            'Concept of Nirvana/Enlightenment',
            'No belief in a creator God',
            'Emphasis on meditation and mindfulness',
            'Cycle of rebirth (Samsara)',
            'Middle Way between extremes',
            'Buddha (Siddhartha Gautama) as teacher, not deity'
        ]
    },
    hinduism: {
        name: 'Hinduism',
        color: '#E67E22',
        position: { cx: 650, cy: 500 },
        unique: [
            'Multiple deities as manifestations of Brahman',
            'Caste system (traditional)',
            'Vedas as ancient sacred texts',
            'Concept of Dharma (duty/righteousness)',
            'Karma and reincarnation',
            'Yoga as spiritual practice',
            'Sacred river Ganges',
            'Diverse practices and regional variations'
        ]
    }
};

// Shared principles between religions
const sharedPrinciples = {
    all: {
        title: 'Universal Principles (All Religions)',
        principles: [
            'Golden Rule: Treat others as you wish to be treated',
            'Importance of compassion and kindness',
            'Value of prayer/meditation/spiritual practice',
            'Emphasis on moral and ethical living',
            'Respect for human dignity',
            'Call to help the poor and vulnerable',
            'Importance of community and fellowship',
            'Seeking truth and wisdom'
        ]
    },
    abrahamic: {
        title: 'Shared by Abrahamic Religions (Christianity, Islam, Judaism)',
        principles: [
            'Belief in one God (monotheism)',
            'Abraham as a patriarch',
            'Prophetic tradition',
            'Sacred scripture and divine revelation',
            'Day of judgment and afterlife',
            'Angels as spiritual beings',
            'Importance of charity and social justice',
            'Prayer as communication with God',
            'Fasting as spiritual discipline'
        ]
    },
    eastern: {
        title: 'Shared by Eastern Religions (Buddhism, Hinduism)',
        principles: [
            'Cycle of birth, death, and rebirth',
            'Karma: Actions have consequences',
            'Meditation as spiritual practice',
            'Seeking liberation from suffering',
            'Ahimsa: Non-violence and respect for all life',
            'Guru/teacher tradition',
            'Sacred texts and wisdom literature',
            'Multiple paths to spiritual truth'
        ]
    },
    christianity_islam: {
        title: 'Christianity & Islam',
        principles: [
            'Jesus as an important prophet/figure',
            'Virgin birth of Jesus',
            'Second coming/end times theology',
            'Emphasis on missionary work',
            'Mary as revered figure'
        ]
    },
    christianity_judaism: {
        title: 'Christianity & Judaism',
        principles: [
            'Old Testament/Hebrew Bible as scripture',
            'Ten Commandments',
            'Sabbath tradition (adapted)',
            'Psalms and wisdom literature',
            'Messianic expectations'
        ]
    },
    islam_judaism: {
        title: 'Islam & Judaism',
        principles: [
            'Dietary restrictions (Halal/Kosher)',
            'Circumcision practice',
            'Prohibition of pork',
            'Regular daily prayers',
            'Similar prophetic figures (Moses, Abraham)'
        ]
    }
};

// Draw the Venn diagram
function drawVennDiagram() {
    const svg = document.getElementById('venn-diagram');
    const radius = 150;

    // Draw circles for each religion
    Object.keys(religionData).forEach(key => {
        const religion = religionData[key];

        // Create circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', religion.position.cx);
        circle.setAttribute('cy', religion.position.cy);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', religion.color);
        circle.setAttribute('opacity', '0.4');
        circle.setAttribute('stroke', religion.color);
        circle.setAttribute('stroke-width', '2');
        circle.classList.add('religion-circle');
        circle.dataset.religion = key;

        // Add click event
        circle.addEventListener('click', () => showReligionInfo(key));
        circle.addEventListener('mouseenter', () => highlightCircle(key));
        circle.addEventListener('mouseleave', () => resetHighlight());

        svg.appendChild(circle);

        // Create label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', religion.position.cx);
        text.setAttribute('y', religion.position.cy - radius - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', religion.color);
        text.classList.add('religion-label');
        text.textContent = religion.name;

        svg.appendChild(text);
    });

    // Add central text for shared principles
    const centralText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centralText.setAttribute('x', 500);
    centralText.setAttribute('y', 360);
    centralText.setAttribute('text-anchor', 'middle');
    centralText.setAttribute('fill', '#333');
    centralText.setAttribute('font-size', '16');
    centralText.setAttribute('font-weight', 'bold');
    centralText.textContent = 'Shared Principles';
    centralText.style.cursor = 'pointer';
    centralText.addEventListener('click', () => showSharedInfo('all'));

    svg.appendChild(centralText);
}

// Show information about a specific religion
function showReligionInfo(religionKey) {
    const religion = religionData[religionKey];
    const infoTitle = document.getElementById('info-title');
    const infoContent = document.getElementById('info-content');

    infoTitle.textContent = religion.name;
    infoTitle.style.color = religion.color;

    let html = '<h3>Unique Aspects:</h3><ul>';
    religion.unique.forEach(item => {
        html += `<li>${item}</li>`;
    });
    html += '</ul>';

    html += '<p><strong>Click "Show All" or another religion to see shared principles.</strong></p>';

    infoContent.innerHTML = html;
}

// Show shared principles
function showSharedInfo(type) {
    const info = sharedPrinciples[type];
    const infoTitle = document.getElementById('info-title');
    const infoContent = document.getElementById('info-content');

    infoTitle.textContent = info.title;
    infoTitle.style.color = '#1e3c72';

    let html = '<ul>';
    info.principles.forEach(principle => {
        html += `<li>${principle}</li>`;
    });
    html += '</ul>';

    infoContent.innerHTML = html;
}

// Highlight a specific circle
function highlightCircle(religionKey) {
    document.querySelectorAll('.religion-circle').forEach(circle => {
        if (circle.dataset.religion !== religionKey) {
            circle.classList.add('dimmed');
        }
    });
}

// Reset highlight
function resetHighlight() {
    document.querySelectorAll('.religion-circle').forEach(circle => {
        circle.classList.remove('dimmed');
    });
}

// Filter by religion
function filterByReligion(religionKey) {
    // Update active button
    document.querySelectorAll('.religion-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Reset or filter circles
    if (religionKey === 'all') {
        resetHighlight();
        showSharedInfo('all');
    } else {
        highlightCircle(religionKey);
        showReligionInfo(religionKey);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    drawVennDiagram();
    showSharedInfo('all');

    // Add button event listeners
    document.querySelectorAll('.religion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const religion = e.target.dataset.religion;
            filterByReligion(religion);
        });
    });

    // Add click handlers for intersection info
    const svg = document.getElementById('venn-diagram');
    svg.addEventListener('dblclick', (e) => {
        // Double-click on overlapping areas could show specific shared principles
        showSharedInfo('all');
    });
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    const religions = ['all', 'christianity', 'islam', 'judaism', 'buddhism', 'hinduism'];
    const currentActive = document.querySelector('.religion-btn.active');
    const currentIndex = religions.indexOf(currentActive.dataset.religion);

    if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % religions.length;
        document.querySelector(`[data-religion="${religions[nextIndex]}"]`).click();
    } else if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + religions.length) % religions.length;
        document.querySelector(`[data-religion="${religions[prevIndex]}"]`).click();
    }
});
