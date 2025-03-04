# SmartPrep - AI-Powered Personalized Study Companion

## 📌 Overview
Welcome to **SmartPrep**, the ultimate AI-powered study companion and AI Studio that transforms your learning journey into an engaging adventure! 🚀 Whether you're mastering challenging topics, prepping for exams, or exploring new ideas, SmartPrep leverages cutting-edge AI to help you learn faster, smarter, and with a splash of fun. Unlock personalized insights, generate smart notes, and harness the power of multiple advanced AI models—all designed to boost your academic success!

## 🚀 Features
- **AI-Powered Summarization**: Instantly extract key points from lengthy study materials.
- **Smart Notes**: Automatically generate concise notes from lectures and books.
- **AI Tutor**: Enjoy personalized guidance that adapts to your unique learning style.
- **Personalized Study Recommendations**: Get AI-driven suggestions tailored to your needs.
- **Multiple Language Support**: Access study materials in the language of your choice.
- **Seamless User Experience**: Experience a clean, responsive interface built with the MERN stack.
- **Multi-Model AI Studio**: Tap into a variety of cutting-edge AI models, including:
  - **GPT-4 Turbo**
  - **Claude**
  - **Mistral**
  - **Gemini**
  - **Llama**
  - *and more!*
- **Customizable Chat Masks**: Create, share, and debug chat tools using customizable prompt templates.

## 🔮 Future Enhancements
- **Interactive Quizzes**: Generate quizzes to test your knowledge (coming soon!).
- **Real-Time Progress Tracking**: Monitor your learning journey with detailed analytics (coming soon!).
- **Flashcard Generation**
- **AI-Powered Doubt Solving**
- **Collaborative Study Groups**

## 🏗️ Tech Stack
- **Frontend**: Next, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI API and other models via OpenRouter
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

## 📥 Installation

### Prerequisites
Ensure you have the following installed:
- Node.js (v16 or later)
- MongoDB (local or cloud-based)
- A Firebase account for authentication

### Clone the Repository
```sh
git clone https://github.com/HarishKarthickS/SmartPrep.AI.git
cd smartprep
```

### Backend Setup
1. Navigate to the backend folder:
    ```sh
    cd backend
    ```
2. Install dependencies:
    ```sh
    npm install
    ```
3. Create a `.env` file and add the following:
    ```
    PORT=5000
    MONGO_URL=your_mongodb_connection_string
    JWT_PRIVATE_KEY=your_jwt_secret
    OPENAI_API_KEY=your_openai_api_key
    FIREBASE_CONFIG=your_firebase_credentials
    CLAUDE_API_KEY=your_claude_api_key
    MISTRAL_API_KEY=your_mistral_api_key
    GEMINI_API_KEY=your_gemini_api_key
    LLAMA_API_KEY=your_llama_api_key

    ```
4. Start the backend server:
    ```sh
    npm run dev
    ```

### Frontend Setup
1. Navigate to the frontend folder:
    ```sh
    cd ../frontend
    ```
2. Install dependencies:
    ```sh
    yarn
    ```
3. Create a `.env` file and add:
    ```
    VITE_API_URL=http://localhost:5000
    FIREBASE_CONFIG=your_firebase_credentials
    ```
4. Start the frontend:
    ```sh
    yarn run dev
    ```

## 🚀 Usage
1. Open the app in your browser at `http://localhost:5173`.
2. Sign up or log in using Firebase authentication.
3. Upload or paste your study material for AI-powered summarization.
4. Explore the AI Studio to harness multiple advanced AI models.
5. Customize your chat tools with masks to fine-tune your study experience.

## 📌 API Routes

### Authentication
- `POST /auth/signup` — User registration
- `POST /auth/login` — User login
- `POST /auth/logout` — User logout

### Study Features
- `POST /summarize` — Generate AI-based summaries
- `POST /quiz` — Generate quizzes from content (coming soon)
- `GET /progress` — Fetch user progress (coming soon)

## 📦 Deployment

### Frontend
Deploy on Vercel:
```sh
npm run build
vercel deploy
```

### Backend
Deploy on Railway:
```sh
railway up
```

## 💡 Contributing
We welcome contributions! Follow these steps to join the adventure:
1. Fork the repository.
2. Create a feature branch:
    ```sh
    git checkout -b feature-name
    ```
3. Commit your changes:
    ```sh
    git commit -m "Add new feature"
    ```
4. Push to your branch:
    ```sh
    git push origin feature-name
    ```
5. Open a Pull Request.

## 📄 License
This project is licensed under the **MIT License**.

## 📬 Contact
For any inquiries or ideas, feel free to reach out via harish.s@kalvium.community or open an issue in the repository.

Happy Learning with SmartPrep! 🚀🎓

