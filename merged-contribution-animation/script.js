// Handle copy markdown code functionality
document.addEventListener('DOMContentLoaded', () => {
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const svgFile = button.getAttribute('data-svg');
            const repoUrl = 'https://raw.githubusercontent.com/arohaislove/arohaislove.github.io/main/merged-contribution-animation';
            const markdownCode = `![Merged](${repoUrl}/${svgFile})`;

            try {
                await navigator.clipboard.writeText(markdownCode);

                // Visual feedback
                const originalText = button.textContent;
                button.textContent = '✓ Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy. Please copy manually:\n\n' + markdownCode);
            }
        });
    });

    // Reload animations when they end (for seamless looping)
    const animationPreviews = document.querySelectorAll('.animation-preview');

    animationPreviews.forEach(preview => {
        preview.addEventListener('load', () => {
            // Set up animation reload after completion
            setInterval(() => {
                const svgDoc = preview.contentDocument;
                if (svgDoc) {
                    const svg = svgDoc.querySelector('svg');
                    if (svg) {
                        // Force animation restart by cloning and replacing
                        const newSvg = svg.cloneNode(true);
                        svg.parentNode.replaceChild(newSvg, svg);
                    }
                }
            }, 7000); // Restart after 7 seconds (animation is ~6s + 1s buffer)
        });
    });
});
