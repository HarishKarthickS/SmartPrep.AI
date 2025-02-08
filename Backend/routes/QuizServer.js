// quizServer.js
const { Router } = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const quiz = require("../helpers/quiz.js");

dotenv.config();

const router = Router();

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
// POST Route: Generate a Quiz for a Learning Unit
// ------------------------------------------------------------------
router.post("/generate", firebaseAuthMiddleware, async (req, res) => {
  try {
    const { learningUnit } = req.body;
    if (!learningUnit) {
      return res.status(400).json({
        status: 400,
        message: "Learning unit is required",
      });
    }

    // Generate the quiz using the helper function.
    // The generateQuiz function is expected to:
    // 1. Create quiz content with questions, options, and answers.
    // 2. Store the generated quiz in Firebase under the user's record.
    // 3. Return the quiz data (including a unique quizId).
    const quizData = await quiz.generateQuiz(learningUnit, req.user.userId);
    
    return res.status(200).json({
      status: 200,
      message: "Quiz generated successfully",
      data: quizData,
    });
  } catch (err) {
    console.error("Error generating quiz:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

// ------------------------------------------------------------------
// POST Route: Submit Quiz Responses for Evaluation
// ------------------------------------------------------------------
router.post("/submit", firebaseAuthMiddleware, async (req, res) => {
  try {
    const { quizId, responses } = req.body;
    if (!quizId || !responses) {
      return res.status(400).json({
        status: 400,
        message: "Quiz ID and responses are required",
      });
    }

    // Evaluate the quiz responses using the helper function.
    // The evaluateQuiz function is expected to:
    // 1. Compare user responses with the correct answers stored in Firebase.
    // 2. Update the quiz record (or create a new record) with the evaluation results.
    // 3. Return an evaluation result (e.g., score and details about incorrect answers).
    const result = await quiz.evaluateQuiz(quizId, responses, req.user.userId);
    
    return res.status(200).json({
      status: 200,
      message: "Quiz evaluated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error submitting quiz:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }
});

module.exports = router;
