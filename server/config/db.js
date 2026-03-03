const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let isConnected = false
let isConnecting = false
let memoryServer = null
let reconnectTimer = null

mongoose.set('bufferCommands', false)

const connectDB = async () => {
  if (isConnected || isConnecting) return

  isConnecting = true

  const connectWithUri = async (uri, label) => {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    console.log(`✅ MongoDB connected (${label}): ${conn.connection.host}`)

    // Create indexes
    mongoose.connection.once('open', async () => {
      try {
        const { User, TestAttempt, QuizAttempt } = require('../models')
        await User.createIndexes()
        await TestAttempt.createIndexes()
        await QuizAttempt.createIndexes()
      } catch { /* indexes may already exist */ }
    })
    return conn
  }

  const atlasUri = process.env.MONGODB_URI
  const localUri = process.env.MONGODB_FALLBACK_URI || 'mongodb://127.0.0.1:27017/kai'

  if (atlasUri) {
    try {
      await connectWithUri(atlasUri, 'atlas')
      if (reconnectTimer) {
        clearInterval(reconnectTimer)
        reconnectTimer = null
      }
      isConnecting = false
      return
    } catch (err) {
      console.error('❌ Atlas connection error:', err.message)
    }
  }

  try {
    await connectWithUri(localUri, 'local')
    console.warn('⚠️  Using local Mongo fallback. Set MONGODB_URI for Atlas in production.')
    if (reconnectTimer) {
      clearInterval(reconnectTimer)
      reconnectTimer = null
    }
    isConnecting = false
    return
  } catch (err) {
    console.warn('⚠️  Local Mongo fallback unavailable:', err.message)
  }

  try {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'kai' },
      })
    }
    const memoryUri = memoryServer.getUri()
    await connectWithUri(memoryUri, 'in-memory')
    console.warn('⚠️  Running with in-memory database fallback. Data will reset when server restarts.')
    if (reconnectTimer) {
      clearInterval(reconnectTimer)
      reconnectTimer = null
    }
  } catch (err) {
    console.error('❌ Failed to start fallback database:', err.message)
    console.warn('⚠️  API will run in limited mode until DB reconnects.')
  } finally {
    isConnecting = false
  }
}

const startReconnectLoop = () => {
  if (reconnectTimer) return

  reconnectTimer = setInterval(async () => {
    if (!isConnected && !isConnecting) {
      await connectDB()
    }

    if (isConnected && reconnectTimer) {
      clearInterval(reconnectTimer)
      reconnectTimer = null
    }
  }, 10000)
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected')
  isConnected = false
  startReconnectLoop()
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err)
  if (!isConnected) {
    startReconnectLoop()
  }
})

process.on('SIGINT', async () => {
  if (memoryServer) {
    await memoryServer.stop()
  }
})

const getDbStatus = () => ({
  connected: isConnected,
  state: mongoose.connection.readyState,
  mode: memoryServer ? 'in-memory' : 'external',
})

module.exports = { connectDB, getDbStatus }
