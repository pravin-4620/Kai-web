const mongoose = require('mongoose')

const focusSessionSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userUid:    { type: String, index: true },
    type:       { type: String, enum: ['test', 'quiz', 'study', 'pomodoro'], default: 'study' },
    startedAt:  { type: Date, default: Date.now },
    endedAt:    { type: Date },
    duration:   { type: Number }, // minutes
    violations: [{
      type:      { type: String },
      timestamp: { type: Date },
    }],
    violationCount: { type: Number, default: 0 },
    focusScore:     { type: Number, default: 100 }, // 100 - penalty per violation
    isFlagged:      { type: Boolean, default: false },
    relatedTestId:  { type: String },
  },
  { timestamps: true }
)

focusSessionSchema.index({ userId: 1, startedAt: -1 })

module.exports = mongoose.model('FocusSession', focusSessionSchema)
