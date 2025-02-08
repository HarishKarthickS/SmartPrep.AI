// helpers/tts.js
const PlayHT = require('playht'); 
const admin = require('firebase-admin');

// Initialize PlayHT with your credentials (you can set these in your .env file)
PlayHT.init({
  userId: process.env.PLAYHT_USER_ID,  // Set these in your environment
  apiKey: process.env.PLAYHT_API_KEY,
});

/**
 * Converts the given text to speech using PlayHT and uploads the resulting audio to Firebase Storage.
 * Returns a Promise that resolves with the public URL of the uploaded audio file.
 *
 * @param {string} text - The text to convert to speech.
 * @returns {Promise<string>} - Public URL for the stored audio file.
 */
async function convertTextToSpeech(text) {
  return new Promise(async (resolve, reject) => {
    try {
      // Request the TTS stream from PlayHT. You can adjust options (like voiceEngine) as needed.
      const stream = await PlayHT.stream(text, { voiceEngine: 'PlayDialog' });
      
      let chunks = [];
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          // Get the default bucket (make sure your Firebase Admin SDK is initialized with storage)
          const bucket = admin.storage().bucket();
          // Create a unique file name (here we use a timestamp)
          const filename = `tts/${Date.now()}.mp3`;
          const file = bucket.file(filename);
          
          // Save the audio buffer to the file with the proper content type
          await file.save(buffer, { contentType: 'audio/mpeg' });
          // Make the file public so that you can retrieve it via a URL
          await file.makePublic();
          const publicUrl = file.publicUrl();
          resolve(publicUrl);
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  convertTextToSpeech,
};
