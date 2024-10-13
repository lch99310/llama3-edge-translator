document.addEventListener("DOMContentLoaded", () => {
    const translateButton = document.getElementById("translateButton");
  
    translateButton.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "translatePage", targetLanguage: "Chinese" });
      });
    });
  });