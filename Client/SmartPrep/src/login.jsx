import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth, googleProvider, yahooProvider, githubProvider } from "./firebase/auth";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Rotating messages on the right
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
    <div className="mt-6">
      <h2 className="text-2xl font-bold text-white">{messages[index].title}</h2>
      <p className="mt-2 text-lg text-gray-300">{messages[index].description}</p>
      <div className="flex mt-4 space-x-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full ${idx === index ? "bg-white" : "bg-gray-500"}`}
          ></div>
        ))}
      </div>
    </div>
  );
};

const Login = () => {
  // const navigate = useNavigate();
  // const location = useLocation();

  // Form state for email and password (name removed)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Firebase Email/Password login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await sendTokenToBackendEmail(token);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  // Social login handler
  const handleSocialLogin = async (provider) => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      const token = await user.getIdToken();
      await sendTokenToBackendSocial(token);
    } catch (error) {
      toast.error(`Login failed: ${error.message}`);
    }
  };

  // Send the Firebase token to your backend for further processing
  const sendTokenToBackendSocial = async (firebaseToken) => {
    try {
      const response = await axios.post("http://localhost:5000/auth/social-login", { firebaseToken });
      // Assume backend returns a JWT and user data
      localStorage.setItem("jwt", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Logged in successfully!");
      // navigate("/dashboard"); // Adjust redirection as needed
    } catch (error) {
      toast.error(`Login  failed: ${error.message}`);
    }
  };
  const sendTokenToBackendEmail = async (firebaseToken) => {
    try {
      const response = await axios.post("http://localhost:5000/auth/login-email", { firebaseToken });
      // Assume backend returns a JWT token and user data
      localStorage.setItem("jwt", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Logged in successfully!");
      // navigate("/dashboard"); // Adjust redirection as needed
    } catch (error) {
      toast.error(`Login failed: ${error.message}`);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/bg-img (2).png')",
      }}
    >
      {/* Black overlay for readability */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen px-6 py-12">
      <div className="md:w-1/2 text-center md:text-left text-white mt-8 md:mt-0 md:ml-8">
          <h1 className="text-5xl font-bold">SmartPrep AI</h1>
          <MessageSlider />
        </div>
        {/* Left Content: Login Form */}
        <div className="md:w-1/2 bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Login to Your Account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">Or sign in with</p>
            <div className="mt-4 flex justify-center space-x-4">
                          <button
                            onClick={() => handleSocialLogin(googleProvider)}
                            className="flex items-center gap-2 border border-gray-300 p-2 rounded-md hover:bg-gray-100 transition"
                          >
                            <img src="data:image/jpeg;base64,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" alt="Google" className="w-5 h-5" />
                            <span>Google</span>
                          </button>
                          <button
                            onClick={() => handleSocialLogin(githubProvider)}
                            className="flex items-center gap-2 border border-gray-300 p-2 rounded-md hover:bg-gray-100 transition"
                          >
                            <img src="data:image/png;base64,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" alt="GitHub" className="w-5 h-5" />
                            <span>GitHub</span>
                          </button>
                          <button
                            onClick={() => handleSocialLogin(yahooProvider)}
                            className="flex items-center gap-2 border border-gray-300 p-2 rounded-md hover:bg-gray-100 transition"
                          >
                            <img src="https://cdn-icons-png.flaticon.com/512/3128/3128296.png" alt="Yahoo" className="w-5 h-5" />
                            <span>Yahoo</span>
                          </button>
                        </div>
            <p className="mt-4 text-gray-600">
              Don't have an account?{" "}
              <a href="/signup" className="font-bold underline">
                SIGN UP HERE
              </a>
            </p>
            <div className="mt-6 flex justify-between text-sm text-gray-500">
              <a href="https://openai.com/policies/terms-of-use" target="_blank" rel="noopener noreferrer">
                Terms of Use
              </a>
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
        {/* Right Content: Branding & Message Slider */}
        
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
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
      `}</style>
    </div>
  );
};

export default Login;
