// Barrel export for all Mongoose models
const User = require('./User')
const TestAttempt = require('./TestAttempt')
const QuizAttempt = require('./QuizAttempt')
const Roadmap = require('./Roadmap')
const Resume = require('./Resume')
const InterviewSession = require('./InterviewSession')
const Company = require('./Company')
const Badge = require('./Badge')
const FocusSession = require('./FocusSession')
const Question = require('./Question')

module.exports = { User, TestAttempt, QuizAttempt, Roadmap, Resume, InterviewSession, Company, Badge, FocusSession, Question }
