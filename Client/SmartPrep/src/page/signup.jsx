import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { auth, googleProvider, yahooProvider, githubProvider } from "../firebase/auth";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Redux actions & config
import { insertUser } from "./redux/user"; // Adjust the path to your redux slice
import { setLoading } from "../redux/loading"; // Adjust the path as needed
import instance from "../config/instance";

// Components for pending registration and signup content
import { RegisterPendings } from "../components"; // Expected pending registration component

// CSS
import "./Auth.css";

// Rotating messages on the left
const messages = [
  {
    title: "Building Smarter Learners",
    description:
      "Empower your study routine with AI-powered insights for better retention and efficiency.",
  },
  {
    title: "Enhance your learning with AI-driven tools",
    description:
      "Leverage AI to generate summaries, quizzes, and personalized study plans effortlessly.",
  },
  {
    title: "Track progress, summarize, and quiz yourself",
    description:
      "Monitor your learning journey, review key concepts, and test your knowledge in real time.",
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
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useSelector((state) => state);

  // Local state for pending registration check
  const [pending, setPending] = useState(false);

  // Firebase form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Check for pending registration if an id exists and we are not on the base /signup path
  useEffect(() => {
    if (!user) {
      if (location?.pathname === "/signup" || location?.pathname === "/signup/") {
        setPending(false);
        // Optionally delay hiding a loading spinner
        setTimeout(() => {
          dispatch(setLoading(false));
        }, 1000);
      } else {
        const checkPending = async () => {
          let res = null;
          try {
            res = await instance.get("/api/user/checkPending", {
              params: { _id: id },
            });
          } catch (err) {
            console.error(err);
            if (err?.response?.status === 404) {
              navigate("/404");
            } else {
              alert(err);
              navigate("/signup");
            }
          } finally {
            // If the status returned from your backend is not 208, mark registration as pending
            if (res?.data?.status !== 208) {
              setPending(true);
              setTimeout(() => {
                dispatch(setLoading(false));
              }, 1000);
            }
          }
        };

        checkPending();
      }
    }
  }, [location, user, id, navigate, dispatch]);

  // Firebase Email/Password signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Signup via Firebase email/password method
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await sendTokenToBackend(token);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Social login handler (Google, GitHub, Yahoo)
  const handleSocialLogin = async (provider) => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      const token = await user.getIdToken();
      await sendTokenToBackend(token);
    } catch (error) {
      toast.error(`Signup failed: ${error.message}`);
    }
  };

  // Send the Firebase token to your backend for further processing
  const sendTokenToBackend = async (firebaseToken) => {
    try {
      const response = await axios.post("http://localhost:5000/auth/social-login", { firebaseToken });
      // Assume your backend returns both a JWT and user data
      localStorage.setItem("jwt", response.data.token);
      dispatch(insertUser(response.data.user)); // Save user data to Redux store
      toast.success("Signed up successfully!");
    } catch (error) {
      toast.error(`Signup failed, ${error}`);
    }
  };

  // If pending registration is active, show the pending component
  if (pending) {
    return (
      <div className="Auth">
        <div className="inner">
          <RegisterPendings _id={id} />
        </div>
      </div>
    );
  }

  // Otherwise, render the signup form (Firebase/auth content)
  return (
    <div className="auth-container">
      {/* Background Image */}
      <div className="background"></div>

      {/* Black Overlay */}
      <div className="overlay"></div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Content: Title & Message Slider */}
        <div className="left-content">
          <h1>SmartPrep AI</h1>
          <MessageSlider />
        </div>

        {/* Right Signup Form */}
        <div className="right-form">
          <h2>Create an Account</h2>
          <form onSubmit={handleSignup}>
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
            <button type="submit">Get Started</button>
          </form>
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
          <div className="bottum">
            <div className="start">
              <a href="https://openai.com/policies/terms-of-use" target="_blank" rel="noopener noreferrer">
                Terms of Use
              </a>
            </div>
            <div className="end">
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </div>
          </div>
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
