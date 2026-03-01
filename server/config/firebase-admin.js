const admin = require('firebase-admin')

let initialized = false

const initFirebaseAdmin = () => {
  if (initialized || admin.apps.length > 0) return

  try {
    let serviceAccount

    if (process.env.FIREBASE_ADMIN_SDK_JSON) {
      // Parse from environment variable (JSON string)
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON)
    } else if (process.env.FIREBASE_ADMIN_SDK_PATH) {
      // Load from file path
      serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_PATH)
    } else {
      // Dev fallback: use application default credentials
      admin.initializeApp()
      initialized = true
      console.log('✅ Firebase Admin initialized (default credentials)')
      return
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })

    initialized = true
    console.log('✅ Firebase Admin initialized')
  } catch (err) {
    console.error('❌ Firebase Admin initialization error:', err.message)
    // Don't crash server if firebase admin fails — auth middleware will handle it
  }
}

module.exports = { admin, initFirebaseAdmin }
