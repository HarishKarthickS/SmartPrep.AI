// aiserver.js
const { Router } = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai").default;
const chat = require("../helpers/chat.js");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const tts = require("../helpers/tts.js");  // NEW: Import our TTS helper

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
// POST Route: Process a chat prompt, using full conversation context
// ------------------------------------------------------------------
router.post("/", firebaseAuthMiddleware, async (req, res) => {
  const overallStartTime = Date.now();
  try {
    // Now including a new parameter "generateAudio"
    const { prompt, model, chatId, generateAudio } = req.body;
    if (!prompt) {
      return res
        .status(400)
        .json({ status: 400, message: "Prompt is required" });
    }

    const chosenModel = model || "google/gemini-2.0-flash-lite-preview-02-05:free";
    console.log(prompt, model, chatId);
    
    // Retrieve previous conversation if chatId exists
    let messages = [];
    if (chatId) {
      const chatRetrieveStart = Date.now();
      try {
        const previousMessages = await chat.getChat(req.user.userId, chatId);
        // Optionally, limit the conversation context (e.g., last 10 messages)
        messages = previousMessages.slice(-10);
        console.log(`Chat retrieval took ${Date.now() - chatRetrieveStart}ms`);
      } catch (error) {
        console.error("Error retrieving conversation:", error);
        return res
          .status(404)
          .json({ status: 404, message: "Chat conversation not found" });
      }
    }

    // Fetch the stored user gist (if available) and add it as a system message to tailor responses.
    const userDocRef = admin.firestore().collection("chats").doc(req.user.userId.toString());
    const userSnapshot = await userDocRef.get();
    if (userSnapshot.exists && userSnapshot.data().gist) {
      messages.unshift({
        role: "system",
        content: `You are a teaching assistant bot. Use the following user preferences and learning context to provide detailed, clear, and instructive answers: ${userSnapshot.data().gist}`
      });
    } else {
      messages.unshift({
        role: "system",
        content: `You are a teaching assistant bot. Provide clear, detailed, and instructive answers.`
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
        messages, // Send the conversation context including the system message
      });
      openaiResponse = completion.choices[0].message.content.trim();
      console.log(`OpenRouter API call took ${Date.now() - openaiCallStart}ms`);
    } catch (err) {
      console.error("Error in OpenRouter API call:", err);
      return res.status(500).json({
        status: 500,
        message: err.message || "Internal Server Error",
      });
    }

    // ------------------------------------------------------------------
    // NEW: Conditionally convert the assistant response to speech
    // ------------------------------------------------------------------
    let audioUrl = null;
    if (generateAudio === true) {
      try {
        audioUrl = await tts.convertTextToSpeech(openaiResponse);
        console.log("TTS conversion successful, audioUrl:", audioUrl);
      } catch (ttsError) {
        console.error("Error converting text to speech:", ttsError);
        // Optionally, continue without audio or handle the error as needed.
        audioUrl = null;
      }
    }

    // Save or update the chat conversation in Firestore
    const dbStartTime = Date.now();
    let responseData = {};
    try {
      if (chatId) {
        await chat.updateChat(chatId, prompt, { openai: openaiResponse, audioUrl }, req.user.userId);
        responseData.chatId = chatId;
      } else {
        const result = await chat.newResponse(prompt, { openai: openaiResponse, audioUrl }, req.user.userId);
        responseData.chatId = result.chatId;
      }
      console.log(`Database update took ${Date.now() - dbStartTime}ms`);
    } catch (err) {
      console.error("Error saving chat data to Firestore:", err);
      return res
        .status(500)
        .json({ status: 500, message: err.message || "DB error" });
    }

    console.log(`Total processing time: ${Date.now() - overallStartTime}ms`);
    console.log("Response:", openaiResponse);
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: {
        content: openaiResponse,
        audioUrl, // Return the URL of the generated TTS audio file (or null if not generated)
        chatId: responseData.chatId,
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ status: 500, message: err.message || "Internal Server Error" });
  }
});

// ------------------------------------------------------------------
// GET Route: Retrieve Chat History for the Authenticated User
// ------------------------------------------------------------------
router.get("/console.log("Request received:", req.body);
console.log("User ID:", req.user.userId);
console.log("Chat ID:", chatId);
console.log("Model:", chosenModel);
console.log("Messages:", messages);
console.log("OpenAI Response:", openaiResponse);
console.log("Audio URL:", audioUrl);
console.log("Response Data:", responseData);saved", firebaseAuthMiddleware, async (req, res) => {
  try {
    const history = await chat.getHistory(req.user.userId);
    res.status(200).json({
      status: 200,
      message: "Success",
      data: history,
      
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// GET Route: Retrieve a Specific Chat Conversation by chatId
// ------------------------------------------------------------------
router.get("/:chatId", firebaseAuthMiddleware, async (req, res) => {
  const { chatId } = req.params;
  try {
    const chatData = await chat.getChat(req.user.userId, chatId);
    res.status(200).json({
      status: 200,
      message: "Success",
      data: chatData,
    });
  } catch (err) {
    console.error("Error fetching specific chat:", err);
    res.status(404).json({ status: 404, message: "Chat not found" });
  }
});

// ------------------------------------------------------------------
// DELETE Route: Delete All Chat History for the Authenticated User
// ------------------------------------------------------------------
router.delete("/all", firebaseAuthMiddleware, async (req, res) => {
  try {
    await chat.deleteAllChat(req.user.userId);
    res.status(200).json({
      status: 200,
      message: "Success",
    });
  } catch (err) {
    console.error("Error deleting chat history:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

module.exports = router;
