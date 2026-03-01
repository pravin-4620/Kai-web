const express  = require('express')
const router   = express.Router()
const Company  = require('../models/Company')
const User     = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')
const { TOP_COMPANIES_DATA } = require('../utils/companiesData')

// Seed companies if collection is empty
const ensureCompanies = async () => {
  const count = await Company.countDocuments()
  if (count === 0) {
    const companies = TOP_COMPANIES_DATA
    await Company.insertMany(companies)
  }
}

// Get all companies
router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureCompanies()
    const companies = await Company.find({ isActive: true })
      .select('name slug logo industry description roles topSkills avgPackage difficulty')
      .lean()
    res.json({ companies })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get single company
router.get('/:slug', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug, isActive: true }).lean()
    if (!company) return res.status(404).json({ message: 'Company not found' })
    res.json({ company })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get companies with match % for current user
router.get('/match', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('skills targetRole targetCompanies').lean()
    const companies = await Company.find({ isActive: true }).lean()

    const userSkills = (user.skills || []).map(s => s.name.toLowerCase())

    const companiesWithMatch = companies.map(c => {
      const companySkills = (c.topSkills || []).map(s => s.toLowerCase())
      const matchCount = companySkills.filter(s => userSkills.some(us => us.includes(s) || s.includes(us))).length
      const matchPct = companySkills.length > 0
        ? Math.round((matchCount / companySkills.length) * 100)
        : 50
      return { ...c, matchPct }
    })

    // Sort by match%, then by whether it's in target companies
    companiesWithMatch.sort((a, b) => {
      const aTarget = (user.targetCompanies || []).includes(a.name) ? 1 : 0
      const bTarget = (user.targetCompanies || []).includes(b.name) ? 1 : 0
      if (aTarget !== bTarget) return bTarget - aTarget
      return b.matchPct - a.matchPct
    })

    res.json({ companies: companiesWithMatch })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
