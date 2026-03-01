const mongoose = require('mongoose')

const companySchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, unique: true },
    slug:       { type: String, unique: true },
    logo:       { type: String, default: '' },
    website:    { type: String },
    industry:   { type: String },
    description:{ type: String },
    roles:      [{ type: String }],
    topSkills:  [{ type: String }],
    interviewProcess: [{ round: String, format: String, duration: String, tips: String }],
    problemCategories: [{ category: String, problems: [String] }],
    resources:  [{ title: String, url: String, type: String }],
    avgPackage:  { type: String },
    difficulty:  { type: String, enum: ['medium', 'hard', 'very_hard'], default: 'hard' },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Company', companySchema)
