const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    uid:          { type: String, required: true, unique: true, index: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    name:         { type: String, default: '' },
    photoURL:     { type: String, default: '' },
    provider:     { type: String, default: 'email' },

    // Onboarding
    college:      { type: String, default: '' },
    year:         { type: String, default: '' },
    branch:       { type: String, default: '' },
    targetRole:   { type: String, default: '' },
    targetCompanies: [{ type: String }],
    skills:       [{ name: String, level: { type: Number, min: 1, max: 5 } }],
    certifications: [{ type: String }],
    hoursPerWeek: { type: Number, default: 10 },
    studySlots:   [{ start: String, end: String, days: [String] }],
    focusModeEnabled:   { type: Boolean, default: true },
    preferredLanguage:  { type: String, default: 'Python' },
    notifPreferences:   {
      dailyReminder: { type: Boolean, default: true },
      deadlineAlerts: { type: Boolean, default: true },
    },

    // Progress
    onboardingComplete: { type: Boolean, default: false, index: true },
    sprintStartDate:    { type: Date },
    sprintDay:          { type: Number, default: 1, min: 1, max: 7 },
    streak:             { type: Number, default: 0 },
    lastActiveDate:     { type: Date },

    // Scores (0-100 each)
    scores: {
      coding:     { type: Number, default: 0 },
      quiz:       { type: Number, default: 0 },
      interview:  { type: Number, default: 0 },
      softSkills: { type: Number, default: 0 },
      resume:     { type: Number, default: 0 },
    },
    overallScore:   { type: Number, default: 0, index: true },
    currentGrade:   { type: String, default: 'D' },

    // Gamification
    badges: [{ type: String }],
    rank:   { type: Number },

    // Soft skills progress
    softSkillsProgress: {
      communication: { type: Number, default: 0 },
      emailEtiquette: { type: Number, default: 0 },
      starMethod: { type: Number, default: 0 },
      bodyLanguage: { type: Number, default: 0 },
      negotiation: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      presentation: { type: Number, default: 0 },
    },

    // Daily activity tracking
    dailyActivity: [{
      date:        { type: Date },
      hoursStudied: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
    }],
  },
  { timestamps: true }
)

// Indexes
userSchema.index({ college: 1, overallScore: -1 })
userSchema.index({ college: 1, branch: 1, overallScore: -1 })
userSchema.index({ createdAt: -1 })

module.exports = mongoose.model('User', userSchema)
