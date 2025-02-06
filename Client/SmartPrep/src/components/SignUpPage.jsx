import React, { useState, useEffect } from "react";
import { auth, googleProvider, yahooProvider, githubProvider } from "./firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { insertUser } from "./redux/user"; // Adjust the path to your redux slice
import "./Auth.css"; // Import the CSS file if you choose to use an external file

// Rotating messages on the left
const messages = [
  {
    title: "Building Smarter Learners",
    description: "Empower your study routine with AI-powered insights for better retention and efficiency.",
  },
  {
    title: "Enhance your learning with AI-driven tools",
    description: "Leverage AI to generate summaries, quizzes, and personalized study plans effortlessly.",
  },
  {
    title: "Track progress, summarize, and quiz yourself",
    description: "Monitor your learning journey, review key concepts, and test your knowledge in real time.",
  },
];

const MessageSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="message-slider">
      <h2 className="text-xl font-bold">{messages[index].title}</h2>
      <p className="text-sm text-gray-500">{messages[index].description}</p>
      <div className="message-bar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bar ${idx === index ? "active" : ""}`}></div>
        ))}
      </div>
    </div>
  );
};

const Auth = () => {
  const dispatch = useDispatch();
  // Signup form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Using signup method only
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await sendTokenToBackend(token);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      const token = await user.getIdToken();
      await sendTokenToBackend(token);
    } catch (error) {
      toast.error(`Signup failed: ${error.message}`);
    }
  };

  const sendTokenToBackend = async (firebaseToken) => {
    try {
      const response = await axios.post("http://localhost:5000/auth/social-login", { firebaseToken });
      // Assuming your backend returns an object with both token and user data
      localStorage.setItem("jwt", response.data.token);
      dispatch(insertUser(response.data.user)); // Dispatch Redux action to store user data
      toast.success("Signed up successfully!");
    } catch (error) {
      toast.error(`Signup failed, ${error}`);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Image */}
      <div className="background"></div>

      {/* Black Overlay */}
      <div className="overlay"></div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Content */}
        <div className="left-content">
          <h1>SmartPrep AI</h1>
          <MessageSlider />
        </div>

        {/* Right Signup Form - Anchored to the bottom-right */}
        <div className="right-form">
          <h2>Create an Account</h2>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignup}>Get Started</button>
          <p className="text-center">Or</p>
          <button onClick={() => handleSocialLogin(googleProvider)} className="social-button">
            <img src="/icons/google.svg" alt="Google" /> Sign up with Google
          </button>
          <button onClick={() => handleSocialLogin(githubProvider)} className="social-button">
            <img src="/icons/github.svg" alt="GitHub" /> Sign up with GitHub
          </button>
          <button onClick={() => handleSocialLogin(yahooProvider)} className="social-button">
            <img src="/icons/yahoo.svg" alt="Yahoo" /> Sign up with Yahoo
          </button>
        </div>
      </div>

      <ToastContainer />

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .right-form {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Auth;
