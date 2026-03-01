const mongoose = require('mongoose')

const roadmapSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userUid: { type: String, index: true },
    profile: {
      year:            String,
      branch:          String,
      targetRole:      String,
      targetCompanies: [String],
      skills:          [{ name: String, level: Number }],
      hoursPerWeek:    Number,
    },
    days: [{
      day:         { type: Number, required: true },
      title:       { type: String },
      description: { type: String },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      tasks: [{
        id:          { type: String },
        type:        { type: String, enum: ['study', 'quiz', 'coding', 'resource', 'practice'] },
        title:       { type: String },
        description: { type: String },
        duration:    { type: Number }, // minutes
        difficulty:  { type: String },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        resourceUrl: { type: String },
      }],
      expectedOutcome: { type: String },
      progressPct:     { type: Number, default: 0 },
    }],
    isActive:       { type: Boolean, default: true },
    generatedAt:    { type: Date, default: Date.now },
    version:        { type: Number, default: 1 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Roadmap', roadmapSchema)
