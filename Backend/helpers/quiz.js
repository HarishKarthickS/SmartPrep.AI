// quiz.js
const admin = require("firebase-admin");
const OpenAI = require("openai").default;
const userData = require("./userData"); // Module to manage separate user meta data

const db = admin.firestore();

// Ensure required environment variables are defined.
if (!process.env.OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY is not defined in environment variables");
  throw new Error("Missing OPENROUTER_API_KEY");
}
if (!process.env.SITE_URL) {
  console.error("SITE_URL is not defined in environment variables");
  throw new Error("Missing SITE_URL");
}

// Create an OpenAI instance for quiz generation and gist updates.
// We rely on the `apiKey` property, allowing the library to set the Authorization header.
const openaiForQuiz = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": "SmartPrep",
  },
});

module.exports = {
  /**
   * Generates a quiz based on the provided learning unit.
   * If the user has taken a quiz before, the quizGist (tracking weak topics)
   * is used to tailor the new quiz questions.
   *
   * @param {string} learningUnit - The learning unit content.
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<Object>} - Resolves with the generated quiz data.
   */
  generateQuiz: async (learningUnit, userId) => {
    console.log("generateQuiz: starting for user:", userId);
    try {
      // Reference the user's quiz document.
      const userQuizRef = db.collection("quizzes").doc(userId.toString());
      let previousGist = "";
      let isRepeatAttempt = false;

      try {
        const userQuizSnapshot = await userQuizRef.get();
        if (userQuizSnapshot.exists && userQuizSnapshot.data().quizGist) {
          previousGist = userQuizSnapshot.data().quizGist;
          isRepeatAttempt = true;
        }
      } catch (err) {
        console.error("Error retrieving user quiz document:", err);
        throw err;
      }

      // Construct the prompt to generate quiz questions.
      let quizPrompt = "";
      if (isRepeatAttempt) {
        quizPrompt = `You are an expert quiz generator for a teaching assistant platform.
The learning unit is: "${learningUnit}".
Based on the student's previous performance issues: "${previousGist}", generate a quiz with 5 questions that focus more on the topics where the student is lagging.
Each question should include a question text, an array of 4 options, and the correct answer.
Return the output as a valid JSON array of objects in the following format:
[
  {
    "question": "Question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "Correct answer"
  }
]`;
      } else {
        quizPrompt = `You are an expert quiz generator for a teaching assistant platform.
The learning unit is: "${learningUnit}".
Generate a quiz with 5 questions covering the key concepts of the unit.
Each question should include a question text, an array of 4 options, and the correct answer.
Return the output as a valid JSON array of objects in the following format:
[
  {
    "question": "Question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "Correct answer"
  }
]`;
      }
      console.log("Quiz prompt:", quizPrompt);

      // Call the external OpenRouter API to generate quiz questions.
      let completion;
      try {
        completion = await openaiForQuiz.chat.completions.create({
          model: "qwen/qwen-vl-plus:free", // adjust the model as needed
          messages: [{ role: "user", content: quizPrompt }],
          max_tokens: 500,
        });
        console.log("OpenAI completion response:", completion);
      } catch (err) {
        console.error("Error calling OpenRouter API for quiz generation:", err);
        throw err;
      }
      
      // Retrieve and trim the response content.
      let quizResponse;
      try {
        quizResponse = completion.choices[0].message.content.trim();
        console.log("Quiz response received:", quizResponse);
      } catch (err) {
        console.error("Error extracting quiz response from OpenAI response:", err);
        throw err;
      }

      // Parse the response into a JSON array.
      let quizArray = [];
      try {
        quizArray = JSON.parse(quizResponse);
        console.log("Parsed quiz array:", quizArray);
      } catch (e) {
        console.error("Error parsing quiz JSON response:", e);
        throw new Error("Failed to parse quiz JSON response from AI: " + e.message);
      }

      // Store the quiz in Firestore.
      let quizDocRef;
      try {
        quizDocRef = userQuizRef.collection("attempts").doc(); // auto-generated ID
        const quizId = quizDocRef.id;
        const quizData = {
          quizId,
          learningUnit,
          questions: quizArray,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await quizDocRef.set(quizData);
        console.log("Quiz data stored in Firestore:", quizData);

        // Store the quizId in a separate user meta document.
        await userData.addQuizId(userId, quizId);

        return quizData;
      } catch (err) {
        console.error("Error storing quiz in Firestore:", err);
        throw err;
      }
    } catch (err) {
      console.error("Error in generateQuiz:", err);
      throw new Error(err.message || "Error generating quiz");
    }
  },

  /**
   * Evaluates the quiz responses against the correct answers.
   * Also updates the user's overall quiz performance gist so that future quizzes
   * can target areas where the student is struggling.
   *
   * @param {string} quizId - The ID of the quiz attempt.
   * @param {Array} responses - An array of user responses corresponding to each question.
   * @param {string} userId - The UID of the authenticated user.
   * @returns {Promise<Object>} - Resolves with an evaluation result containing the score and details.
   */
  evaluateQuiz: async (quizId, responses, userId) => {
    console.log("evaluateQuiz: starting for quizId:", quizId, "user:", userId);
    try {
      // Retrieve the quiz attempt from Firestore.
      const userQuizRef = db.collection("quizzes").doc(userId.toString());
      let quizDocRef;
      try {
        quizDocRef = userQuizRef.collection("attempts").doc(quizId);
      } catch (err) {
        console.error("Error getting quizDocRef:", err);
        throw err;
      }
      let quizDoc;
      try {
        quizDoc = await quizDocRef.get();
      } catch (err) {
        console.error("Error retrieving quiz document:", err);
        throw err;
      }
      if (!quizDoc.exists) {
        const errorMsg = "Quiz not found for quizId: " + quizId;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      const quizData = quizDoc.data();
      const questions = quizData.questions;
      if (!Array.isArray(questions)) {
        const errorMsg = "Quiz data is invalid: questions field is not an array";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Evaluate the responses.
      let score = 0;
      const incorrectQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const correctAnswer = questions[i].answer;
        const userAnswer = responses[i];
        if (userAnswer === correctAnswer) {
          score++;
        } else {
          incorrectQuestions.push({
            question: questions[i].question,
            correctAnswer,
            userAnswer,
          });
        }
      }
      console.log("Evaluation complete: score", score, "out of", questions.length);

      // Update the quiz document with the evaluation details.
      try {
        await quizDocRef.update({
          evaluation: {
            score,
            total: questions.length,
            incorrectQuestions,
            evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        });
        console.log("Updated quiz document with evaluation details");
      } catch (err) {
        console.error("Error updating quiz document with evaluation:", err);
        throw err;
      }

      // If there are any incorrectly answered questions, update the user's quiz performance gist.
      if (incorrectQuestions.length > 0) {
        const gistPrompt = `You are an expert teaching assistant. Based on the following incorrectly answered questions: ${JSON.stringify(
          incorrectQuestions
        )}, provide a concise summary of the topics or concepts the student needs to review.`;
        console.log("Gist prompt:", gistPrompt);
        let gistCompletion;
        try {
          gistCompletion = await openaiForQuiz.chat.completions.create({
            model: "google/gemini-2.0-flash-lite-preview-02-05:free",
            messages: [{ role: "user", content: gistPrompt }],
            max_tokens: 50,
          });
          console.log("Gist completion response:", gistCompletion);
        } catch (err) {
          console.error("Error calling OpenRouter API for gist generation:", err);
          throw err;
        }
        const newQuizGist = gistCompletion.choices[0].message.content.trim();
        console.log("New quiz gist generated:", newQuizGist);
        try {
          await userQuizRef.set({ quizGist: newQuizGist }, { merge: true });
          console.log("Updated user quiz document with new quiz gist");
        } catch (err) {
          console.error("Error updating quiz gist in Firestore:", err);
          throw err;
        }
      }

      return {
        score,
        total: questions.length,
        incorrectQuestions,
      };
    } catch (err) {
      console.error("Error in evaluateQuiz:", err);
      throw new Error(err.message || "Error evaluating quiz");
    }
  },
};
