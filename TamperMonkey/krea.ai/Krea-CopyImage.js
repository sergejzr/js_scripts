// ==UserScript==
// @name         KreaImage
// @namespace    http://tampermonkey.net/
// @version      2024-10-31
// @description  Adds two buttons next to donload button, one for copying the improved image into clipboard and one to open the improved image in the new tab
// @author       sergejzr
// @match        https://www.krea.ai/apps/image/enhancer
// @icon         https://www.google.com/s2/favicons?sz=64&domain=krea.ai
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

window.addEventListener("load", preparepage);

function preparepage() {
    setTimeout(addButton, 5000);
}

function addButton() {
    const targetDiv = document.querySelector('.items-end');

    if (targetDiv) {
        // Create and style the "Open Enhanced Image" button
        const openButton = document.createElement("button");



        openButton.classList.add("relative", "tooltip-parent",  "self-stretch", "bg-primary-800", "rounded-lg", "svelte-wsnho5");

        // SVG icon for "Open in New Tab" button
        openButton.innerHTML = `

                <div class="p-2 svelte-wsnho5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>

            </div>

        `;

        // Tooltip for openButton
        const openButtonTooltip = document.createElement("div");

        openButtonTooltip.classList.add("tooltip", "invisible", "absolute", "-transform-x-1/2", "-left-[50%]", "-top-[75%]", "z-[10]", "w-max", "text-xxs", "font-semibold", "text-primary-200", "bg-primary-1000", "rounded-full", "px-2", "py-1", "svelte-wsnho5");
        openButtonTooltip.innerHTML = `Open in new tab`;
        openButton.appendChild(openButtonTooltip);

        targetDiv.insertBefore(openButton, targetDiv.firstChild);

        openButton.addEventListener("click", function () {
            const enhancedImage = document.querySelector('img[alt="enhanced"]');
            if (enhancedImage) {
                const directImageURL = getDirectImageURL(enhancedImage.src);
                window.open(directImageURL, '_blank');
            } else {
                alert("No image with alt 'enhanced' found!");
            }
        });

        // Create and style the "Copy Image to Clipboard" button
        const copyButton = document.createElement("button");
        copyButton.classList.add("relative", "tooltip-parent",  "self-stretch", "bg-primary-800", "rounded-lg", "svelte-wsnho5");

        // SVG icon for "Copy Image to Clipboard" button


        copyButton.innerHTML = `
            <div class="p-2 svelte-wsnho5">
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-copy"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M16 4h2a2 2 0 0 1 2 2v4"/><path d="M21 14H11"/><path d="m15 10-4 4 4 4"/></svg>
            </div>
        `;

        // Tooltip for copyButton
        const copyButtonTooltip = document.createElement("div");
        copyButtonTooltip.classList.add("tooltip", "invisible", "absolute", "-transform-x-1/2", "-left-[50%]", "-top-[75%]", "z-[10]", "w-max", "text-xxs", "font-semibold", "text-primary-200", "bg-primary-1000", "rounded-full", "px-2", "py-1", "svelte-wsnho5");
        copyButtonTooltip.innerHTML = `Copy to Clipboard`;
        copyButton.appendChild(copyButtonTooltip);

        targetDiv.insertBefore(copyButton, openButton.nextSibling);

        copyButton.addEventListener("click", async function () {
            const enhancedImage = document.querySelector('img[alt="enhanced"]');
            if (enhancedImage) {
                const directImageURL = getDirectImageURL(enhancedImage.src);
                try {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = async function () {
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        context.drawImage(img, 0, 0);

                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                try {
                                    await navigator.clipboard.write([
                                        new ClipboardItem({ [blob.type]: blob })
                                    ]);
                                    alert("Image copied to clipboard!");
                                } catch (error) {
                                    console.error("Failed to copy image: ", error);
                                    alert("Failed to copy image to clipboard.");
                                }
                            }
                        }, 'image/png');
                    };
                    img.onerror = function () {
                        console.error("Failed to load image for copying.");
                        alert("Failed to load image for copying.");
                    };
                    img.src = directImageURL;
                } catch (error) {
                    console.error("Failed to copy image: ", error);
                    alert("Failed to copy image to clipboard.");
                }
            } else {
                alert("No image with alt 'enhanced' found!");
            }
        });
    } else {
        console.warn("No div with class 'items-end' found.");
    }
}

function getDirectImageURL(src) {
    try {
        const url = new URL(src);
        return decodeURIComponent(url.searchParams.get('i'));
    } catch (error) {
        console.error("Failed to extract direct image URL:", error);
        return src; // fallback to original if any error occurs
    }
}




})();
