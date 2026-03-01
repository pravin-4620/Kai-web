import { useState, useEffect, useRef, useContext } from 'react'
import { motion } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, Sparkles, Download, FileText, GripVertical, Zap, Check, User, GraduationCap, Briefcase, FolderKanban, Wrench, Lightbulb, KeyRound } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'
import Progress from '../components/ui/Progress'
import { resumeApi } from '../lib/api'
import UserContext from '../context/UserContext'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'

const DEFAULT_RESUME = {
  personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  education: [{ institution: '', degree: '', field: '', grade: '', year: '' }],
  experience: [],
  projects: [{ name: '', description: '', tech: '', link: '', highlights: [''] }],
  skills: { technical: [], soft: [] },
  certifications: [],
  achievements: [],
}

export default function ResumeBuilderPage() {
  const [resume, setResume] = useState(DEFAULT_RESUME)
  const [atsScore, setAtsScore] = useState(null)
  const [atsDetails, setAtsDetails] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [jd, setJd] = useState('')
  const [showJdInput, setShowJdInput] = useState(false)
  const [improving, setImproving] = useState({})
  const [activeTab, setActiveTab] = useState('editor') // editor | preview | ats
  const previewRef = useRef(null)
  const { profile } = useContext(UserContext)

  useEffect(() => {
    resumeApi.getMine().then(r => {
      if (r.data.resume) {
        const merged = { ...DEFAULT_RESUME, ...r.data.resume, personalInfo: { ...DEFAULT_RESUME.personalInfo, ...(r.data.resume.personalInfo || {}) }, skills: { ...DEFAULT_RESUME.skills, ...(r.data.resume.skills || {}) } }
        setResume(merged)
        setAtsScore(r.data.resume.atsScore)
        setAtsDetails(r.data.resume.atsDetails)
      } else if (profile) {
        setResume(r => ({ ...r, personalInfo: { ...r.personalInfo, name: profile.name || '', email: profile.email || '' } }))
      }
    }).catch(() => {})
  }, [profile])

  const update = (path, value) => {
    setResume(r => {
      const copy = JSON.parse(JSON.stringify(r))
      const keys = path.split('.')
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return copy
    })
  }

  const saveResume = async () => {
    setSaving(true)
    try {
      await resumeApi.save({ resumeData: resume })
      toast.success('Resume saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const scoreResume = async () => {
    setScoring(true)
    try {
      const { data } = await resumeApi.getScore(resume)
      setAtsScore(data.atsScore)
      setAtsDetails(data.atsDetails)
      toast.success(`ATS Score: ${data.atsScore}%`)
      setActiveTab('ats')
    } catch {
      toast.error('Failed to score resume')
    } finally {
      setScoring(false)
    }
  }

  const downloadPDF = async () => {
    if (!previewRef.current) return setActiveTab('preview')
    toast.loading('Generating PDF...')
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#ffffff' })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height / canvas.width) * w
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h)
    pdf.save(`${resume.personalInfo.name || 'resume'}.pdf`)
    toast.dismiss()
    toast.success('PDF downloaded!')
  }

  const improveBullet = async (idx, bullet, field) => {
    const key = `${field}-${idx}`
    setImproving(i => ({ ...i, [key]: true }))
    try {
      const { data } = await resumeApi.improvePoint(bullet, field)
      if (data.alternatives?.[0]) {
        const parts = field.split('.')
        update(field, data.alternatives[0])
        toast.success('Bullet improved!')
      }
    } catch {
      toast.error('Failed to improve')
    } finally {
      setImproving(i => ({ ...i, [key]: false }))
    }
  }

  const atsColor = atsScore >= 80 ? 'green' : atsScore >= 60 ? 'yellow' : 'red'

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Resume Builder" />
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border-b border-[#D9E2EC]">
          {['editor', 'preview', 'ats'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >{tab === 'ats' ? 'ATS Score' : tab}</button>
          ))}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={saveResume} loading={saving} leftIcon={<Check size={14} />}>Save</Button>
          <Button variant="secondary" size="sm" onClick={scoreResume} loading={scoring} leftIcon={<Sparkles size={14} />}>Score</Button>
          <Button size="sm" onClick={downloadPDF} leftIcon={<Download size={14} />}>PDF</Button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'editor' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Personal Info */}
              <Section title="Personal Information" icon={User}>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries({ name: 'Full Name', email: 'Email', phone: 'Phone', location: 'Location', linkedin: 'LinkedIn URL', github: 'GitHub URL' }).map(([k, label]) => (
                    <Input key={k} label={label} value={resume.personalInfo[k] || ''} onChange={e => update(`personalInfo.${k}`, e.target.value)} />
                  ))}
                </div>
              </Section>

              {/* Summary */}
              <Section title="Professional Summary" icon={FileText}>
                <Textarea label="Summary" rows={4} value={resume.summary || ''} onChange={e => update('summary', e.target.value)} placeholder="Write a compelling 2-3 sentence summary..." />
                <Button variant="ghost" size="sm" className="mt-2" onClick={async () => {
                  try {
                    const { data } = await resumeApi.generateSummary(resume)
                    update('summary', data.summary)
                  } catch { toast.error('Failed to generate') }
                }} leftIcon={<Sparkles size={12} />}>AI Generate</Button>
              </Section>

              {/* Education */}
              <Section title="Education" icon={GraduationCap}>
                {resume.education?.map((edu, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                    {Object.entries({ institution: 'Institution', degree: 'Degree', field: 'Field of Study', grade: 'CGPA/Grade', year: 'Year' }).map(([k, label]) => (
                      <Input key={k} label={label} value={edu[k] || ''} onChange={e => update(`education.${i}.${k}`, e.target.value)} />
                    ))}
                    <button onClick={() => setResume(r => ({ ...r, education: r.education.filter((_, j) => j !== i) }))}
                      className="self-end mb-1 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    ><Trash2 size={12} />Remove</button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setResume(r => ({ ...r, education: [...r.education, { institution: '', degree: '', field: '', grade: '', year: '' }] }))} leftIcon={<Plus size={12} />}>Add Education</Button>
              </Section>

              {/* Experience */}
              <Section title="Work Experience" icon={Briefcase}>
                {resume.experience?.map((exp, i) => (
                  <div key={i} className="mb-4 p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {Object.entries({ company: 'Company', title: 'Title', location: 'Location', startDate: 'Start', endDate: 'End' }).map(([k, label]) => (
                        <Input key={k} label={label} value={exp[k] || ''} onChange={e => update(`experience.${i}.${k}`, e.target.value)} />
                      ))}
                    </div>
                    <Textarea label="Description" rows={3} value={exp.description || ''} onChange={e => update(`experience.${i}.description`, e.target.value)} />
                    <button onClick={() => setResume(r => ({ ...r, experience: r.experience.filter((_, j) => j !== i) }))}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    ><Trash2 size={12} />Remove</button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setResume(r => ({ ...r, experience: [...(r.experience || []), { company: '', title: '', location: '', startDate: '', endDate: '', description: '' }] }))} leftIcon={<Plus size={12} />}>Add Experience</Button>
              </Section>

              {/* Projects */}
              <Section title="Projects" icon={FolderKanban}>
                {resume.projects?.map((proj, i) => (
                  <div key={i} className="mb-4 p-3 rounded-lg bg-[#F1F5F9] border border-[#D9E2EC]">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Input label="Project Name" value={proj.name || ''} onChange={e => update(`projects.${i}.name`, e.target.value)} />
                      <Input label="Tech Stack" value={proj.tech || ''} onChange={e => update(`projects.${i}.tech`, e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Textarea wrapperClassName="flex-1" label="Description" rows={3} value={proj.description || ''} onChange={e => update(`projects.${i}.description`, e.target.value)} />
                      <Button variant="ghost" size="icon" title="AI Improve" loading={improving[`projects.${i}.description`]}
                        onClick={() => improveBullet(i, proj.description, `projects.${i}.description`)} className="self-end mb-1">
                        <Sparkles size={12} />
                      </Button>
                    </div>
                    <button onClick={() => setResume(r => ({ ...r, projects: r.projects.filter((_, j) => j !== i) }))}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    ><Trash2 size={12} />Remove</button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setResume(r => ({ ...r, projects: [...r.projects, { name: '', description: '', tech: '', link: '' }] }))} leftIcon={<Plus size={12} />}>Add Project</Button>
              </Section>

              {/* Skills */}
              <Section title="Skills" icon={Wrench}>
                <Input label="Technical Skills (comma-separated)" value={resume.skills?.technical?.join(', ') || ''} onChange={e => update('skills.technical', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="React, Node.js, Python, SQL..." />
                <Input wrapperClassName="mt-3" label="Soft Skills" value={resume.skills?.soft?.join(', ') || ''} onChange={e => update('skills.soft', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Leadership, Communication, Teamwork..." />
              </Section>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="max-w-3xl mx-auto">
              <div ref={previewRef} className="bg-white text-gray-900 p-10 rounded-lg shadow-xl text-sm leading-relaxed">
                <div className="text-center mb-6 border-b border-gray-200 pb-4">
                  <h1 className="text-2xl font-bold">{resume.personalInfo.name || 'Your Name'}</h1>
                  <p className="text-gray-600 text-xs mt-1 flex flex-wrap justify-center gap-3">
                    {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
                    {resume.personalInfo.phone && <span>|  {resume.personalInfo.phone}</span>}
                    {resume.personalInfo.linkedin && <span>| LinkedIn</span>}
                    {resume.personalInfo.github && <span>| GitHub</span>}
                  </p>
                </div>
                {resume.summary && <div className="mb-4"><h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-200">Summary</h2><p className="text-xs text-gray-700">{resume.summary}</p></div>}
                {resume.education?.length > 0 && <div className="mb-4"><h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200">Education</h2>{resume.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><span className="font-semibold text-xs">{e.institution}</span><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.degree} in {e.field} {e.grade && `· ${e.grade}`}</p></div>)}</div>}
                {resume.experience?.length > 0 && <div className="mb-4"><h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200">Experience</h2>{resume.experience.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><span className="font-semibold text-xs">{e.title} @ {e.company}</span><span className="text-xs text-gray-500">{e.startDate} – {e.endDate}</span></div><p className="text-xs text-gray-600 mt-0.5">{e.description}</p></div>)}</div>}
                {resume.projects?.length > 0 && <div className="mb-4"><h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200">Projects</h2>{resume.projects.map((p, i) => <div key={i} className="mb-2"><span className="font-semibold text-xs">{p.name}</span>{p.tech && <span className="text-xs text-gray-500"> · {p.tech}</span>}<p className="text-xs text-gray-600 mt-0.5">{p.description}</p></div>)}</div>}
                {resume.skills?.technical?.length > 0 && <div><h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-200">Skills</h2><p className="text-xs text-gray-700">{resume.skills.technical.join(' · ')}</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'ats' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {!atsScore && !scoring ? (
                <div className="text-center py-12">
                  <Sparkles size={40} className="text-accent-blue mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-bold text-[#0F172A] mb-2">ATS Score Analyzer</h2>
                  <p className="text-[#64748B] mb-6">Click "Score" to analyze your resume against ATS systems and get AI-powered recommendations.</p>
                  <Button onClick={scoreResume} loading={scoring} leftIcon={<Sparkles size={16} />} size="lg">Analyze Resume</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="text-center py-6">
                    <p className="text-6xl font-bold" style={{ color: atsScore >= 80 ? '#22c55e' : atsScore >= 60 ? '#eab308' : '#ef4444' }}>{atsScore}%</p>
                    <p className="text-[#64748B] mt-2">ATS Score</p>
                    <Progress value={atsScore} max={100} color={atsColor} className="mt-4 max-w-xs mx-auto" />
                  </Card>
                  {atsDetails?.feedback?.length > 0 && (
                    <Card>
                      <p className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2"><Lightbulb size={14} className="text-accent-blue" />Recommendations</p>
                      <ul className="space-y-2">{atsDetails.feedback.map((f, i) => <li key={i} className="text-sm text-[#475569] flex gap-2"><span className="text-accent-blue mt-0.5">→</span>{f}</li>)}</ul>
                    </Card>
                  )}
                  {atsDetails?.missingKeywords?.length > 0 && (
                    <Card>
                      <p className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2"><KeyRound size={14} className="text-red-400" />Missing Keywords</p>
                      <div className="flex flex-wrap gap-2">{atsDetails.missingKeywords.map(k => <span key={k} className="px-2 py-1 text-xs rounded bg-red-500/10 border border-red-500/20 text-red-400">{k}</span>)}</div>
                    </Card>
                  )}
                  <Button className="w-full" onClick={scoreResume} loading={scoring} leftIcon={<Sparkles size={14} />}>Re-analyze</Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-md bg-[#F1F5F9] border border-[#D9E2EC] flex items-center justify-center">
          {Icon ? <Icon size={14} className="text-[#4F8EF7]" /> : null}
        </div>
        <h3 className="font-semibold text-[#0F172A]">{title}</h3>
      </div>
      {children}
    </Card>
  )
}
