// Top 20 companies seed data
const TOP_COMPANIES_DATA = [
  {
    name: 'Google', slug: 'google', logo: '🔵', industry: 'Technology',
    description: 'Search, Cloud, Android, AI',
    roles: ['SDE', 'SRE', 'ML Engineer', 'PM'],
    topSkills: ['Algorithms', 'Data Structures', 'System Design', 'Python', 'Java', 'Distributed Systems'],
    interviewProcess: [
      { round: 'Phone Screen', format: 'Technical + Behavioural', duration: '45 min', tips: 'Focus on DSA' },
      { round: 'Onsite (x4-5)', format: 'Coding + System Design + Behavioural', duration: '45 min each', tips: 'Practice Googleyness' },
    ],
    avgPackage: '$150K-$300K', difficulty: 'very_hard',
  },
  {
    name: 'Microsoft', slug: 'microsoft', logo: '🟦', industry: 'Technology',
    description: 'Cloud, Office, Windows, Gaming',
    roles: ['SDE', 'PM', 'Data Engineer', 'DevOps'],
    topSkills: ['OOP', 'System Design', 'Azure', '.NET', 'Python', 'Databases'],
    interviewProcess: [
      { round: 'Technical Screen', format: 'Coding', duration: '60 min', tips: 'Medium Leetcode' },
      { round: 'Final Rounds (x4)', format: 'Coding + Design + Behavioural', duration: '45 min each', tips: 'Growth mindset' },
    ],
    avgPackage: '$130K-$250K', difficulty: 'hard',
  },
  {
    name: 'Amazon', slug: 'amazon', logo: '🟠', industry: 'E-Commerce / Cloud',
    description: 'AWS, Retail, Alexa, Logistics',
    roles: ['SDE', 'Solutions Architect', 'Data Scientist', 'PM'],
    topSkills: ['System Design', 'Scalability', 'AWS', 'Java', 'Python', 'Leadership Principles'],
    interviewProcess: [
      { round: 'OA', format: 'Coding + Work Simulation', duration: '90 min', tips: 'Practice LP stories' },
      { round: 'Loops (x4-5)', format: 'Coding + Behavioural + System Design', duration: '45 min each', tips: 'STAR method for LPs' },
    ],
    avgPackage: '$120K-$250K', difficulty: 'hard',
  },
  {
    name: 'Meta', slug: 'meta', logo: '🔵', industry: 'Social Media / VR',
    description: 'Facebook, Instagram, WhatsApp, VR',
    roles: ['SDE', 'ML Engineer', 'Research Engineer', 'PM'],
    topSkills: ['Algorithms', 'System Design', 'React', 'Python', 'ML', 'Distributed Systems'],
    interviewProcess: [
      { round: 'Technical Screen', format: 'Coding', duration: '45 min', tips: 'Hard Leetcode' },
      { round: 'Onsite (x5)', format: 'Coding + System Design + Behavioural', duration: '45 min each', tips: 'Culture add' },
    ],
    avgPackage: '$150K-$300K', difficulty: 'very_hard',
  },
  {
    name: 'Apple', slug: 'apple', logo: '🍎', industry: 'Technology / Consumer',
    description: 'iOS, macOS, Hardware, Services',
    roles: ['iOS Engineer', 'SDE', 'ML Engineer', 'PM'],
    topSkills: ['Swift', 'Objective-C', 'System Design', 'Algorithms', 'Hardware Optimization'],
    interviewProcess: [
      { round: 'Technical Screen', format: 'Coding', duration: '60 min', tips: 'Product sense' },
      { round: 'Onsite', format: 'Multiple technical + managerial', duration: '6-8 hours', tips: 'Attention to detail' },
    ],
    avgPackage: '$140K-$280K', difficulty: 'very_hard',
  },
  {
    name: 'Infosys', slug: 'infosys', logo: '🔷', industry: 'IT Services',
    description: 'IT Consulting & Services',
    roles: ['Systems Engineer', 'Senior Developer', 'Technology Analyst'],
    topSkills: ['Java', 'SQL', 'Python', 'Communication', 'Problem Solving'],
    interviewProcess: [
      { round: 'HackerEarth OA', format: 'Aptitude + Coding', duration: '3 hours', tips: 'Speed accuracy' },
      { round: 'Technical Interview', format: 'CS fundamentals', duration: '45 min', tips: 'DSA basics' },
      { round: 'HR Interview', format: 'Communication', duration: '30 min', tips: 'Be confident' },
    ],
    avgPackage: '₹3.5-6 LPA', difficulty: 'medium',
  },
  {
    name: 'TCS', slug: 'tcs', logo: '🔵', industry: 'IT Services',
    description: "India's largest IT company",
    roles: ['Systems Engineer', 'Digital', 'Ninja'],
    topSkills: ['Programming Basics', 'Aptitude', 'Communication', 'SQL', 'Data Structures'],
    interviewProcess: [
      { round: 'NQT / TCS Exam', format: 'Aptitude + Verbal + Programming', duration: '3 hours', tips: 'Practice TCS NQT' },
      { round: 'Technical Interview', format: 'CS concepts', duration: '45 min', tips: 'OOPS, DBMS basics' },
      { round: 'HR Interview', format: 'Culture fit', duration: '30 min', tips: 'Prepare STAR answers' },
    ],
    avgPackage: '₹3.3-7 LPA', difficulty: 'medium',
  },
  {
    name: 'Goldman Sachs', slug: 'goldman-sachs', logo: '🏦', industry: 'Finance / Technology',
    description: 'Investment Banking Technology',
    roles: ['Software Engineer', 'Quant Developer', 'Data Engineer'],
    topSkills: ['Algorithms', 'C++', 'Python', 'System Design', 'Finance Basics', 'OOP'],
    interviewProcess: [
      { round: 'HackerRank OA', format: 'Hard Algorithms', duration: '2 hours', tips: 'Competitive programming' },
      { round: 'Technical Rounds (x3)', format: 'Coding + Design + CS Fundamentals', duration: '45 min each', tips: 'No hints given' },
    ],
    avgPackage: '$120K-$200K', difficulty: 'very_hard',
  },
  {
    name: 'Adobe', slug: 'adobe', logo: '🔴', industry: 'Software',
    description: 'Creative Cloud, Document Cloud, Experience Cloud',
    roles: ['SDE', 'Frontend Engineer', 'ML Engineer', 'PM'],
    topSkills: ['Data Structures', 'Algorithms', 'OOP', 'System Design', 'JavaScript', 'React'],
    interviewProcess: [
      { round: 'Online Assessment', format: 'Coding', duration: '90 min', tips: 'Medium-Hard Leetcode' },
      { round: 'Interviews (x4)', format: 'Coding + System Design + HR', duration: '45 min each', tips: 'Communication counts' },
    ],
    avgPackage: '₹25-50 LPA', difficulty: 'hard',
  },
  {
    name: 'Flipkart', slug: 'flipkart', logo: '🛒', industry: 'E-Commerce',
    description: "India's leading e-commerce platform",
    roles: ['SDE', 'Data Scientist', 'ML Engineer', 'PM'],
    topSkills: ['Data Structures', 'Algorithms', 'System Design', 'Java', 'Python', 'Distributed Systems'],
    interviewProcess: [
      { round: 'Machine Coding', format: 'Design + Code 2hrs', duration: '2 hours', tips: 'Clean code' },
      { round: 'Interviews (x4)', format: 'DSA + LLD + HLD + HR', duration: '45 min each', tips: 'OOP design patterns' },
    ],
    avgPackage: '₹20-45 LPA', difficulty: 'hard',
  },
  // Remaining companies with minimal data
  ...['Netflix', 'JPMorgan', 'McKinsey', 'Deloitte', 'Wipro', 'Accenture', 'Salesforce', 'Uber', 'Airbnb', 'Stripe'].map(name => ({
    name, slug: name.toLowerCase().replace(/[^a-z]/g, '-'),
    logo: '🏢', industry: 'Technology',
    description: `${name} — global technology company`,
    roles: ['Software Engineer', 'Data Scientist', 'PM'],
    topSkills: ['Algorithms', 'System Design', 'Communication', 'Problem Solving'],
    interviewProcess: [{ round: 'Technical Screen', format: 'Coding + Behavioral', duration: '60 min', tips: 'Practice STAR method' }],
    avgPackage: '$100K-$200K', difficulty: 'hard',
  })),
]

module.exports = { TOP_COMPANIES_DATA }
