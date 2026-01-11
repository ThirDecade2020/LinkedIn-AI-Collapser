// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkAI") {
    fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message.text })
    })
    .then(res => res.json())
    .then(data => {
      sendResponse({ ai_percent: data.ai_percent ?? 0 });
    })
    .catch(err => {
      console.error("Background AI fetch error:", err);
      sendResponse({ ai_percent: 0 });
    });

    // Keep the messaging channel open for async response
    return true;
  }
});

