// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const AppleStrategy = require('passport-apple').Strategy;
// const bcrypt = require('bcrypt');
// const userModel = require('../models/User.model');
// const jwt = require('jsonwebtoken');

// // Local Strategy (Email & Password)
// passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
//     try {
//         const user = await userModel.findOne({ email });
//         if (!user) return done(null, false, { message: 'No user found' });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return done(null, false, { message: 'Wrong password' });

//         return done(null, user);
//     } catch (err) {
//         return done(err);
//     }
// }));

// // OAuth Handler Function
// async function handleOAuthLogin(profile, provider, done) {
//     try {
//         let user = await userModel.findOne({ [`${provider}Id`]: profile.id });

//         if (!user) {
//             user = await userModel.create({
//                 [`${provider}Id`]: profile.id,
//                 name: profile.displayName || "No Name",
//                 email: profile.emails?.[0]?.value || null,
//             });
//         }
//         return done(null, user);
//     } catch (err) {
//         return done(err, null);
//     }
// }

// // Google Auth
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => handleOAuthLogin(profile, "google", done)));

// // Facebook Auth
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     callbackURL: "/auth/facebook/callback",
//     profileFields: ['id', 'displayName', 'emails'],
// }, (accessToken, refreshToken, profile, done) => handleOAuthLogin(profile, "facebook", done)));

// // Apple Auth
// passport.use(new AppleStrategy({
//     clientID: process.env.APPLE_CLIENT_ID,
//     teamID: process.env.APPLE_TEAM_ID,
//     keyID: process.env.APPLE_KEY_ID,
//     privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
//     callbackURL: "/auth/apple/callback",
// }, (accessToken, refreshToken, idToken, profile, done) => handleOAuthLogin(profile, "apple", done)));

// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await userModel.findById(id);
//         done(null, user);
//     } catch (err) {
//         done(err, null);
//     }
// });

// module.exports = passport;
