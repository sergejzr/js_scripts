// ==UserScript==
// @name         CopyPaste
// @namespace    http://tampermonkey.net/
// @version      2024-10-31
// @description  Adds a button to style change area that wil paste the image from the clipboard into the style image
// @author       sergejzr
// @match        https://www.krea.ai/apps/image/enhancer
// @icon         https://www.google.com/s2/favicons?sz=64&domain=krea.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

window.addEventListener("load", preparepage);

function preparepage() {
    // Start checking every 3 seconds
    const checkInterval = setInterval(addCPButton, 3000);

    function addCPButton() {
        // Reference the existing button container and drop area
        const buttonContainer = document.querySelector('.flex.items-center.justify-between.mb-1.svelte-wsnho5');
        const dropArea = document.getElementById('secondary-drop-el');

        // Check if necessary elements are loaded
        if (!buttonContainer || !dropArea) {
            return; // Exit if elements are not yet available
        }

        // Stop checking once elements are found
        clearInterval(checkInterval);

        // Add the "Paste Image" button
        createPasteImageButton(buttonContainer);
    }

    function createPasteImageButton(buttonContainer) {
        // Create and style the "Paste Image" button
        const pasteButton = document.createElement("button");
        pasteButton.textContent = "Paste Image from Clipboard";
        pasteButton.className = "text-xxs text-primary-0/20 hover:text-primary-0/40 transition-color duration-200 ease cursor-pointer ml-2 svelte-wsnho5";
        pasteButton.type = "button";

        // Insert the "Paste Image" button next to the "Clear" button
        buttonContainer.appendChild(pasteButton);

        // Add event listener to the "Paste Image" button
        pasteButton.addEventListener("click", pasteImageFromClipboard);
    }

    async function pasteImageFromClipboard() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                if (item.types.includes("image/png") || item.types.includes("image/jpeg") || item.types.includes("image/webp")) {
                    const blob = await item.getType(item.types[0]);

                    // Check if the reference image is present in the main drop area
                    const referenceImage = document.getElementById('secondary-drop-el').querySelector('img');

                    if (referenceImage) {
                        // If the reference image exists, display the clipboard image directly in the primary drop area
                        displayImage(blob, document.getElementById('secondary-drop-el'));
                    } else {
                        // If the reference image does not exist, open the secondary upload area
                        document.getElementById('secondary-drop-el').click();

                        // Wait 3 seconds for the secondary upload area to appear
                        setTimeout(() => {
                            // Click on the first button in the secondary upload area
                            clickOnFirstButtonInSecondaryArea(blob);
                        }, 3000);
                    }
                    return;
                }
            }
            alert("No image found in clipboard.");
        } catch (err) {
            console.error("Failed to read clipboard contents:", err);
            alert("Failed to access clipboard.");
        }
    }

    function clickOnFirstButtonInSecondaryArea(imageBlob) {
        // Locate the button with the first image in the secondary upload area
        const firstButton = document.querySelector('.flex.overflow-x-auto.pb-1.w-full button');

        if (!firstButton) {
            console.warn("First button in the secondary upload area not found.");
            return;
        }

        // Click the button to load the reference image in the primary area
        firstButton.click();

        // Wait 3 seconds for the reference image to load, then paste the clipboard image in the primary area
        setTimeout(() => {
            displayImage(imageBlob, document.getElementById('secondary-drop-el'));
        }, 3000);
    }

    function displayImage(file, targetArea) {
        // Clear the target area and add the new image
        targetArea.innerHTML = '';

        const reader = new FileReader();
        reader.onload = function(e) {
            const newImage = document.createElement("img");
            newImage.src = e.target.result;
            newImage.className = "object-cover w-full h-full origin-center absolute top-0 left-0 pointer-events-none svelte-wsnho5";
            newImage.alt = "Blend Scenes";
            targetArea.appendChild(newImage);
        };
        reader.readAsDataURL(file);
    }
}




})();
