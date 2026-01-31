# FaceFusion Paster

**FaceFusion Paster** is a Tampermonkey userscript that adds a convenient **“Paste”** button to the **SOURCE** and **TARGET** upload blocks in **FaceFusion**.  
It lets you paste an image directly from your clipboard into FaceFusion’s file upload inputs—no manual file picking.

![FaceFusion Paster Screenshot](doc/docufacefusion1.png)

## Features

- Adds a **Paste** button to FaceFusion’s **SOURCE** and **TARGET** upload blocks.
- Button sits in its own **toolbar row** (no overlay on the UI).
- Automatically checks the clipboard for supported image types and enables/disables the button accordingly.
- Shows a helpful alert if no supported image is found or clipboard access is blocked.
- Robust against UI re-renders (re-queries the active upload input at click time).

## How It Works

On page load, the script finds FaceFusion blocks labeled **SOURCE** and **TARGET**, then:

1. Wraps each matched block with a new wrapper container.
2. Adds a small toolbar row containing the **Paste** button.
3. When clicked, reads an image from the clipboard and simulates a file upload into the current file input.

## Installation

1. **Install Tampermonkey**  
   Install the Tampermonkey extension for your browser.

2. **Add the Script**  
   Create a new userscript in Tampermonkey and paste the content of your userscript (e.g. `facefusion-paster.user.js`) into the editor.

3. **Save and Enable**  
   Save the script and ensure it is enabled.

4. **Open FaceFusion**  
   Visit your local FaceFusion UI (default examples):
   - `http://127.0.0.1:7860/`
   - `http://localhost:7860/`

   You should see a **Paste** button above the **SOURCE** and **TARGET** upload blocks.

## Usage

1. **Copy an Image to Clipboard**  
   Copy an image from any source (browser image copy, screenshot tool, etc.).

2. **Click Paste**  
   Click the **Paste** button in the SOURCE or TARGET block.

3. **Upload Happens Automatically**  
   The image is inserted into the corresponding FaceFusion upload input.

## Supported Image Formats

- `PNG` (`image/png`)
- `JPEG` (`image/jpeg`)
- `WEBP` (`image/webp`)
- `GIF` (`image/gif`)

## Script Details

This script targets FaceFusion’s local web UI and looks for blocks labeled:

- **SOURCE**
- **TARGET**

It then uploads by simulating a change event on the underlying `<input type="file">` element.

### Clipboard Detection

The script uses `navigator.clipboard.read()` to detect image items.  
If a supported image exists, the button is enabled; otherwise it’s disabled with a tooltip.

### Notes / Browser Permissions

- Clipboard read requires a secure context and/or permissions depending on browser settings.
- If you see “Clipboard permission denied”, ensure your browser allows clipboard access for the page.

## Troubleshooting

- **No Image Detected**  
  Make sure you copied an actual image (not just a link) and that it’s in a supported format.

- **Clipboard Access Error**  
  Some browsers restrict clipboard reads. Try:
  - Clicking once on the page before using the button
  - Ensuring the site has clipboard permissions
  - Using a Chromium-based browser with Tampermonkey

## Contributing

Issues and PRs are welcome—especially for:
- Supporting additional FaceFusion blocks
- Improving compatibility with UI changes
- Adding hotkeys / additional actions (clear/reset)

## License

This work is licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

You are free to:

- **Share** — copy and redistribute the material in any medium or format  
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially  

**Attribution**: You must give appropriate credit, provide a link to the license, and indicate if changes were made.
