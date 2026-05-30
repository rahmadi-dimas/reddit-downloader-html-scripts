// ==UserScript==
// @name         Reddit Export Post and Comments (old.reddit.com)
// @namespace    rahmadi-dimas
// @version      1.0
// @description  Export a Reddit post and all its comments to a .txt file (DOM-based)
// @author       rahmadi-dimas
// @match        https://old.reddit.com/r/*/comments/*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function formatDate(isoString) {
    if (!isoString) return "unknown";
    return isoString
      .replace("T", " ")
      .replace(/([+-]\d{2}:\d{2}|Z)$/, " UTC")
      .replace(/\.\d{3}/, "");
  }

  function collectComments(listingEl, depth) {
    let out = "";
    const indent = "  ".repeat(depth);

    for (const comment of listingEl.querySelectorAll(":scope > .thing.comment")) {
      const author = comment.dataset.author || "[deleted]";
      if (author.includes("AutoModerator")) {
        continue;
      }

      const timeEl = comment.querySelector(":scope > .entry .tagline time");
      const datetime = formatDate(timeEl?.getAttribute("datetime") || "");
      const bodyEl = comment.querySelector(":scope > .entry .usertext-body .md");
      const body = bodyEl ? bodyEl.innerText.trim() : "[deleted]";

      out += `${indent}<u/${author}>\n`;
      out += `${indent}<${datetime}>\n`;
      out += body.split("\n").map((line) => indent + line).join("\n") + "\n\n";

      const childListing = comment.querySelector(":scope > .child .listing");
      if (childListing) {
        out += collectComments(childListing, depth + 1);
      }
    }

    return out;
  }

  function exportPost() {
    const postThing =
      document.querySelector("#siteTable > .thing:not(.comment)") ||
      document.querySelector("#siteTable > .pinnable-placeholder > .pinnable-content > .thing:not(.comment)");
    if (!postThing) {
      alert("Could not find the post on this page.");
      return;
    }

    const title = postThing.querySelector("a.title")?.innerText.trim() || "Unknown title";
    const subreddit = postThing.dataset.subreddit || "unknown";
    const permalink = `https://old.reddit.com${postThing.dataset.permalink}`;
    const author = postThing.dataset.author || "[deleted]";
    const timeEl = postThing.querySelector(".tagline time");
    const datetime = formatDate(timeEl?.getAttribute("datetime") || "");
    const selftextEl = postThing.querySelector(".usertext-body .md");
    const selftext = selftextEl ? selftextEl.innerText.trim() : "";
    // For link/video/image posts (.thing without .self), capture the target URL.
    const isSelf = postThing.classList.contains("self");
    const postUrl = !isSelf ? (postThing.dataset.url || "") : "";
    const retrievalTime = new Date().toISOString();

    let output = "";
    output += `<Retrieval time: ${formatDate(retrievalTime)}>\n`;
    output += `${title}\n`;
    output += `<r/${subreddit}>\n`;
    output += `<${permalink}>\n`;
    output += `<${datetime}>\n`;
    output += `<u/${author}>\n`;

    if (selftext) {
      output += `\n${selftext}\n`;
    } else if (postUrl) {
      output += `\n${postUrl}\n`;
    }

    output += "\n<--->\n\n";

    const commentListing = document.querySelector(".commentarea .sitetable.nestedlisting");
    if (commentListing) {
      output += collectComments(commentListing, 0);
    }

    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = datetime + "_" + subreddit + "_" + title.replace(/[^\w\s-]/g, "").trim().substring(0, 60) + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function addButton() {
    const container = document.createElement("div");
    container.style.cssText =
      "margin: 8px 0 4px; padding: 6px 0; border-bottom: 1px solid #c6c6c6;";

    const button = document.createElement("button");
    button.textContent = "Export Post and Comments";
    button.style.cssText =
      "padding: 6px 14px; background: #ff4500; color: #fff; border: none;" +
      "border-radius: 3px; cursor: pointer; font-size: 13px; font-family: sans-serif;" +
      "font-weight: bold;";

    button.addEventListener("mouseenter", () => { button.style.background = "#e03d00"; });
    button.addEventListener("mouseleave", () => { button.style.background = "#ff4500"; });
    button.addEventListener("click", exportPost);

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
