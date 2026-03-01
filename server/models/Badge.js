const mongoose = require('mongoose')

const badgeSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  emoji:       { type: String },
  name:        { type: String },
  description: { type: String },
  criteria:    { type: String },
})

module.exports = mongoose.model('Badge', badgeSchema)
