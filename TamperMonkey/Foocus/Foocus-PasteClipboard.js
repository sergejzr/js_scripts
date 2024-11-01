// ==UserScript==
// @name         Foocus Paster
// @namespace    http://tampermonkey.net/
// @version      2024-10-31
// @author       sergejzr, chatGPT
// @description  Adds clipboard paste buttons to Foocus upload fields with dynamic icon color.
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" transform="scale(-1, 1)" style="transform-origin: center;">
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

        // Convert blob to Data URL and validate the image
        async function blobToDataURL(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error("Failed to convert blob to data URL"));
                reader.readAsDataURL(blob);
            });
        }

        async function handlePasteFromClipboard(hiddenUploadInput) {
    try {
        const clipboardItems = await navigator.clipboard.read();
        console.log("Clipboard Items on Paste:", clipboardItems); // Debugging log

        for (const item of clipboardItems) {
            console.log("Item Types:", item.types);

            // Look for an image type first, preferring image types over text/html
            const imageType = item.types.find(type => type === 'image/png' || type === 'image/jpeg' || type === 'image/gif');

            if (imageType) {
                console.log("Found image type:", imageType);

                const blob = await item.getType(imageType);
                if (blob) {
                    // Convert blob to data URL and validate as an image
                    const dataURL = await blobToDataURL(blob);
                    const img = new Image();
                    img.src = dataURL;

                    img.onload = async () => {
                        const file = new File([blob], 'clipboard-image.png', { type: blob.type });
                        await simulateFileUpload(file, hiddenUploadInput);
                    };

                    img.onerror = () => {
                        console.error("Failed to load image from clipboard");
                        alert("The image copied from the webpage could not be processed. Please try another image.");
                    };
                }
            } else {
                console.log("No supported image type found in clipboard item.");
                alert("No valid image format found in the clipboard. Please try copying a different image.");
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
                console.log("Clipboard Items on Update:", clipboardItems); // Debugging log

                let hasImage = false;

                for (const item of clipboardItems) {
                    console.log("Item Types on Update:", item.types); // Debugging log

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
