// Māori Philosophical Quotes (Whakataukī)
const quotes = [
    { text: "Whāia te iti kahurangi ki te tūohu koe me he maunga teitei", author: "Māori Whakataukī", translation: "Seek the treasure you value most dearly: if you bow your head, let it be to a lofty mountain" },
    { text: "He aha te mea nui o te ao? He tangata, he tangata, he tangata", author: "Māori Whakataukī", translation: "What is the most important thing in the world? It is people, it is people, it is people" },
    { text: "Mā te huruhuru ka rere te manu", author: "Māori Whakataukī", translation: "With feathers a bird flies — together we achieve" },
    { text: "Kia kaha, kia māia, kia manawanui", author: "Māori Whakataukī", translation: "Be strong, be brave, be steadfast" },
    { text: "Ko te amorangi ki mua, ko te hāpai ō ki muri", author: "Māori Whakataukī", translation: "The leader at the front, the worker behind — leadership with support" },
    { text: "Ehara taku toa i te toa takitahi, engari he toa takitini", author: "Māori Whakataukī", translation: "My strength is not that of an individual, but that of the collective" },
    { text: "Whakataka te hau ki te uru, whakataka te hau ki te tonga", author: "Māori Karakia", translation: "Cease the winds from the west, cease the winds from the south — let peace prevail" },
    { text: "Hutia te rito o te harakeke, kei whea te kōmako e kō?", author: "Māori Whakataukī", translation: "If you pluck the heart of the flax, where will the bellbird sing? — protect what sustains life" },
    { text: "Kia ora te iwi, me aroha tētahi ki tētahi", author: "Māori Whakataukī", translation: "Let the people thrive by loving one another" },
    { text: "Kaua e rangiruatia te hā o te hoe; e kore tō tātou waka e ū ki uta", author: "Māori Whakataukī", translation: "Don't paddle out of sync; our canoe will never reach the shore — unity in action" }
];

let deferredPrompt;

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/pwa-widget-demo/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
                updateDebugInfo('sw-status', '✅ Registered');

                // Request periodic sync for widget updates
                if ('periodicSync' in registration) {
                    registration.periodicSync.register('update-quote', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 hours
                    }).catch(err => console.log('Periodic sync failed:', err));
                }
            })
            .catch(err => {
                console.log('Service Worker registration failed:', err);
                updateDebugInfo('sw-status', '❌ Failed');
            });
    });
}

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('install-btn');
    const installStatus = document.getElementById('install-status');

    installStatus.textContent = '✅ This app can be installed!';
    installBtn.style.display = 'block';

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);

            if (outcome === 'accepted') {
                installStatus.textContent = '🎉 App installed successfully!';
                installBtn.style.display = 'none';
            }

            deferredPrompt = null;
        }
    });
});

// Detect if already installed
window.addEventListener('appinstalled', () => {
    document.getElementById('install-status').textContent = '🎉 App is installed!';
    document.getElementById('install-btn').style.display = 'none';
    console.log('PWA was installed');
});

// Check if running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
    document.getElementById('install-status').textContent = '✅ Running as installed app';
    document.getElementById('install-btn').style.display = 'none';
}

// Quote functionality
function displayQuote(quote) {
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');

    quoteText.innerHTML = `"${quote.text}"${quote.translation ? `<br><em style="font-size: 0.85em; opacity: 0.9;">${quote.translation}</em>` : ''}`;
    quoteAuthor.textContent = `— ${quote.author}`;
}

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

document.getElementById('new-quote-btn').addEventListener('click', () => {
    const newQuote = getRandomQuote();
    displayQuote(newQuote);

    // Update widget data if service worker is active
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_QUOTE',
            quote: newQuote
        });
    }
});

// Initialize debug info
function updateDebugInfo(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Populate debug information
document.addEventListener('DOMContentLoaded', () => {
    updateDebugInfo('user-agent', navigator.userAgent);
    updateDebugInfo('standalone', window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'No');

    if (!('serviceWorker' in navigator)) {
        updateDebugInfo('sw-status', '❌ Not supported');
    } else {
        updateDebugInfo('sw-status', '⏳ Loading...');
    }

    // Check initial install status
    if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        document.getElementById('install-status').textContent = '⏳ Checking installation status...';

        setTimeout(() => {
            if (!deferredPrompt) {
                document.getElementById('install-status').textContent =
                    'ℹ️ Use browser menu to install (look for "Add to Home Screen" or install icon)';
            }
        }, 2000);
    }

    // Display initial quote
    displayQuote(getRandomQuote());
});

// Create widget data file
async function createWidgetData() {
    const quote = getRandomQuote();
    const widgetData = {
        template: "quote-template",
        data: {
            quote: quote.text,
            author: quote.author,
            timestamp: new Date().toISOString()
        }
    };

    // This would be served by the service worker
    return widgetData;
}
