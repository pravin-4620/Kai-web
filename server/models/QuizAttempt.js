const mongoose = require('mongoose')

const quizAttemptSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userUid: { type: String, index: true },
    topic:   { type: String, required: true },
    slotId:  { type: String },
    subtopic:{ type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    questions: [{
      questionId: { type: String },
      question:   { type: String },
      userAnswer: { type: String },
      correct:    { type: String },
      isCorrect:  { type: Boolean },
      explanation:{ type: String },
      timeTaken:  { type: Number },
    }],
    score:          { type: Number, default: 0 },   // 0-100
    correctCount:   { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    skippedCount:   { type: Number, default: 0 },
    totalQuestions: { type: Number },
    timeTaken:      { type: Number },
    aiInsight:      { type: String },
    violations:     { type: Number, default: 0 },
    completedAt:    { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
)

quizAttemptSchema.index({ userId: 1, topic: 1, completedAt: -1 })
quizAttemptSchema.index({ userUid: 1, completedAt: -1 })

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema)
