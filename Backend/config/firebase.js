const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Construct service account object from environment variables
const serviceAccount = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"), // Ensure newlines are correctly formatted
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
};

// Ensure Firebase Admin SDK is initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Function to verify Firebase token
async function verifyFirebaseToken(token) {
    try {
        return await admin.auth().verifyIdToken(token);
    } catch (error) {
        console.error("Firebase token verification failed:", error);
        return null;
    }
}

module.exports = { verifyFirebaseToken, admin };
