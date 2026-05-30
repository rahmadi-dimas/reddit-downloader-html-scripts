// ==UserScript==
// @name         Reddit Open All Comment Threads in New Tabs (old.reddit.com)
// @namespace    rahmadi-dimas
// @version      1.0
// @description  Adds a button on subreddit listing pages to open all comment threads in new tabs (DOM-based)
// @author       rahmadi-dimas
// @match        https://old.reddit.com/r/*/
// @match        https://old.reddit.com/r/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const DELAY_MS = 500;

  function openAllThreads(button) {
    const links = Array.from(
      document.querySelectorAll('a[data-event-action="comments"]')
    );

    if (links.length === 0) {
      alert("No comment threads found on this page.");
      return;
    }

    button.disabled = true;
    button.style.background = "#999";
    button.textContent = `Opening 0 / ${links.length}…`;

    links.forEach((link, i) => {
      setTimeout(() => {
        window.open(link.href, "_blank");
        button.textContent = `Opening ${i + 1} / ${links.length}…`;

        if (i === links.length - 1) {
          button.textContent = `Opened ${links.length} thread${links.length !== 1 ? "s" : ""}`;
        }
      }, i * DELAY_MS);
    });
  }

  function addButton() {
    const container = document.createElement("div");
    container.style.cssText =
      "margin: 8px 0 4px; padding: 6px 0; border-bottom: 1px solid #c6c6c6;";

    const button = document.createElement("button");
    button.textContent = "Open all comment threads in new tabs";
    button.style.cssText =
      "padding: 6px 14px; background: #ff4500; color: #fff; border: none;" +
      "border-radius: 3px; cursor: pointer; font-size: 13px; font-family: sans-serif;" +
      "font-weight: bold;";

    button.addEventListener("mouseenter", () => {
      if (!button.disabled) button.style.background = "#e03d00";
    });
    button.addEventListener("mouseleave", () => {
      if (!button.disabled) button.style.background = "#ff4500";
    });
    button.addEventListener("click", () => openAllThreads(button));

    container.appendChild(button);

    const content = document.getElementById("content");
    if (content) {
      content.insertBefore(container, content.firstChild);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  if (!/\/r\/[^/]+\/comments\//i.test(window.location.pathname)) {
    addButton();
  }
})();
