// Quotes database
const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" }
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
    document.getElementById('quote-text').textContent = `"${quote.text}"`;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
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
