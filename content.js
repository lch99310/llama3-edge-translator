chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translatePage") {
    console.log("Received translatePage message");
    translatePage()
      .then(() => {
        console.log("Translation completed");
        sendResponse({ status: "completed" });
        chrome.runtime.sendMessage({ action: "translationComplete" });
      })
      .catch(error => {
        console.error("Translation error:", error);
        sendResponse({ status: "error", message: error.toString() });
        chrome.runtime.sendMessage({ action: "translationError", error: error.toString() });
      });
    return true; // Indicates that the response is asynchronous
  }
});

async function translatePage() {
  console.log("Starting page translation");
  const elements = document.body.getElementsByTagName('*');
  const textNodes = []; // Moved this line inside the function

  for (let element of elements) {
    if (shouldTranslateElement(element)) {
      for (let node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
          textNodes.push(node);
        }
      }
    }
  }

  const batchSize = 5;
  try {
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      await translateBatch(batch);
    }
    console.log("Page translation completed");
  } catch (error) {
    console.error("Translation error:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

function shouldTranslateElement(element) {
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'CODE', 'PRE'];
  return !excludedTags.includes(element.tagName);
}

async function translateBatch(nodes) {
  const texts = nodes.map(node => node.textContent);
  const combinedText = texts.join('\n<SEPARATOR>\n');

  try {
    console.log("Sending translation request for batch");
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "translate", text: combinedText },
        response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response.translatedText) {
      console.log("Received translated text for batch");
      const translatedTexts = response.translatedText.split('\n<SEPARATOR>\n');
      nodes.forEach((node, index) => {
        if (translatedTexts[index]) {
          node.textContent = translatedTexts[index].replace(/\|\|\|\|/g, '');
        }
      });
    } else if (response.error) {
      console.error('Translation error:', response.error);
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error in translateBatch:', error);
    throw error;
  }
}