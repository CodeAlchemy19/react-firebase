/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");

const functions = require("firebase-functions");
// const fetch = require("node-fetch");


// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// 🔐 Your secure 2Factor API key (stored in Firebase config)
// const API_KEY = functions.config().twofactor.key;

// ✅ Generate random 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ SEND OTP via 2Factor custom template
exports.sendOtp = functions.https.onCall(async (data, context) => {
  console.log(data);
  const phone = data.data.phone;

  if (!phone) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
  }

  const otp = generateOtp();

  const url = `https://2factor.in/API/V1/585989fb-bb1a-11f0-bdde-0200cd936042/SMS/${phone}/${otp}/M7EE`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.Status !== "Success") {
      throw new functions.https.HttpsError('internal', 'Failed to send OTP');
    }

    return { sessionId: result.Details, otp };
  } catch (err) {
    console.error("Error sending OTP:", err);
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// ✅ VERIFY OTP (manual match)
exports.verifyOtp = functions.https.onCall(async (data, context) => {
  const { inputOtp, sentOtp } = data.data;
  if (!inputOtp || !sentOtp) {
    throw new functions.https.HttpsError("invalid-argument", "Missing OTPs for verification");
  }

  if (inputOtp === sentOtp) {
    return { status: "verified" };
  } else {
    throw new functions.https.HttpsError("permission-denied", "Invalid OTP");
  }
});