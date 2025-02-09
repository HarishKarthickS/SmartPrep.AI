// helpers/summarise.js
const OpenAI = require("openai").default;
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": "SmartPrep",
  },
});

/**
 * Summarises the provided text using the OpenRouter API.
 *
 * @param {string} text - The text to summarise.
 * @param {number} [wordCount=5] - The desired number of words in the summary.
 * @returns {Promise<string>} - The summarised text.
 */
async function summariseText(text, wordCount = 5) {
  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages: [
        {
          role: "user",
          content: `Summarize the following text in ${wordCount} words: "${text}"`,
        },
      ],
      max_tokens: 20,
    });

    const summary = response.choices[0].message.content.trim();
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

/**
 * Generates a concise title for the provided text.
 *
 * @param {string} text - The text to generate a title for.
 * @returns {Promise<string>} - The generated title.
 */
async function generateTitle(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages: [
        {
          role: "user",
          content: `Provide a concise title for the following text: "${text}"`,
        },
      ],
      max_tokens: 10,
    });

    const title = response.choices[0].message.content.trim();
    return title;
  } catch (error) {
    console.error("Error generating title:", error);
    throw error;
  }
}

module.exports = { summariseText, generateTitle };
