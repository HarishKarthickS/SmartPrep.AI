const { Router } = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai").default; // Required for CommonJS compatibility
const chat = require("../helpers/chat.js");
const { checkBlacklistedToken, logoutUser } = require("../middleware/authMiddleware"); // Import Auth Middleware

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
// 🚀 Welcome Route
// ------------------------------------------------------------------
router.get("/", (req, res) => {
  res.send("Welcome to SmartPrep API v1");
});

// ------------------------------------------------------------------
// 📝 POST Route: Handle AI Chat Requests
// ------------------------------------------------------------------
router.post("/", checkBlacklistedToken, async (req, res) => {
  const { prompt, context, model, chatId } = req.body;

  if (!prompt) {
    return res.status(400).json({ status: 400, message: "Prompt is required" });
  }

  // Construct the chat messages array
  let messages = context && Array.isArray(context) ? [...context] : [];
  messages.push({ role: "user", content: prompt });

  // Choose model (default if not provided)
  const chosenModel = model || "deepseek/deepseek-r1-distill-llama-70b:free";

  let openaiResponse;
  try {
    const completion = await openai.chat.completions.create({
      model: chosenModel,
      messages: messages,
    });
    openaiResponse = completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("Error in OpenRouter API call:", err);
    return res.status(500).json({ status: 500, message: err.message || "Internal Server Error" });
  }

  // Save the chat in Firestore
  try {
    let responseData = {};
    if (chatId) {
      await chat.updateChat(chatId, prompt, { openai: openaiResponse }, req.user.uid);
      responseData.chatId = chatId;
    } else {
      const result = await chat.newResponse(prompt, { openai: openaiResponse }, req.user.uid);
      responseData.chatId = result.chatId;
    }
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: {
        content: openaiResponse,
        chatId: responseData.chatId,
      },
    });
  } catch (err) {
    console.error("Error saving chat data to Firestore:", err);
    return res.status(500).json({ status: 500, message: err.message || "DB error" });
  }
});

// ------------------------------------------------------------------
// 📜 GET Route: Retrieve Chat History
// ------------------------------------------------------------------
router.get("/history", checkBlacklistedToken, async (req, res) => {
  try {
    const history = await chat.getHistory(req.user.uid);
    res.status(200).json({ status: 200, message: "Success", data: history });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ status: 500, message: err.message || "Internal Server Error" });
  }
});

// ------------------------------------------------------------------
// 🔍 GET Route: Retrieve a Specific Chat by chatId
// ------------------------------------------------------------------
router.get("/:chatId", checkBlacklistedToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    const chatData = await chat.getChat(req.user.uid, chatId);
    res.status(200).json({ status: 200, message: "Success", data: chatData });
  } catch (err) {
    console.error("Error fetching specific chat:", err);
    res.status(404).json({ status: 404, message: "Chat not found" });
  }
});

// ------------------------------------------------------------------
// ❌ DELETE Route: Remove All Chat History
// ------------------------------------------------------------------
router.delete("/all", checkBlacklistedToken, async (req, res) => {
  try {
    await chat.deleteAllChat(req.user.uid);
    res.status(200).json({ status: 200, message: "Success" });
  } catch (err) {
    console.error("Error deleting chat history:", err);
    res.status(500).json({ status: 500, message: err.message || "Internal Server Error" });
  }
});

// ------------------------------------------------------------------
// 🚪 POST Route: Logout and Blacklist Token
// ------------------------------------------------------------------
router.post("/logout", checkBlacklistedToken, logoutUser);

module.exports = router;
