import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, ChevronLeft, CheckCircle, GraduationCap, Target, Code, Clock, Sparkles, Rocket } from 'lucide-react'
import UserContext from '../context/UserContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { BRANCHES, TARGET_ROLES, STUDY_YEARS, CODING_LANGUAGES, TOP_COMPANIES } from '../lib/utils'
import { toast } from 'react-hot-toast'

const STEPS = [
  { id: 0, title: 'College Info', icon: GraduationCap, desc: 'Tell us where you study' },
  { id: 1, title: 'Target Companies', icon: Target, desc: 'Who do you want to work at?' },
  { id: 2, title: 'Tech Skills', icon: Code, desc: 'What tech do you know?' },
  { id: 3, title: 'Study Schedule', icon: Clock, desc: 'Plan your sprint' },
  { id: 4, title: 'Ready!', icon: Sparkles, desc: "Let's build your roadmap" },
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    college: '', branch: 'CSE', year: '3rd Year', targetCompanies: [], skills: [],
    targetRole: 'Software Engineer', hoursPerWeek: 14, studySlots: ['morning'],
    certifications: [],
  })
  const [saving, setSaving] = useState(false)
  const { completeOnboarding } = useContext(UserContext)
  const navigate = useNavigate()

  const toggle = (field, value) => {
    setData(d => ({
      ...d,
      [field]: d[field].includes(value) ? d[field].filter(x => x !== value) : [...d[field], value]
    }))
  }

  const addSkill = (lang) => {
    if (!data.skills.find(s => s.name === lang)) {
      setData(d => ({ ...d, skills: [...d.skills, { name: lang, level: 'Intermediate' }] }))
    }
  }

  const removeSkill = (lang) => setData(d => ({ ...d, skills: d.skills.filter(s => s.name !== lang) }))

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const handleFinish = async () => {
    if (!data.college) return toast.error('Please enter your college name')
    if (data.targetCompanies.length === 0) return toast.error('Select at least one target company')
    if (data.skills.length === 0) return toast.error('Select at least one skill')
    setSaving(true)
    try {
      await completeOnboarding(data)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple mb-4">
            <span className="text-xl font-bold text-white">K</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Set Up Your Profile</h1>
          <p className="text-[#64748B] text-sm mt-1">Takes 2 minutes — personalizes your entire experience</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-accent-blue text-white' : i === step ? 'bg-accent-blue/20 border border-accent-blue text-accent-blue' : 'bg-[#F1F5F9] text-[#64748B]'
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-accent-blue' : 'bg-[#D9E2EC]'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="enter"
              animate="center"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Step 0 — College */}
              {step === 0 && (
                <div>
                  <StepHeader step={STEPS[0]} />
                  <div className="space-y-4">
                    <Input
                      label="College / University Name"
                      placeholder="e.g. IIT Bombay, VIT Vellore"
                      value={data.college}
                      onChange={e => setData(d => ({ ...d, college: e.target.value }))}
                    />
                    <div>
                      <label className="text-sm font-medium text-[#475569] block mb-2">Branch</label>
                      <div className="flex flex-wrap gap-2">
                        {BRANCHES.map(b => (
                          <button
                            key={b}
                            onClick={() => setData(d => ({ ...d, branch: b }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${data.branch === b ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                          >{b}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#475569] block mb-2">Year</label>
                      <div className="flex flex-wrap gap-2">
                        {STUDY_YEARS.map(y => (
                          <button
                            key={y}
                            onClick={() => setData(d => ({ ...d, year: y }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${data.year === y ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                          >{y}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 — Target companies */}
              {step === 1 && (
                <div>
                  <StepHeader step={STEPS[1]} />
                  <div>
                    <label className="text-sm font-medium text-[#475569] block mb-2">Target Role</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {TARGET_ROLES.map(r => (
                        <button key={r} onClick={() => setData(d => ({ ...d, targetRole: r }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${data.targetRole === r ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                        >{r}</button>
                      ))}
                    </div>
                    <label className="text-sm font-medium text-[#475569] block mb-2">Target Companies <span className="text-[#64748B]">(select up to 5)</span></label>
                    <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                      {TOP_COMPANIES.map(c => (
                        <button key={c} onClick={() => toggle('targetCompanies', c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${data.targetCompanies.includes(c) ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Skills */}
              {step === 2 && (
                <div>
                  <StepHeader step={STEPS[2]} />
                  <label className="text-sm font-medium text-[#475569] block mb-2">Programming Languages & Frameworks</label>
                  <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
                    {CODING_LANGUAGES.map(l => {
                      const sel = data.skills.find(s => s.name === l)
                      return (
                        <button key={l} onClick={() => sel ? removeSkill(l) : addSkill(l)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sel ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                        >{sel && '✓ '}{l}</button>
                      )
                    })}
                  </div>
                  {data.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#64748B] mb-2">Set proficiency level:</p>
                      {data.skills.map(sk => (
                        <div key={sk.name} className="flex items-center gap-3">
                          <span className="text-sm text-[#0F172A] w-24 truncate">{sk.name}</span>
                          <div className="flex gap-1">
                            {SKILL_LEVELS.map(lvl => (
                              <button key={lvl}
                                onClick={() => setData(d => ({ ...d, skills: d.skills.map(s => s.name === sk.name ? { ...s, level: lvl } : s) }))}
                                className={`px-2 py-0.5 text-xs rounded border transition-all ${sk.level === lvl ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'border-[#D9E2EC] text-[#64748B]'}`}
                              >{lvl}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 — Schedule */}
              {step === 3 && (
                <div>
                  <StepHeader step={STEPS[3]} />
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#475569] block mb-2">Hours per week</label>
                      <div className="flex items-center gap-4">
                        <input type="range" min={7} max={56} step={7} value={data.hoursPerWeek}
                          onChange={e => setData(d => ({ ...d, hoursPerWeek: +e.target.value }))}
                          className="flex-1 accent-accent-blue"
                        />
                        <span className="text-accent-blue font-bold w-16 text-sm">{data.hoursPerWeek}h/wk</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#475569] block mb-2">Preferred study slots</label>
                      <div className="flex flex-wrap gap-2">
                        {['morning', 'afternoon', 'evening', 'night'].map(slot => (
                          <button key={slot} onClick={() => toggle('studySlots', slot)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize transition-all ${data.studySlots.includes(slot) ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'border-[#D9E2EC] text-[#64748B] hover:border-[#B8C8DB]'}`}
                          >{slot}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Ready */}
              {step === 4 && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl border border-[#D9E2EC] bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
                    <Rocket size={26} className="text-[#4F8EF7]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">You&apos;re all set</h2>
                  <p className="text-[#64748B] mb-6">KAI will generate a personalized 7-day sprint for you based on your profile.</p>
                  <div className="grid grid-cols-2 gap-4 text-left mb-6">
                    <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                      <p className="text-xs text-[#64748B]">College</p>
                      <p className="text-sm font-medium text-[#0F172A]">{data.college || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                      <p className="text-xs text-[#64748B]">Target Role</p>
                      <p className="text-sm font-medium text-[#0F172A]">{data.targetRole}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                      <p className="text-xs text-[#64748B]">Companies</p>
                      <p className="text-sm font-medium text-[#0F172A]">{data.targetCompanies.slice(0, 3).join(', ')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                      <p className="text-xs text-[#64748B]">Skills</p>
                      <p className="text-sm font-medium text-[#0F172A]">{data.skills.slice(0, 3).map(s => s.name).join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-[#D9E2EC] mt-6">
            <Button variant="ghost" onClick={back} disabled={step === 0} leftIcon={<ChevronLeft size={16} />}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} rightIcon={<ChevronRight size={16} />}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={saving} leftIcon={<Sparkles size={16} />}>
                Build My Roadmap
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepHeader({ step }) {
  const Icon = step.icon
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A]">{step.title}</h2>
        <p className="text-xs text-[#64748B]">{step.desc}</p>
      </div>
    </div>
  )
}
