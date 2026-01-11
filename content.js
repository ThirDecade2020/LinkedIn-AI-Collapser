// Load API key from config.js
// Assumes config.js is included in the extension

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
    AI created at least 50% of this post so, you're welcome.
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

// Send text to OpenAI for AI detection
async function checkAIContent(text) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an assistant that estimates what percentage of a text is AI-generated. Respond only with a number between 0 and 100."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 10
      })
    });

    const data = await response.json();
    const percent = parseFloat(data.choices?.[0]?.message?.content?.trim() || 0);
    return isNaN(percent) ? 0 : percent;

  } catch (error) {
    console.error("AI detection error:", error);
    return 0;
  }
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

// Run on initial page load
processPosts();

// Observe feed for dynamically loaded posts
const observer = new MutationObserver(() => {
  processPosts();
});
observer.observe(document.body, { childList: true, subtree: true });

