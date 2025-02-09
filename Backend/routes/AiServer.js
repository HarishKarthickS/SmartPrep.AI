// aiserver.js
const { Router } = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai").default;
const chat = require("../helpers/chat.js");
const summarise = require("../helpers/summarise.js"); // Import the summarise helper
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const tts = require("../helpers/tts.js"); // Import our TTS helper

dotenv.config();

const router = Router();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": "SmartPrep",
  },
});

// ------------------------------------------------------------------
// JWT-Based Authentication Middleware
// ------------------------------------------------------------------
async function firebaseAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ status: 401, message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ status: 401, message: "Malformed token" });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }
}

// ------------------------------------------------------------------
// Welcome Route
// ------------------------------------------------------------------
router.get("/", (req, res) => {
  res.send("Welcome to SmartPrep API v1");
});

// ------------------------------------------------------------------
// GET Route: Retrieve Summaries for the Authenticated User
// ------------------------------------------------------------------
router.get("/summaries", firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = admin.firestore();

    // Reference the summaries subcollection for the user.
    const summariesRef = db
      .collection("summaries")
      .doc(userId.toString())
      .collection("data");

    // Retrieve summaries ordered by creation date (latest first)
    const snapshot = await summariesRef.orderBy("createdAt", "desc").get();
    const summaries = [];
    snapshot.forEach((doc) => {
      summaries.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      status: 200,
      message: "Summaries retrieved successfully",
      data: summaries,
    });
  } catch (error) {
    console.error("Error retrieving summaries:", error);
    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// POST Route: Generate a Summary for a given text
// ------------------------------------------------------------------
router.post("/summarize", firebaseAuthMiddleware, async (req, res) => {
  const { text, wordCount } = req.body;
  if (!text) {
    return res.status(400).json({
      status: 400,
      message: "Text is required for summarization",
    });
  }

  try {
    const summary = await summarise.summariseText(text, wordCount || 5);
    return res.status(200).json({
      status: 200,
      message: "Summary generated successfully",
      summary,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// POST Route: Process a Chat Prompt (with optional audio conversion)
// ------------------------------------------------------------------
router.post("/", firebaseAuthMiddleware, async (req, res) => {
  const overallStartTime = Date.now();
  try {
    const { prompt, model, chatId, generateAudio } = req.body;
    if (!prompt) {
      return res
        .status(400)
        .json({ status: 400, message: "Prompt is required" });
    }

    const chosenModel =
      model || "google/gemini-2.0-flash-lite-preview-02-05:free";
    console.log("Prompt:", prompt, "Model:", model, "Chat ID:", chatId);

    // Retrieve previous conversation if chatId exists
    let messages = [];
    if (chatId) {
      const chatRetrieveStart = Date.now();
      try {
        const previousMessages = await chat.getChat(req.user.userId, chatId);
        // Limit the conversation context (e.g., last 10 messages)
        messages = previousMessages.slice(-10);
        console.log(
          `Chat retrieval took ${Date.now() - chatRetrieveStart}ms`
        );
      } catch (error) {
        console.error("Error retrieving conversation:", error);
        return res
          .status(404)
          .json({ status: 404, message: "Chat conversation not found" });
      }
    }

    // Fetch the stored user gist (if available) and add it as a system message
    const userDocRef = admin
      .firestore()
      .collection("chats")
      .doc(req.user.userId.toString());
    const userSnapshot = await userDocRef.get();
    if (userSnapshot.exists && userSnapshot.data().gist) {
      messages.unshift({
        role: "system",
        content: `You are a teaching assistant bot. Use the following user preferences and learning context to provide detailed, clear, and instructive answers: ${userSnapshot.data().gist}`,
      });
    } else {
      messages.unshift({
        role: "system",
        content:
          "You are a teaching assistant bot. Provide clear, detailed, and instructive answers.",
      });
    }

    // Append the new user prompt to the conversation context
    messages.push({ role: "user", content: prompt });

    // Call the external OpenRouter API
    const openaiCallStart = Date.now();
    let openaiResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: chosenModel,
        messages,
      });
      openaiResponse = completion.choices[0].message.content.trim();
      console.log(
        `OpenRouter API call took ${Date.now() - openaiCallStart}ms`
      );
    } catch (err) {
      console.error("Error in OpenRouter API call:", err);
      return res.status(500).json({
        status: 500,
        message: err.message || "Internal Server Error",
      });
    }

    // Optionally convert the assistant response to speech
    let audioUrl = null;
    if (generateAudio === true) {
      try {
        audioUrl = await tts.convertTextToSpeech(openaiResponse);
        console.log("TTS conversion successful, audioUrl:", audioUrl);
      } catch (ttsError) {
        console.error("Error converting text to speech:", ttsError);
        audioUrl = null;
      }
    }

    // Save or update the chat conversation in Firestore
    const dbStartTime = Date.now();
    let responseData = {};
    try {
      if (chatId) {
        await chat.updateChat(
          chatId,
          prompt,
          { openai: openaiResponse, audioUrl },
          req.user.userId
        );
        responseData.chatId = chatId;
      } else {
        const result = await chat.newResponse(
          prompt,
          { openai: openaiResponse, audioUrl },
          req.user.userId
        );
        responseData.chatId = result.chatId;
      }
      console.log(
        `Database update took ${Date.now() - dbStartTime}ms`
      );
    } catch (err) {
      console.error("Error saving chat data to Firestore:", err);
      return res.status(500).json({
        status: 500,
        message: err.message || "DB error",
      });
    }

    console.log(
      `Total processing time: ${Date.now() - overallStartTime}ms`
    );
    console.log("Response:", openaiResponse);
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: {
        content: openaiResponse,
        audioUrl, // URL of the generated TTS audio file (or null if not generated)
        chatId: responseData.chatId,
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// GET Route: Retrieve Chat History for the Authenticated User
// ------------------------------------------------------------------
router.get("/history", firebaseAuthMiddleware, async (req, res) => {
  try {
    const history = await chat.getHistory(req.user.userId);
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: history,
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// GET Route: Retrieve Dashboard Data (Summaries, Chat History, Quizzes)
// ------------------------------------------------------------------
router.get("/dashboard", firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = admin.firestore();

    // Retrieve Summaries
    const summariesSnapshot = await db
      .collection("summaries")
      .doc(userId.toString())
      .collection("data")
      .orderBy("createdAt", "desc")
      .get();
    const summaries = [];
    summariesSnapshot.forEach((doc) => {
      summaries.push({ id: doc.id, ...doc.data() });
    });

    // Retrieve Chat History
    const chatsSnapshot = await db
      .collection("chats")
      .doc(userId.toString())
      .collection("data")
      .orderBy("createdAt", "desc")
      .get();
    const chats = [];
    chatsSnapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    // Retrieve Quiz Attempts
    const quizzesSnapshot = await db
      .collection("quizzes")
      .doc(userId.toString())
      .collection("attempts")
      .orderBy("createdAt", "desc")
      .get();
    const quizzes = [];
    quizzesSnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });

    const dashboardData = { summaries, chats, quizzes };

    return res.status(200).json({
      status: 200,
      message: "Dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (err) {
    console.error("Error retrieving dashboard data:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// GET Route: Retrieve a Specific Chat Conversation by chatId
// (Renamed to avoid conflict with other routes.)
// ------------------------------------------------------------------
router.get("/chat/:chatId", firebaseAuthMiddleware, async (req, res) => {
  const { chatId } = req.params;
  try {
    const chatData = await chat.getChat(req.user.userId, chatId);
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: chatData,
    });
  } catch (err) {
    console.error("Error fetching specific chat:", err);
    return res.status(404).json({ status: 404, message: "Chat not found" });
  }
});

// ------------------------------------------------------------------
// DELETE Route: Delete All Chat History for the Authenticated User
// ------------------------------------------------------------------
router.delete("/all", firebaseAuthMiddleware, async (req, res) => {
  try {
    await chat.deleteAllChat(req.user.userId);
    return res.status(200).json({
      status: 200,
      message: "Success",
    });
  } catch (err) {
    console.error("Error deleting chat history:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

module.exports = router;
