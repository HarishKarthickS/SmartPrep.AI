# SmartPrep - AI-Powered Personalized Study Companion

## 📌 Overview
SmartPrep is an AI-powered study companion designed to help students optimize their learning process. By leveraging AI, SmartPrep provides summarized content, interactive quizzes, and progress tracking, making studying more efficient and engaging. 

## 🚀 Features
- **AI-Powered Summarization**: Extract key points from lengthy study materials.
- **Interactive Quizzes**: Generate quizzes based on your learning material.
- **Real-Time Progress Tracking**: Monitor your learning journey.
- **Personalized Study Recommendations**: AI-driven suggestions to improve study efficiency.
- **Smart Notes**: Automatically generate concise notes from lectures or books.
- **AI Tutor**: Adapts and teaches according to the user's learning style and progress.
- **Multiple Language Support**: Learn in different languages.
- **Seamless User Experience**: Clean UI built using MERN stack.

## 🏗️ Tech Stack
- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI API via OpenRouter
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

## 📥 Installation
### Prerequisites
Ensure you have the following installed:
- Node.js (v16 or later)
- MongoDB (local or cloud-based)
- Firebase Account (for authentication)

### Clone the Repository
```sh
$ git clone https://github.com/HarishKarthickS/SmartPrep.AI.git
$ cd smartprep
```

### Backend Setup
1. Navigate to the backend folder:
```sh
$ cd backend
```
2. Install dependencies:
```sh
$ npm install
```
3. Create a `.env` file and add the following:
```
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_PRIVATE_KEY=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
FIREBASE_CONFIG=your_firebase_credentials
```
4. Start the backend server:
```sh
$ npm run dev
```

### Frontend Setup
1. Navigate to the frontend folder:
```sh
$ cd ../frontend
```
2. Install dependencies:
```sh
$ npm install
```
3. Create a `.env` file and add:
```
VITE_API_URL=http://localhost:5000
FIREBASE_CONFIG=your_firebase_credentials
```
4. Start the frontend:
```sh
$ npm run dev
```

## 🚀 Usage
1. Open the app in your browser at `http://localhost:5173`.
2. Sign up or log in using Firebase authentication.
3. Upload or paste study material for AI-powered summarization.
4. Generate quizzes and track your progress.

## 📌 API Routes
### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Study Features
- `POST /summarize` - Generate AI-based summaries
- `POST /quiz` - Generate quizzes from content
- `GET /progress` - Fetch user progress

## 📦 Deployment
### Frontend
Deploy on Vercel:
```sh
$ npm run build
$ vercel deploy
```
### Backend
Deploy on Railway:
```sh
$ railway up
```

## 🎯 Future Enhancements
- Flashcard Generation
- AI-Powered Doubt Solving
- Collaborative Study Groups

## 💡 Contributing
We welcome contributions! Follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit changes (`git commit -m "Added new feature"`).
4. Push to branch (`git push origin feature-name`).
5. Open a Pull Request.

## 📄 License
This project is licensed under the MIT License.

## 📬 Contact
For any inquiries, reach out via [your email] or open an issue in the repository.

Happy Learning with SmartPrep! 🚀

