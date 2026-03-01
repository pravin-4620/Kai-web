const express = require('express')
const router = express.Router()

const VAPI_API_BASE = 'https://api.vapi.ai'

/**
 * Proxy POST /call/web  →  https://api.vapi.ai/call/web
 * The Vapi Web SDK sends this request using the public key for auth.
 * We intercept it here and forward it with the server-side private key
 * so the real API key is never exposed to the browser.
 */
router.post('/call/web', async (req, res) => {
  const privateKey = process.env.VAPI_PRIVATE_KEY
  if (!privateKey) {
    return res.status(500).json({ message: 'VAPI_PRIVATE_KEY not configured on server' })
  }

  try {
    const response = await fetch(`${VAPI_API_BASE}/call/web`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Vapi API error:', response.status, data)
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (err) {
    console.error('Vapi proxy error:', err.message)
    res.status(502).json({ message: 'Failed to reach Vapi API', error: err.message })
  }
})

module.exports = router
