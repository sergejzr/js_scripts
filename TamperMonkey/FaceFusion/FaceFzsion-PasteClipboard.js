// ==UserScript==
// @name         FaceFusion Clipboard Paster (SOURCE/TARGET) - non-overlay toolbar
// @namespace    http://tampermonkey.net/
// @version      2026-01-31
// @author       sergejzr
// @description  Adds Paste-from-clipboard buttons to FaceFusion SOURCE/TARGET upload blocks by wrapping the block and adding a toolbar (no overlay).
// @match        http://127.0.0.1:7860/*
// @match        http://localhost:7860/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const LABELS = ['SOURCE', 'TARGET'];
  const WRAP_CLASS = 'ff-paste-wrapper';

  function makeButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ff-paste-btn';
    btn.setAttribute('aria-label', 'Paste image from clipboard');
    btn.title = 'Paste image from clipboard';
    btn.innerHTML = `
      <span class="ff-paste-icon" aria-hidden="true">📋</span>
      <span class="ff-paste-text">Paste</span>
    `;
    return btn;
  }

  async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      r.readAsDataURL(blob);
    });
  }

  async function getClipboardImageBlob() {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imgType =
        item.types.find(t => t === 'image/png') ||
        item.types.find(t => t === 'image/jpeg') ||
        item.types.find(t => t === 'image/webp') ||
        item.types.find(t => t === 'image/gif');

      if (!imgType) continue;
      const blob = await item.getType(imgType);
      if (blob && blob.size > 0) return { blob, type: imgType };
    }
    return null;
  }

  async function simulateFileUpload(file, inputEl) {
    const dt = new DataTransfer();
    dt.items.add(file);
    inputEl.files = dt.files;
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function handlePaste(blockEl) {
    // IMPORTANT: re-query the current input at click time (Svelte may replace it)
    const inputEl = blockEl.querySelector('input[type="file"][data-testid="file-upload"]');
    if (!inputEl) {
      alert('Upload input not found (UI may still be rendering). Try again.');
      return;
    }

    try {
      const clip = await getClipboardImageBlob();
      if (!clip) {
        alert('No supported image found in clipboard (png/jpg/webp/gif).');
        return;
      }

      // validate blob can render as an image
      const dataURL = await blobToDataURL(clip.blob);
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Clipboard image failed to load'));
        img.src = dataURL;
      });

      const ext = clip.type.split('/')[1] || 'png';
      const file = new File([clip.blob], `clipboard-image.${ext}`, { type: clip.blob.type });
      await simulateFileUpload(file, inputEl);
    } catch (e) {
      console.error(e);
      alert('Paste failed. Clipboard permission denied or no image in clipboard.');
    }
  }

  async function updateButtonState(btn) {
    try {
      const clip = await getClipboardImageBlob();
      const hasImage = !!clip;
      btn.disabled = !hasImage;
      btn.style.opacity = hasImage ? '1' : '0.45';
      btn.style.cursor = hasImage ? 'pointer' : 'not-allowed';
      btn.title = hasImage ? 'Paste image from clipboard' : 'No image in clipboard';
    } catch {
      btn.disabled = true;
      btn.style.opacity = '0.45';
      btn.style.cursor = 'not-allowed';
      btn.title = 'Clipboard access not available';
    }
  }

  function findBlocks() {
    return Array.from(document.querySelectorAll('div.block')).filter(block => {
      const label = block.querySelector('label[data-testid="block-label"]');
      if (!label) return false;
      const text = (label.textContent || '').trim().toUpperCase();
      return LABELS.includes(text);
    });
  }

  function ensureWrapped(block) {
    const existingWrapper = block.closest(`.${WRAP_CLASS}`);
    if (existingWrapper) return existingWrapper;

    const parent = block.parentNode;
    if (!parent) return null;

    const wrapper = document.createElement('div');
    wrapper.className = WRAP_CLASS;

    // Replace the block with wrapper, then move the block inside wrapper
    parent.insertBefore(wrapper, block);
    wrapper.appendChild(block);

    return wrapper;
  }

  function ensureToolbar(wrapper) {
    let bar = wrapper.querySelector(':scope > .ff-paste-bar');
    if (bar) return bar;

    bar = document.createElement('div');
    bar.className = 'ff-paste-bar';

    // Put bar ABOVE the original block (which is wrapper's current first child)
    wrapper.insertBefore(bar, wrapper.firstChild);

    return bar;
  }

  function enhanceBlock(block) {
    const wrapper = ensureWrapped(block);
    if (!wrapper) return;

    const bar = ensureToolbar(wrapper);

    // One button per wrapper toolbar
    if (bar.querySelector(':scope > .ff-paste-btn')) return;

    const btn = makeButton();
    btn.addEventListener('click', () => handlePaste(block));

    bar.appendChild(btn);
    updateButtonState(btn);
  }

  function enhanceAll() {
    findBlocks().forEach(enhanceBlock);
  }

  function installStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .${WRAP_CLASS} {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ff-paste-bar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        /* optional: if you want it to feel like a header row */
        padding: 6px 0;
      }

      .ff-paste-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(0,0,0,0.35);
        color: inherit;
        font-size: 12px;
        line-height: 1;
        user-select: none;
        backdrop-filter: blur(6px);
      }

      .ff-paste-btn:hover:not(:disabled) { background: rgba(0,0,0,0.5); }
      .ff-paste-btn:active:not(:disabled) { transform: translateY(1px); }
      .ff-paste-icon { font-size: 14px; }
      .ff-paste-text { font-weight: 600; letter-spacing: 0.2px; }
    `;
    document.head.appendChild(style);
  }

  function observeDom() {
    const obs = new MutationObserver(() => enhanceAll());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    installStyles();
    enhanceAll();
    observeDom();

    window.addEventListener('focus', () => {
      document.querySelectorAll('.ff-paste-btn').forEach(updateButtonState);
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        setTimeout(() => {
          document.querySelectorAll('.ff-paste-btn').forEach(updateButtonState);
        }, 800);
      }
    });
  }

  window.addEventListener('load', init);
})();
