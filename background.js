const GROQ_API_KEY = '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';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    console.log("Received translation request in background");
    translateText(request.text)
      .then(translatedText => {
        console.log("Translation completed in background");
        sendResponse({ translatedText });
      })
      .catch(error => {
        console.error('Translation error:', error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates that the response is asynchronous
  }
});

async function translateText(text) {
  console.log("Starting translation in background");
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-text-preview",
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the given text into Traditional Chinese (Mandarin), adhering to the following guidelines:
1. Provide only the translated text in the output, without any additional comments or explanations.
2. Pay careful attention to the proper Chinese expression of dates, percentages, and other numerical information.
3. Ensure that the translation maintains the correct order of expression in Chinese, adjusting the structure of sentences when necessary to sound natural and idiomatic in Mandarin.
4. Preserve the original meaning and tone of the content while making it culturally appropriate for a Chinese-speaking audience.
5. Use Traditional Chinese characters throughout the translation.
6. Preserve any HTML tags present in the original text. Do not translate the content of HTML tags.
7. Only respond with the translated text, nothing else.
8. Do not include any separator strings like '||||' in your translation.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 7000 // Reduced from 16000 to a more reasonable number
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in translateText:', error);
    throw error;
  }
}