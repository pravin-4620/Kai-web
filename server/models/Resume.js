const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userUid: { type: String, index: true },
    data: {
      personalInfo: {
        name:     String,
        email:    String,
        phone:    String,
        location: String,
        linkedin: String,
        github:   String,
        website:  String,
      },
      summary:    { type: String },
      education:  [{ school: String, degree: String, field: String, startYear: String, endYear: String, gpa: String, achievements: String }],
      experience: [{ company: String, role: String, startDate: String, endDate: String, current: Boolean, bullets: [String] }],
      projects:   [{ name: String, description: String, tech: [String], url: String, bullets: [String] }],
      skills:     [{ category: String, items: [String] }],
      certifications: [{ name: String, issuer: String, year: String, url: String }],
      achievements:   [{ title: String, description: String, year: String }],
    },
    template:   { type: String, default: 'classic', enum: ['classic', 'modern', 'minimal'] },
    atsScore:   { type: Number, default: 0 },
    atsDetails: {
      keywordMatch:    Number,
      formattingScore: Number,
      contentQuality:  Number,
      lengthScore:     Number,
      suggestions:     [String],
      missingKeywords: [String],
    },
    version:    { type: Number, default: 1 },
    isActive:   { type: Boolean, default: true },
    lastSaved:  { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Resume', resumeSchema)
