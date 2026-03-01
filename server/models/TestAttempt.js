const mongoose = require('mongoose')

const testAttemptSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userUid:      { type: String, index: true },
    problemId:    { type: String, required: true },
    problemTitle: { type: String },
    difficulty:   { type: String, enum: ['easy', 'medium', 'hard'] },
    language:     { type: String },
    code:         { type: String },
    testCaseResults: [{
      passed:   { type: Boolean },
      input:    { type: String },
      expected: { type: String },
      output:   { type: String },
      runtime:  { type: Number },
      memory:   { type: Number },
    }],
    passRate:       { type: Number, default: 0 },
    executionTime:  { type: Number, default: 0 },
    memoryUsed:     { type: Number, default: 0 },
    aiEvaluation: {
      correctnessScore: { type: Number },
      codeQualityScore: { type: Number },
      timeComplexity:   { type: String },
      spaceComplexity:  { type: String },
      suggestions:      [{ type: String }],
      optimalSolution:  { type: String },
      overallGrade:     { type: String },
    },
    violations: [{
      type:      { type: String },
      timestamp: { type: Date },
    }],
    isFlagged:   { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now, index: true },
    timeTaken:   { type: Number }, // seconds
  },
  { timestamps: true }
)

testAttemptSchema.index({ userId: 1, submittedAt: -1 })
testAttemptSchema.index({ userUid: 1, submittedAt: -1 })

module.exports = mongoose.model('TestAttempt', testAttemptSchema)
