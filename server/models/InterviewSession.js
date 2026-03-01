const mongoose = require('mongoose')

const interviewSessionSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userUid:     { type: String, index: true },
    type:        { type: String, enum: ['technical', 'hr', 'system_design', 'mixed'], required: true },
    company:     { type: String, default: '' },
    difficulty:  { type: String, enum: ['junior', 'mid', 'senior'], default: 'junior' },
    duration:    { type: Number, default: 30 },
    messages: [{
      role:       { type: String, enum: ['interviewer', 'user'] },
      content:    { type: String },
      timestamp:  { type: Date, default: Date.now },
    }],
    report: {
      overallScore:       { type: Number },
      technicalAccuracy:  { type: Number },
      communication:      { type: Number },
      problemSolving:     { type: Number },
      confidence:         { type: Number },
      relevance:          { type: Number },
      strengths:          [String],
      improvements:       [String],
      resources:          [String],
      perQuestionScores:  [{ question: String, score: Number, idealAnswer: String }],
    },
    status:      { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    startedAt:   { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

interviewSessionSchema.index({ userId: 1, completedAt: -1 })

module.exports = mongoose.model('InterviewSession', interviewSessionSchema)
