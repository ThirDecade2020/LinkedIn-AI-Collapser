// content.js

// Detect LinkedIn posts
function getLinkedInPosts() {
  return document.querySelectorAll('[data-id^="urn:li:activity:"]');
}

// Collapse post non-destructively
function collapsePost(post) {
  if (post.dataset.userOverride === "true") return;
  if (post.querySelector('.collapsed-card')) return;

  const collapseDiv = document.createElement('div');
  collapseDiv.className = 'collapsed-card';
  collapseDiv.innerHTML = `
    AI created at least 50% of this post, so you're welcome.
    <button class="show-anyway">Expand this AI Slop</button>
  `;

  post.insertBefore(collapseDiv, post.firstChild);

  const originalContent = Array.from(post.children).filter(c => c !== collapseDiv);
  originalContent.forEach(c => c.style.display = 'none');

  collapseDiv.querySelector('.show-anyway').onclick = () => {
    originalContent.forEach(c => c.style.display = '');
    collapseDiv.remove();
    post.dataset.userOverride = "true";
  };
}

// Ask background script to check AI content
async function checkAIContent(text) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "checkAI", text }, (resp) => {
      resolve(resp.ai_percent ?? 0);
    });
  });
}

// Main processing function
async function processPosts() {
  const posts = getLinkedInPosts();
  for (const post of posts) {
    if (post.dataset.checked === "true") continue;
    post.dataset.checked = "true";

    const text = post.innerText || "";
    const aiPercent = await checkAIContent(text);

    if (aiPercent >= 50) { // collapse if AI likelihood ≥ 50%
      collapsePost(post);
    }
  }
}

// Initial load
processPosts();

// Collapse dynamically as user scrolls
const observer = new MutationObserver(() => {
  processPosts();
});
observer.observe(document.body, { childList: true, subtree: true });

