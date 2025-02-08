// userData.js
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Adds a quiz ID to the user's meta data document.
 *
 * @param {string} userId - The UID of the user.
 * @param {string} quizId - The quiz ID to add.
 * @returns {Promise<void>}
 */
const addQuizId = async (userId, quizId) => {
  const userMetaRef = db.collection("user_meta").doc(userId.toString());
  await userMetaRef.set(
    {
      quizIds: admin.firestore.FieldValue.arrayUnion(quizId),
    },
    { merge: true }
  );
};

/**
 * Adds a chat ID to the user's meta data document.
 *
 * @param {string} userId - The UID of the user.
 * @param {string} chatId - The chat ID to add.
 * @returns {Promise<void>}
 */
const addChatId = async (userId, chatId) => {
  const userMetaRef = db.collection("user_meta").doc(userId.toString());
  await userMetaRef.set(
    {
      chatIds: admin.firestore.FieldValue.arrayUnion(chatId),
    },
    { merge: true }
  );
};

/**
 * Retrieves the user's meta data.
 *
 * @param {string} userId - The UID of the user.
 * @returns {Promise<Object>} - The meta data (with quizIds and chatIds).
 */
const getUserMeta = async (userId) => {
  const userMetaRef = db.collection("user_meta").doc(userId.toString());
  const doc = await userMetaRef.get();
  return doc.exists ? doc.data() : { quizIds: [], chatIds: [] };
};

module.exports = {
  addQuizId,
  addChatId,
  getUserMeta,
};
