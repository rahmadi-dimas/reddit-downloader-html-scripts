// ==UserScript==
// @name         Reddit Auto Load More Comments (old.reddit.com)
// @namespace    rahmadi-dimas
// @version      1.0
// @description  Automatically clicks "load more comments" buttons on old.reddit.com (DOM-based)
// @author       rahmadi-dimas
// @match        https://old.reddit.com/r/*/comments/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Milliseconds to wait between each click to avoid rate-limiting
    const CLICK_DELAY_MS = 2000;

    // How often to scan for new "load more" buttons
    const SCAN_INTERVAL_MS = 3000;

    // Cap total number of auto-clicks to prevent runaway loops
    const MAX_CLICKS = 100;

    let clickCount = 0;
    let queue = [];
    let processing = false;

    /**
     * Finds all unprocessed "load more comments" / "continue this thread" buttons.
     * old.reddit uses several patterns:
     *  - <span class="morecomments"> containing an <a> tag
     *  - <a class="button"> with text like "load more comments"
     *  - <a> with text "continue this thread"
     * Also shows commments hidden due to low score (downvoted to oblivion)
     */
    function findButtons() {
        const found = [];

        // <span class="morecomments"> wrappers
        document.querySelectorAll('span.morecomments:not([data-loaded])').forEach(span => {
            const link = span.querySelector('a');
            if (link && link.textContent.trim().toLowerCase() !== 'loading...') {
                span.setAttribute('data-loaded', '1');
                found.push(link);
            }
        });

        // standalone "continue this thread" links
        document.querySelectorAll('a.button:not([data-loaded])').forEach(link => {
            const text = link.textContent.trim().toLowerCase();
            if (text === 'loading...') return;
            if (text.includes('continue this thread') || text.includes('load more comments')) {
                link.setAttribute('data-loaded', '1');
                found.push(link);
            }
        });

        // [+] expand toggle for threshold-collapsed comments
        document.querySelectorAll('.comment.collapsed:not([data-expand-loaded])').forEach(comment => {
            const reasonEl = comment.querySelector('.collapsed-reason');
            const isThreshold =
                (reasonEl && reasonEl.textContent.toLowerCase().includes('comment score below threshold')) ||
                (comment.dataset.collapsedReason || '').toLowerCase().includes('comment score below threshold');
            if (!isThreshold) return;
            const expand = comment.querySelector('a.expand');
            if (expand) {
                comment.setAttribute('data-expand-loaded', '1');
                found.push(expand);
            }
        });

        return found;
    }

    function processQueue() {
        if (processing || queue.length === 0) return;
        processing = true;

        const btn = queue.shift();

        // Element may have been removed from DOM between discovery and click
        if (!btn || !document.contains(btn)) {
            processing = false;
            processQueue();
            return;
        }

        btn.click();
        clickCount++;

        if (clickCount >= MAX_CLICKS) {
            console.log(`[LoadMoreComments] Reached ${MAX_CLICKS} click limit. Stopping.`);
            processing = false;
            return;
        }

        setTimeout(() => {
            processing = false;
            processQueue();
        }, CLICK_DELAY_MS);
    }

    function initializeScan(){
        // Watch for new comment nodes being injected after a click
        const observer = new MutationObserver(() => scan());
        observer.observe(document.body, { childList: true, subtree: true });

        // Also poll on an interval as a fallback
        setInterval(scan, SCAN_INTERVAL_MS);

        // Initial scan once the page is ready
        scan();
    }

    function scan() {
        if (clickCount >= MAX_CLICKS) return;
        const buttons = findButtons();
        if (buttons.length > 0) {
            queue.push(...buttons);
            processQueue();
        }
    }
      
    function addButton() {
        const container = document.createElement("div");
        container.style.cssText =
        "margin: 8px 0 4px; padding: 6px 0; border-bottom: 1px solid #c6c6c6;";

        const button = document.createElement("button");
        button.textContent = "Load All Comments";
        button.style.cssText =
        "padding: 6px 14px; background: #ff4500; color: #fff; border: none;" +
        "border-radius: 3px; cursor: pointer; font-size: 13px; font-family: sans-serif;" +
        "font-weight: bold;";

        button.addEventListener("mouseenter", () => { button.style.background = "#e03d00"; });
        button.addEventListener("mouseleave", () => { button.style.background = "#ff4500"; });
        button.addEventListener("click", initializeScan);

        container.appendChild(button);

        const content = document.getElementById("content");
        if (content) {
        content.insertBefore(container, content.firstChild);
        } else {
        document.body.insertBefore(container, document.body.firstChild);
        }
    }

    addButton();
})();
