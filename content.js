chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translatePage") {
    translatePage();
  }
});

async function translatePage() {
  const elements = document.body.getElementsByTagName('*');
  const textNodes = [];

  for (let element of elements) {
    if (shouldTranslateElement(element)) {
      for (let node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
          textNodes.push(node);
        }
      }
    }
  }

  const batchSize = 10;
  for (let i = 0; i < textNodes.length; i += batchSize) {
    const batch = textNodes.slice(i, i + batchSize);
    await translateBatch(batch);
  }
}

function shouldTranslateElement(element) {
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'CODE', 'PRE'];
  return !excludedTags.includes(element.tagName);
}

async function translateBatch(nodes) {
  const texts = nodes.map(node => node.textContent);
  const combinedText = texts.join('\n||||\n');

  try {
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
      const translatedTexts = response.translatedText.split('\n||||\n');
      nodes.forEach((node, index) => {
        if (translatedTexts[index]) {
          node.textContent = translatedTexts[index];
        }
      });
    } else if (response.error) {
      console.error('Translation error:', response.error);
    }
  } catch (error) {
    console.error('Error in translateBatch:', error);
  }
}