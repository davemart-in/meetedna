// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Cloud function via https://us-central1-YOUR-ACCOUNT-HERE.cloudfunctions.net/httpViewCheck
exports.httpViewCheck = functions.https.onRequest(async (req, res) => {
  
  // Allow cross-origin requests
  res.set('Access-Control-Allow-Origin', 'https://YOUR-ACCOUNT-HERE.firebaseapp.com');
  
  // Get the vars being passed in
  const key = req.body.key
  const uid = req.body.uid

  if (!key || !uid) {
    console.log('Error: Missing message key or user ID')
    return res.end(JSON.stringify({
      status: 'Error'
    }))
  }

  var viewsRef = admin.database().ref('/messages/' + key + '/users/' + uid)
  return viewsRef.once("value", function(data) {
    if (!data.val()) {
      // No record of view for this user
      viewsRef.set('seen')
      return res.end(JSON.stringify({
        status: 'show'
      }))
    } else {
      // User has already seen this message
      return res.end(JSON.stringify({
        status: 'seen'
      }))
    }
  });
})