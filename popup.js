document.addEventListener("DOMContentLoaded", () => {
  const translateButton = document.getElementById("translateButton");
  const spinner = document.getElementById("spinner");

  translateButton.addEventListener("click", () => {
    // Start processing animation
    translateButton.classList.add("processing");
    translateButton.textContent = "Translating...";
    spinner.style.display = "block";

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "translatePage" });
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translationComplete") {
      // End processing animation
      translateButton.classList.remove("processing");
      translateButton.textContent = "Translate Page to Chinese";
      spinner.style.display = "none";
      console.log("Translation completed");
    } else if (request.action === "translationError") {
      // Handle error
      translateButton.classList.remove("processing");
      translateButton.textContent = "Translation Failed";
      spinner.style.display = "none";
      console.error("Translation error:", request.error);
    }
  });
});