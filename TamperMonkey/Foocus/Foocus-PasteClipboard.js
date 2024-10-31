// ==UserScript==
// @name         Foocus Paster
// @namespace    http://tampermonkey.net/
// @version      2024-10-31
// @author       sergejzr
// @description  Adds clipboard paste buttons to Foocus image upload fields. No intermediate files more necessary!
// @match        http://127.0.0.1:7865*
// @grant        none
// ==/UserScript==
//Should teoretically work with many applications that base on svelte for image handling
(function () {
    'use strict';

    window.addEventListener('load', () => {
        console.log('Tampermonkey script loaded: Ready to paste images from clipboard.');

        // Function to add a paste button to each image upload container
        function addPasteButton() {
            const imageContainers = document.querySelectorAll('div[data-testid="image"]');

            imageContainers.forEach((container) => {
                if (container.querySelector('.paste-button')) return;

                const button = document.createElement('button');
                button.className = 'paste-button';
                button.setAttribute('aria-label', 'Paste Image');
                button.style.position = 'absolute';
                button.style.top = '10px';
                button.style.right = '10px';
                button.style.background = 'transparent';
                button.style.border = 'none';
                button.style.cursor = 'pointer';
                button.style.padding = '0';

                // Add the icon with a conditional class for disabled state
                button.innerHTML = `
                    <div class="p-2 svelte-wsnho5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                            <path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"/>
                            <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"/>
                            <path d="m17 10 4 4-4 4"/>
                        </svg>
                    </div>
                `;

                container.style.position = 'relative';
                container.appendChild(button);

                const hiddenUploadInput = container.querySelector('input[type="file"][accept="image/*"]');
                button.addEventListener('click', () => handlePasteFromClipboard(hiddenUploadInput));

                updateButtonState(button);
            });
        }

        async function handlePasteFromClipboard(hiddenUploadInput) {
            try {
                const clipboardItems = await navigator.clipboard.read();
                for (const item of clipboardItems) {
                    if (item.types.includes('image/png') || item.types.includes('image/jpeg') || item.types.includes('image/gif')) {
                        const blob = await item.getType(item.types[0]);
                        if (blob) {
                            const file = new File([blob], 'clipboard-image.png', { type: blob.type });
                            await simulateFileUpload(file, hiddenUploadInput);
                        }
                    }
                }
            } catch (error) {
                console.error('Error accessing clipboard:', error);
                alert('Unable to access clipboard. Please copy an image to the clipboard first.');
            }
        }

        async function simulateFileUpload(file, hiddenUploadInput) {
            if (!hiddenUploadInput) {
                console.warn('Hidden upload input not found.');
                return;
            }
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            hiddenUploadInput.files = dataTransfer.files;
            const changeEvent = new Event('change', { bubbles: true });
            hiddenUploadInput.dispatchEvent(changeEvent);
            console.log('Dispatched change event on specific hidden upload input.');
        }

        async function updateButtonState(button) {
            try {
                const clipboardItems = await navigator.clipboard.read();
                let hasImage = false;

                for (const item of clipboardItems) {
                    if (item.types.includes('image/png') || item.types.includes('image/jpeg') || item.types.includes('image/gif')) {
                        hasImage = true;
                        break;
                    }
                }

                const icon = button.querySelector('.icon');

                if (hasImage) {
                    button.disabled = false;
                    button.setAttribute('title', 'Paste image from clipboard');
                    button.style.cursor = 'pointer';
                    icon.classList.remove('disabled-icon');
                } else {
                    button.disabled = true;
                    button.setAttribute('title', 'No image in the clipboard');
                    button.style.cursor = 'not-allowed';
                    icon.classList.add('disabled-icon');
                }
            } catch (error) {
                console.error('Clipboard read failed:', error);
                button.disabled = true;
                button.setAttribute('title', 'Clipboard access denied');
                button.style.cursor = 'not-allowed';
                button.querySelector('.icon').classList.add('disabled-icon');
            }
        }

        // Add CSS styles for the disabled icon
        const style = document.createElement('style');
        style.innerHTML = `
            .disabled-icon {
                stroke: #d3d3d3;
            }
        `;
        document.head.appendChild(style);

        // Add the paste button to each image container
        addPasteButton();

        // Trigger clipboard check on focus to update the button state
        window.addEventListener('focus', () => {
            document.querySelectorAll('.paste-button').forEach(updateButtonState);
        });

        // Right-click release triggers clipboard check after 1 second delay
        document.addEventListener('mouseup', (event) => {
            if (event.button === 2) {
                setTimeout(() => {
                    document.querySelectorAll('.paste-button').forEach(updateButtonState);
                }, 1000);  // Wait for 1 second after right-click release
            }
        });
    });
})();
