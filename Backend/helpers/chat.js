const admin = require("firebase-admin");
const OpenAI = require("openai").default;

const db = admin.firestore();

// Create an OpenAI instance for generating summaries.
const openaiForSummary = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL, // Site URL for rankings on openrouter.ai.
    "X-Title": "SmartPrep",              // Site title for rankings on openrouter.ai.
  },
});

module.exports = {
  /**
   * Creates a new chat conversation for the given user.
   * Generates a 5-word summary of the prompt using the provided model,
   * then stores the initial user prompt, the summary, and the OpenAI response
   * as separate fields/messages in the document.
   *
   * @param {string} prompt - The user's prompt.
   * @param {Object} responseObj - An object containing the OpenAI response, e.g., { openai }.
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<Object>} - Resolves with an object containing the new chat's document reference and chatId.
   */
  newResponse: async (prompt, { openai }, userId) => {
    try {
      // Generate a 5-word summary of the prompt using max_tokens to limit output.
      const summaryCompletion = await openaiForSummary.chat.completions.create({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Summarize the following text in 5 words: "${prompt}"`,
              },
            ],
          },
        ],
        max_tokens: 10, // Adjust max_tokens to help ensure a concise summary
      });
      const summary = summaryCompletion.choices[0].message.content.trim();

      // Get a reference to the user's document in "chats"
      const userDocRef = db.collection("chats").doc(userId.toString());
      // Create (or merge into) the user document.
      await userDocRef.set({}, { merge: true });

      // Create a new document in the "data" subcollection for this conversation.
      const chatDocRef = userDocRef.collection("data").doc(); // auto-generated id
      const chatId = chatDocRef.id;

      // Build the conversation document data with a messages array and summary.
      const chatData = {
        summary, // The 5-word summary generated above.
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: openai },
        ],
        chatId, // The chatId
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Save the new conversation.
      await chatDocRef.set(chatData);

      // Update the user gist with the new prompt.
      // (This function call is added to store/update the gist that will be used to tailor future responses.)
      await module.exports.updateUserGist(prompt, userId);

      // Return the chatId along with any additional details as needed.
      return { chatId };
    } catch (err) {
      throw new Error(err.message || "Error creating new chat response");
    }
  },

  /**
   * Updates an existing chat conversation for the user by adding a new pair of messages:
   * one for the user's prompt and one for the AI's response.
   *
   * @param {string} chatId - The conversation document ID.
   * @param {string} prompt - The new user prompt.
   * @param {Object} responseObj - An object containing the OpenAI response, e.g., { openai }.
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<void>}
   */
  updateChat: async (chatId, prompt, { openai }, userId) => {
    try {
      const chatDocRef = db
        .collection("chats")
        .doc(userId.toString())
        .collection("data")
        .doc(chatId);

      // Append the new user prompt and assistant response as separate messages.
      await chatDocRef.update({
        messages: admin.firestore.FieldValue.arrayUnion(
          { role: "user", content: prompt },
          { role: "assistant", content: openai }
        ),
      });

      // Update the user gist with the new prompt.
      await module.exports.updateUserGist(prompt, userId);
    } catch (err) {
      throw new Error(err.message || "Error updating chat");
    }
  },

  /**
   * Retrieves a specific chat conversation for the given user.
   * Returns the array of message objects as the conversation context.
   *
   * @param {string} userId - The UID of the authenticated user.
   * @param {string} chatId - The conversation document ID.
   * @returns {Promise<Array>} - Resolves with the array of chat messages.
   */
  getChat: async (userId, chatId) => {
    try {
      const chatDocRef = db
        .collection("chats")
        .doc(userId.toString())
        .collection("data")
        .doc(chatId);

      const docSnapshot = await chatDocRef.get();
      if (!docSnapshot.exists) {
        throw { status: 404, message: "Chat not found" };
      }
      const data = docSnapshot.data();
      return data.messages; // Return the messages array as context
    } catch (err) {
      throw err;
    }
  },

  /**
   * Retrieves the most recent chat conversations for the given user.
   * Returns up to 10 conversations along with the chatId, the first user prompt,
   * the createdAt timestamp, and the summary.
   *
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<Array>} - Resolves with an array of chat history objects.
   */
  getHistory: async (userId) => {
    try {
      const chatsRef = db
        .collection("chats")
        .doc(userId.toString())
        .collection("data");

      // Query the most recent 10 conversations ordered by createdAt descending.
      const snapshot = await chatsRef
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      let history = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Retrieve the first user prompt from the messages array if available.
        let prompt = "";
        if (Array.isArray(data.messages)) {
          const firstUserMsg = data.messages.find((m) => m.role === "user");
          prompt = firstUserMsg ? firstUserMsg.content : "";
        }
        history.push({
          chatId: doc.id,
          prompt,
          summary: data.summary, // Include the summary in the history.
          createdAt: data.createdAt,
        });
      });

      return history;
    } catch (err) {
      throw new Error(err.message || "Error retrieving chat history");
    }
  },

  /**
   * Deletes all chat conversations for the given user.
   * In this implementation, it deletes the entire user document in the "chats" collection.
   *
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<void>}
   */
  deleteAllChat: async (userId) => {
    try {
      const userDocRef = db.collection("chats").doc(userId.toString());
      // Delete the user document. Note that Firestore does not automatically delete subcollections.
      // For a complete deletion, you would need to delete each document in the subcollection "data".
      // Here, we assume that deleting the user document is acceptable.
      await userDocRef.delete();
    } catch (err) {
      throw new Error(err.message || "Error deleting chat history");
    }
  },

  /**
   * Updates the user's gist based on the new prompt.
   * This gist can be used to tailor responses to the user's needs.
   *
   * @param {string} prompt - The new user prompt.
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<string>} - Resolves with the updated gist.
   */
  updateUserGist: async (prompt, userId) => {
    try {
      const userDocRef = db.collection("chats").doc(userId.toString());
      const userDocSnapshot = await userDocRef.get();
      let previousGist = "";
      if (userDocSnapshot.exists) {
        previousGist = userDocSnapshot.data().gist || "";
      }
      const gistPrompt = previousGist
      ? `You are a teaching assistant bot. Based on the previous gist: "${previousGist}" and the new input: "${prompt}", update the user gist to reflect the user's learning preferences and needs. Provide a concise summary that will help tailor future teaching responses.`
      : `You are a teaching assistant bot. Based on the following input: "${prompt}", create a user gist that reflects the user's learning preferences and needs. Provide a concise summary that will help tailor future teaching responses.`;
      const gistCompletion = await openaiForSummary.chat.completions.create({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          { role: "user", content: gistPrompt },
        ],
        max_tokens: 50,
      });
      const newGist = gistCompletion.choices[0].message.content.trim();
      await userDocRef.set({ gist: newGist }, { merge: true });
      return newGist;
    } catch (err) {
      console.error("Error updating user gist:", err);
      throw new Error(err.message || "Error updating user gist");
    }
  },
};
