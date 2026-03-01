const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema(
  {
    topic:     { type: String, required: true, index: true },
    subtopic:  { type: String, index: true },
    difficulty:{ type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    type:      { type: String, enum: ['mcq_single', 'mcq_multi', 'true_false', 'fill_blank', 'code_output'], required: true },
    question:  { type: String, required: true },
    options:   [{ type: String }],
    correct:   { type: mongoose.Schema.Types.Mixed, required: true },
    explanation:{ type: String },
    tags:      [{ type: String }],
    points:    { type: Number, default: 10 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
)

questionSchema.index({ topic: 1, difficulty: 1, isActive: 1 })

module.exports = mongoose.model('Question', questionSchema)
