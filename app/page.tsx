'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  FiActivity, FiUpload, FiFileText, FiAlertTriangle, FiDownload,
  FiSearch, FiPlus, FiCheck, FiX, FiClock, FiUser, FiHeart,
  FiCalendar, FiChevronRight, FiMenu, FiHome, FiDroplet,
  FiTrendingUp, FiShield, FiStar, FiMapPin, FiPhone, FiInfo,
  FiArrowRight, FiChevronDown, FiChevronUp, FiRefreshCw,
  FiLoader, FiTrash2, FiEye, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi'
import {
  RiHospitalLine, RiStethoscopeLine, RiMedicineBottleLine,
  RiHeartPulseLine, RiRunLine, RiRestaurantLine,
  RiLeafLine, RiMentalHealthLine
} from 'react-icons/ri'
import { BiDna } from 'react-icons/bi'
import { MdOutlineLocalDining, MdFitnessCenter } from 'react-icons/md'

// ----- CONSTANTS -----
const DIAGNOSIS_AGENT_ID = '69996662e3502b03b1c6e039'
const HOSPITAL_ALERT_AGENT_ID = '699966628cfc4d116987bcde'

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'HI', label: 'Hindi' },
  { code: 'ES', label: 'Spanish' },
  { code: 'FR', label: 'French' },
  { code: 'AR', label: 'Arabic' },
  { code: 'ZH', label: 'Chinese' },
  { code: 'PT', label: 'Portuguese' },
  { code: 'DE', label: 'German' },
  { code: 'JA', label: 'Japanese' },
  { code: 'KO', label: 'Korean' },
]

const LOADING_STEPS = [
  'Uploading files...',
  'Analyzing medical report...',
  'Generating dietary plan...',
  'Creating fitness recommendations...',
  'Compiling results...',
]

// ----- INTERFACES -----
interface MealPlanItem {
  meal?: string
  description?: string
  time?: string
}

interface ExerciseRoutine {
  name?: string
  description?: string
  difficulty?: string
  frequency?: string
  duration?: string
}

interface FollowUpItem {
  date?: string
  action?: string
  type?: string
}

interface DiagnosisResult {
  diagnosis_summary?: string
  disease_prediction?: string
  confidence_level?: number
  severity?: string
  is_critical?: boolean
  diagnosis_explanation?: string
  key_findings?: string[]
  recommended_tests?: string[]
  foods_to_eat?: string[]
  foods_to_avoid?: string[]
  meal_plan?: MealPlanItem[]
  nutritional_notes?: string
  hydration_advice?: string
  exercise_routines?: ExerciseRoutine[]
  lifestyle_tips?: string[]
  activity_level?: string
  follow_up_timeline?: FollowUpItem[]
  precautions?: string[]
}

interface HospitalInfo {
  name?: string
  distance?: string
  specialty?: string
  contact?: string
}

interface AlertResult {
  alert_status?: string
  urgency_level?: string
  patient_summary?: string
  condition_detected?: string
  recommended_actions?: string[]
  hospitals_to_notify?: HospitalInfo[]
  alert_message?: string
}

interface StoredDiagnosis {
  id: string
  date: string
  data: DiagnosisResult
  language: string
  reportUrl?: string
}

interface StoredAlert {
  id: string
  date: string
  data: AlertResult
  diagnosisId?: string
}

// ----- SAMPLE DATA -----
const SAMPLE_DIAGNOSIS: DiagnosisResult = {
  diagnosis_summary: 'Based on the analysis of your blood report, there are indications of elevated blood sugar levels consistent with pre-diabetic conditions. The HbA1c level of 6.2% is above the normal range.',
  disease_prediction: 'Pre-Diabetes (Impaired Glucose Tolerance)',
  confidence_level: 87,
  severity: 'Moderate',
  is_critical: false,
  diagnosis_explanation: 'Your blood work indicates elevated fasting glucose levels (118 mg/dL) and HbA1c of 6.2%. While not yet in the diabetic range, these values suggest your body is struggling to manage blood sugar effectively. Early intervention through diet and lifestyle changes can significantly reduce progression risk.',
  key_findings: [
    'Fasting blood glucose: 118 mg/dL (normal: <100 mg/dL)',
    'HbA1c: 6.2% (normal: <5.7%)',
    'Total cholesterol: 215 mg/dL (borderline high)',
    'LDL cholesterol: 142 mg/dL (slightly elevated)',
    'Vitamin D: 18 ng/mL (deficient)',
  ],
  recommended_tests: [
    'Oral Glucose Tolerance Test (OGTT)',
    'Fasting insulin level',
    'C-peptide test',
    'Comprehensive metabolic panel',
    'Lipid panel follow-up in 3 months',
  ],
  foods_to_eat: [
    'Leafy greens (spinach, kale, Swiss chard)',
    'Whole grains (quinoa, brown rice, oats)',
    'Lean proteins (chicken breast, fish, tofu)',
    'Berries (blueberries, strawberries)',
    'Nuts and seeds (almonds, walnuts, chia seeds)',
    'Legumes (lentils, chickpeas, black beans)',
  ],
  foods_to_avoid: [
    'Refined sugars and sweets',
    'White bread and processed carbs',
    'Sugary beverages and sodas',
    'Fried and deep-fried foods',
    'Processed meats (sausages, hot dogs)',
    'Excessive alcohol consumption',
  ],
  meal_plan: [
    { meal: 'Breakfast', description: 'Oatmeal with berries, chia seeds, and a handful of almonds. Green tea.', time: '7:00 AM' },
    { meal: 'Mid-Morning Snack', description: 'Apple slices with 1 tbsp almond butter', time: '10:00 AM' },
    { meal: 'Lunch', description: 'Grilled chicken salad with mixed greens, quinoa, avocado, and olive oil dressing', time: '12:30 PM' },
    { meal: 'Afternoon Snack', description: 'Greek yogurt with walnuts and a sprinkle of cinnamon', time: '3:30 PM' },
    { meal: 'Dinner', description: 'Baked salmon with roasted vegetables (broccoli, sweet potato, bell peppers)', time: '7:00 PM' },
  ],
  nutritional_notes: 'Focus on a low glycemic index diet. Aim for 25-30g of fiber daily. Keep carbohydrate intake consistent across meals. Include healthy fats from olive oil, avocados, and nuts to slow glucose absorption.',
  hydration_advice: 'Drink at least 8-10 glasses of water daily. Avoid sugary drinks and fruit juices. Herbal teas (cinnamon, chamomile) can help with blood sugar regulation. Consider adding lemon or cucumber to water for flavor.',
  exercise_routines: [
    { name: 'Brisk Walking', description: '30-minute brisk walk at moderate pace to improve insulin sensitivity', difficulty: 'Easy', frequency: 'Daily', duration: '30 mins' },
    { name: 'Resistance Training', description: 'Light weight training focusing on major muscle groups to improve glucose uptake', difficulty: 'Moderate', frequency: '3x per week', duration: '45 mins' },
    { name: 'Yoga / Stretching', description: 'Gentle yoga poses to reduce stress hormones that affect blood sugar', difficulty: 'Easy', frequency: '2-3x per week', duration: '20 mins' },
    { name: 'Swimming or Cycling', description: 'Low-impact cardio to improve cardiovascular health and metabolism', difficulty: 'Moderate', frequency: '2x per week', duration: '30 mins' },
  ],
  lifestyle_tips: [
    'Maintain a consistent sleep schedule (7-8 hours nightly)',
    'Practice stress management through meditation or deep breathing',
    'Monitor blood sugar levels regularly at home',
    'Avoid late-night eating; finish dinner 3 hours before bed',
    'Take a 10-minute walk after each major meal',
    'Schedule regular health check-ups every 3 months',
  ],
  activity_level: 'Moderate - Aim for 150 minutes of moderate exercise per week',
  follow_up_timeline: [
    { date: '2 weeks', action: 'Follow-up blood glucose check', type: 'Lab Test' },
    { date: '1 month', action: 'Nutritionist consultation for diet review', type: 'Check-up' },
    { date: '3 months', action: 'Complete blood panel and HbA1c retest', type: 'Lab Test' },
    { date: '3 months', action: 'Review medication if lifestyle changes insufficient', type: 'Medication' },
    { date: '6 months', action: 'Comprehensive health evaluation', type: 'Check-up' },
  ],
  precautions: [
    'Watch for symptoms of hypoglycemia: shakiness, dizziness, excessive sweating',
    'Carry fast-acting glucose tablets or juice in case of sudden blood sugar drops',
    'Inform your dentist about pre-diabetic status for gum health monitoring',
    'Get annual eye exams to monitor for early diabetic retinopathy',
    'Check feet daily for cuts or sores that heal slowly',
  ],
}

const SAMPLE_ALERT: AlertResult = {
  alert_status: 'Sent',
  urgency_level: 'High',
  patient_summary: 'Patient showing critical HbA1c levels of 9.8% with symptoms of diabetic ketoacidosis.',
  condition_detected: 'Diabetic Ketoacidosis (DKA)',
  recommended_actions: [
    'Immediate IV fluid administration',
    'Insulin drip protocol initiation',
    'Electrolyte panel and arterial blood gas',
    'Continuous glucose monitoring',
    'ICU admission for observation',
  ],
  hospitals_to_notify: [
    { name: 'City General Hospital', distance: '2.3 km', specialty: 'Endocrinology', contact: '+1-555-0123' },
    { name: 'St. Mary Medical Center', distance: '4.1 km', specialty: 'Emergency Medicine', contact: '+1-555-0456' },
    { name: 'University Health Center', distance: '5.8 km', specialty: 'Internal Medicine', contact: '+1-555-0789' },
  ],
  alert_message: 'URGENT: Patient requires immediate medical attention for suspected diabetic ketoacidosis. Blood glucose >400 mg/dL, ketones present in urine. Please prepare emergency endocrinology team.',
}

// ----- HELPERS -----
function parseAgentResult(result: any): any {
  if (!result) return {}
  let data = result?.response?.result
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return { text: data }
    }
  }
  return data || {}
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getSeverityClasses(severity?: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return 'bg-red-100 text-red-700 border-red-200'
  if (s === 'moderate') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

function getTimelineColor(type?: string): string {
  const t = (type ?? '').toLowerCase()
  if (t.includes('lab')) return 'bg-blue-500'
  if (t.includes('check')) return 'bg-emerald-500'
  if (t.includes('medication') || t.includes('med')) return 'bg-purple-500'
  return 'bg-gray-400'
}

function getTimelineDotColor(type?: string): string {
  const t = (type ?? '').toLowerCase()
  if (t.includes('lab')) return 'border-blue-500 bg-blue-50'
  if (t.includes('check')) return 'border-emerald-500 bg-emerald-50'
  if (t.includes('medication') || t.includes('med')) return 'border-purple-500 bg-purple-50'
  return 'border-gray-400 bg-gray-50'
}

function getDifficultyBadge(difficulty?: string): string {
  const d = (difficulty ?? '').toLowerCase()
  if (d === 'easy') return 'bg-green-100 text-green-700'
  if (d === 'moderate') return 'bg-yellow-100 text-yellow-700'
  if (d === 'hard' || d === 'difficult') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

const GLASS = 'backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg'
const GLASS_CARD = 'backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg rounded-xl'

// ----- ERROR BOUNDARY -----
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ----- SIDEBAR NAV -----
function Sidebar({
  activeScreen,
  onNavigate,
  collapsed,
  onToggle,
}: {
  activeScreen: string
  onNavigate: (screen: string) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'upload', label: 'Upload & Diagnose', icon: FiUpload },
    { id: 'reports', label: 'My Reports', icon: FiFileText },
    { id: 'alerts', label: 'Emergency Alerts', icon: FiAlertTriangle },
  ]

  return (
    <div className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[280px]'} ${GLASS} rounded-none border-r border-white/[0.18]`}>
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onToggle} className="p-2 rounded-lg hover:bg-emerald-100/60 transition-colors">
            <FiMenu className="w-5 h-5 text-emerald-700" />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <RiHeartPulseLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-emerald-900 leading-tight">HealthDiag</h1>
                <p className="text-[10px] text-emerald-600 leading-tight">Smart Diagnosis</p>
              </div>
            </div>
          )}
        </div>

        <Separator className="mx-3 bg-emerald-200/40" />

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-emerald-700 hover:bg-emerald-100/60'}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                {!collapsed && (
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="p-4">
            <div className={`${GLASS_CARD} p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <FiInfo className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-800">AI Agents</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-emerald-700">Diagnosis Coordinator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-emerald-700">Hospital Alert Agent</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ----- SEVERITY BADGE -----
function SeverityBadge({ severity }: { severity?: string }) {
  return (
    <Badge variant="outline" className={`${getSeverityClasses(severity)} text-xs font-medium px-2.5 py-0.5`}>
      {severity ?? 'Unknown'}
    </Badge>
  )
}

// ----- TIMELINE COMPONENT -----
function FollowUpTimeline({ items }: { items: FollowUpItem[] }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <div className="relative">
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-emerald-200" />
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 relative">
            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 z-10 flex items-center justify-center ${getTimelineDotColor(item.type)}`}>
              <div className={`w-2 h-2 rounded-full ${getTimelineColor(item.type)}`} />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-emerald-800">{item.date ?? ''}</span>
                {item.type && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/50">
                    {item.type}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-emerald-700 mt-0.5">{item.action ?? ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----- FILE UPLOAD ZONE -----
function FileUploadZone({
  files,
  onFilesChange,
}: {
  files: File[]
  onFilesChange: (files: File[]) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
        ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
      )
      onFilesChange([...files, ...droppedFiles])
    },
    [files, onFilesChange]
  )

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      onFilesChange([...files, ...selected])
    }
  }

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' : 'border-emerald-300/60 hover:border-emerald-400 hover:bg-emerald-50/30'}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleSelect}
        />
        <FiUpload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-emerald-800">
          Drag & drop your medical reports here
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          or click to browse (PDF, JPG, PNG)
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, idx) => (
            <div key={idx} className={`${GLASS_CARD} px-3 py-2 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-800 truncate max-w-[200px]">{f.name}</span>
                <span className="text-xs text-emerald-500">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(idx) }} className="p-1 rounded-md hover:bg-red-100 transition-colors">
                <FiX className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ----- LOADING STEPS -----
function DiagnosisLoadingSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className={`${GLASS_CARD} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <FiLoader className="w-5 h-5 text-emerald-600 animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-900">Analyzing your report</h3>
          <p className="text-xs text-emerald-600">This may take a minute...</p>
        </div>
      </div>
      <Progress value={(currentStep / LOADING_STEPS.length) * 100} className="mb-6 h-2" />
      <div className="space-y-3">
        {LOADING_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${idx < currentStep ? 'bg-emerald-500' : idx === currentStep ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-gray-100'}`}>
              {idx < currentStep ? (
                <FiCheck className="w-3.5 h-3.5 text-white" />
              ) : idx === currentStep ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>
            <span className={`text-sm ${idx < currentStep ? 'text-emerald-700 font-medium' : idx === currentStep ? 'text-emerald-800 font-semibold' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----- DASHBOARD SCREEN -----
function DashboardScreen({
  diagnoses,
  alerts,
  onNavigate,
  showSample,
}: {
  diagnoses: StoredDiagnosis[]
  alerts: StoredAlert[]
  onNavigate: (screen: string) => void
  showSample: boolean
}) {
  const displayDiagnoses = showSample && diagnoses.length === 0
    ? [{ id: 'sample-1', date: new Date().toISOString(), data: SAMPLE_DIAGNOSIS, language: 'EN' }]
    : diagnoses

  const totalDiagnoses = displayDiagnoses.length
  const criticalCount = displayDiagnoses.filter((d) => d.data?.severity?.toLowerCase() === 'critical').length
  const nextFollowUp = displayDiagnoses.length > 0
    ? (Array.isArray(displayDiagnoses[0]?.data?.follow_up_timeline) && displayDiagnoses[0].data.follow_up_timeline.length > 0
      ? displayDiagnoses[0].data.follow_up_timeline[0]?.date
      : 'N/A')
    : 'N/A'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Dashboard</h2>
          <p className="text-sm text-emerald-600">Your health overview at a glance</p>
        </div>
        <Button onClick={() => onNavigate('upload')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200">
          <FiPlus className="w-4 h-4 mr-2" />
          New Diagnosis
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${GLASS_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <RiStethoscopeLine className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Total Diagnoses</p>
              <p className="text-2xl font-bold text-emerald-900">{totalDiagnoses}</p>
            </div>
          </div>
        </div>
        <div className={`${GLASS_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Critical Alerts</p>
              <p className="text-2xl font-bold text-emerald-900">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className={`${GLASS_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Next Follow-up</p>
              <p className="text-lg font-bold text-emerald-900">{nextFollowUp}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Diagnoses */}
        <div className={`${GLASS_CARD} p-5`}>
          <h3 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <RiHeartPulseLine className="w-4 h-4 text-emerald-600" />
            Recent Diagnoses
          </h3>
          {displayDiagnoses.length === 0 ? (
            <div className="text-center py-8">
              <RiStethoscopeLine className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-emerald-600 mb-1">No diagnoses yet</p>
              <p className="text-xs text-emerald-500">Upload your first report to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayDiagnoses.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white/40 hover:bg-white/60 transition-colors cursor-pointer" onClick={() => onNavigate('results')}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <BiDna className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-900 line-clamp-1">{d.data?.disease_prediction ?? 'Diagnosis'}</p>
                      <p className="text-xs text-emerald-500">{new Date(d.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <SeverityBadge severity={d.data?.severity} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Follow-ups & Quick Actions */}
        <div className="space-y-4">
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-emerald-600" />
              Upcoming Follow-ups
            </h3>
            {displayDiagnoses.length > 0 && Array.isArray(displayDiagnoses[0]?.data?.follow_up_timeline) ? (
              <FollowUpTimeline items={displayDiagnoses[0].data.follow_up_timeline.slice(0, 3)} />
            ) : (
              <div className="text-center py-6">
                <FiCalendar className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-xs text-emerald-500">No follow-ups scheduled</p>
              </div>
            )}
          </div>

          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-emerald-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onNavigate('upload')} className="h-auto py-3 flex-col gap-1 bg-white/40 hover:bg-emerald-50 border-emerald-200/60">
                <FiUpload className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700">Upload Report</span>
              </Button>
              <Button variant="outline" onClick={() => onNavigate('reports')} className="h-auto py-3 flex-col gap-1 bg-white/40 hover:bg-emerald-50 border-emerald-200/60">
                <FiFileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700">View Reports</span>
              </Button>
              <Button variant="outline" onClick={() => onNavigate('alerts')} className="h-auto py-3 flex-col gap-1 bg-white/40 hover:bg-emerald-50 border-emerald-200/60">
                <FiAlertTriangle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700">Alert History</span>
              </Button>
              <Button variant="outline" onClick={() => onNavigate('upload')} className="h-auto py-3 flex-col gap-1 bg-white/40 hover:bg-emerald-50 border-emerald-200/60">
                <FiActivity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700">Health Check</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- UPLOAD & DIAGNOSE SCREEN -----
function UploadScreen({
  onDiagnosisComplete,
  onNavigate,
}: {
  onDiagnosisComplete: (data: DiagnosisResult, reportUrl?: string) => void
  onNavigate: (screen: string) => void
}) {
  const [language, setLanguage] = useState('EN')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [conditions, setConditions] = useState('')
  const [medications, setMedications] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload at least one medical report file.')
      return
    }
    setError(null)
    setLoading(true)
    setLoadingStep(0)

    // Simulate step progression
    let step = 0
    stepIntervalRef.current = setInterval(() => {
      step++
      if (step < LOADING_STEPS.length) {
        setLoadingStep(step)
      }
    }, 4000)

    try {
      // Step 1: Upload files
      setActiveAgentId(DIAGNOSIS_AGENT_ID)
      const uploadResult = await uploadFiles(files)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error ?? 'File upload failed')
      }
      setLoadingStep(1)

      // Step 2: Call Diagnosis Agent
      const message = `Please analyze the attached medical report. Patient Info: Age: ${age || 'Not specified'}, Gender: ${gender || 'Not specified'}, Known Conditions: ${conditions || 'None'}, Current Medications: ${medications || 'None'}, Symptoms: ${symptoms || 'None'}. Language: ${language}`

      const result = await callAIAgent(message, DIAGNOSIS_AGENT_ID, {
        assets: uploadResult.asset_ids,
      })

      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current)
      setLoadingStep(LOADING_STEPS.length)

      if (result.success) {
        const parsed = parseAgentResult(result)
        const reportFiles = Array.isArray(result?.module_outputs?.artifact_files)
          ? result.module_outputs.artifact_files
          : []
        const reportUrl = reportFiles.length > 0 ? reportFiles[0]?.file_url : undefined
        onDiagnosisComplete(parsed as DiagnosisResult, reportUrl)
        onNavigate('results')
      } else {
        setError(result.error ?? 'Diagnosis failed. Please try again.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'An unexpected error occurred.')
    } finally {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current)
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <DiagnosisLoadingSteps currentStep={loadingStep} />
        <div className="mt-4 text-center">
          <p className="text-xs text-emerald-500 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Agent: Diagnosis Coordinator
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-900">Upload & Diagnose</h2>
        <p className="text-sm text-emerald-600">Upload your medical report and get an AI-powered diagnosis</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50/80 border border-red-200">
          <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded">
            <FiX className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Language Selector */}
      <div className={`${GLASS_CARD} p-5`}>
        <Label className="text-sm font-semibold text-emerald-800 mb-2 block">Response Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full bg-white/60 border-emerald-200/60">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label} ({lang.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Health Info Form */}
      <div className={`${GLASS_CARD} p-5 space-y-4`}>
        <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-emerald-600" />
          Patient Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age" className="text-xs text-emerald-700 mb-1 block">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="e.g., 45"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="bg-white/60 border-emerald-200/60"
            />
          </div>
          <div>
            <Label htmlFor="gender" className="text-xs text-emerald-700 mb-1 block">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-white/60 border-emerald-200/60">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="conditions" className="text-xs text-emerald-700 mb-1 block">Known Conditions (comma separated)</Label>
          <Input
            id="conditions"
            placeholder="e.g., Hypertension, Asthma"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            className="bg-white/60 border-emerald-200/60"
          />
        </div>
        <div>
          <Label htmlFor="medications" className="text-xs text-emerald-700 mb-1 block">Current Medications</Label>
          <Input
            id="medications"
            placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            className="bg-white/60 border-emerald-200/60"
          />
        </div>
        <div>
          <Label htmlFor="symptoms" className="text-xs text-emerald-700 mb-1 block">Symptoms (comma separated)</Label>
          <Textarea
            id="symptoms"
            placeholder="e.g., Frequent urination, blurred vision, fatigue"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="bg-white/60 border-emerald-200/60 min-h-[80px]"
          />
        </div>
      </div>

      {/* File Upload */}
      <div className={`${GLASS_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
          <FiUpload className="w-4 h-4 text-emerald-600" />
          Medical Report Upload
        </h3>
        <FileUploadZone files={files} onFilesChange={setFiles} />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={files.length === 0}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 text-base disabled:opacity-50"
      >
        <RiStethoscopeLine className="w-5 h-5 mr-2" />
        Analyze & Diagnose
      </Button>
    </div>
  )
}

// ----- DIAGNOSIS RESULTS SCREEN -----
function ResultsScreen({
  diagnosis,
  reportUrl,
  onSendAlert,
  alertSending,
}: {
  diagnosis: DiagnosisResult | null
  reportUrl?: string
  onSendAlert: () => void
  alertSending: boolean
}) {
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

  if (!diagnosis) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RiStethoscopeLine className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Results Yet</h3>
          <p className="text-sm text-emerald-600">Upload a medical report to see your diagnosis</p>
        </div>
      </div>
    )
  }

  const confidenceLevel = diagnosis.confidence_level ?? 0
  const keyFindings = Array.isArray(diagnosis.key_findings) ? diagnosis.key_findings : []
  const recommendedTests = Array.isArray(diagnosis.recommended_tests) ? diagnosis.recommended_tests : []
  const foodsToEat = Array.isArray(diagnosis.foods_to_eat) ? diagnosis.foods_to_eat : []
  const foodsToAvoid = Array.isArray(diagnosis.foods_to_avoid) ? diagnosis.foods_to_avoid : []
  const mealPlan = Array.isArray(diagnosis.meal_plan) ? diagnosis.meal_plan : []
  const exerciseRoutines = Array.isArray(diagnosis.exercise_routines) ? diagnosis.exercise_routines : []
  const lifestyleTips = Array.isArray(diagnosis.lifestyle_tips) ? diagnosis.lifestyle_tips : []
  const followUpTimeline = Array.isArray(diagnosis.follow_up_timeline) ? diagnosis.follow_up_timeline : []
  const precautions = Array.isArray(diagnosis.precautions) ? diagnosis.precautions : []

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      {diagnosis.is_critical && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/90 border border-red-300 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">Critical Condition Detected</p>
              <p className="text-xs text-red-600">Immediate medical attention may be required</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setAlertDialogOpen(true)} disabled={alertSending} className="shadow-md">
            {alertSending ? (
              <><FiLoader className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              <><FiAlertTriangle className="w-4 h-4 mr-2" />Send Emergency Alert</>
            )}
          </Button>
        </div>
      )}

      {/* Diagnosis Header */}
      <div className={`${GLASS_CARD} p-6`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <BiDna className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900">{diagnosis.disease_prediction ?? 'Diagnosis Result'}</h2>
              <p className="text-sm text-emerald-600 mt-0.5">{diagnosis.diagnosis_summary ?? ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-700">{confidenceLevel}%</div>
              <p className="text-[10px] text-emerald-500 uppercase tracking-wider">Confidence</p>
            </div>
            <SeverityBadge severity={diagnosis.severity} />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {reportUrl && (
            <Button variant="outline" onClick={() => window.open(reportUrl, '_blank')} className="bg-white/40 hover:bg-emerald-50 border-emerald-200/60">
              <FiDownload className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          )}
          {!diagnosis.is_critical && (
            <Button variant="outline" onClick={() => setAlertDialogOpen(true)} className="bg-white/40 hover:bg-red-50 border-red-200/60 text-red-600">
              <FiAlertTriangle className="w-4 h-4 mr-2" />
              Send Alert
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="w-full bg-white/40 border border-emerald-200/40 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="diagnosis" className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
            <RiStethoscopeLine className="w-4 h-4 mr-2" />
            Diagnosis
          </TabsTrigger>
          <TabsTrigger value="diet" className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
            <RiRestaurantLine className="w-4 h-4 mr-2" />
            Diet Plan
          </TabsTrigger>
          <TabsTrigger value="fitness" className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
            <MdFitnessCenter className="w-4 h-4 mr-2" />
            Fitness & Lifestyle
          </TabsTrigger>
        </TabsList>

        {/* DIAGNOSIS TAB */}
        <TabsContent value="diagnosis" className="mt-4 space-y-4">
          {/* Explanation */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <RiMentalHealthLine className="w-4 h-4 text-emerald-600" />
              Diagnosis Explanation
            </h3>
            <div className="text-sm text-emerald-800 leading-relaxed">
              {renderMarkdown(diagnosis.diagnosis_explanation ?? '')}
            </div>
          </div>

          {/* Key Findings */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <FiSearch className="w-4 h-4 text-emerald-600" />
              Key Findings
            </h3>
            <div className="space-y-2">
              {keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/40">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-emerald-800">{finding}</span>
                </div>
              ))}
              {keyFindings.length === 0 && <p className="text-sm text-emerald-500">No key findings available</p>}
            </div>
          </div>

          {/* Recommended Tests */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <RiMedicineBottleLine className="w-4 h-4 text-emerald-600" />
              Recommended Tests
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recommendedTests.map((test, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <FiArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{test}</span>
                </div>
              ))}
              {recommendedTests.length === 0 && <p className="text-sm text-emerald-500">No recommended tests</p>}
            </div>
          </div>
        </TabsContent>

        {/* DIET PLAN TAB */}
        <TabsContent value="diet" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Foods to Eat */}
            <div className={`${GLASS_CARD} p-5`}>
              <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <RiLeafLine className="w-4 h-4 text-green-600" />
                Foods to Eat
              </h3>
              <div className="space-y-2">
                {foodsToEat.map((food, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50/70 border border-green-100">
                    <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-800">{food}</span>
                  </div>
                ))}
                {foodsToEat.length === 0 && <p className="text-sm text-emerald-500">No dietary recommendations</p>}
              </div>
            </div>

            {/* Foods to Avoid */}
            <div className={`${GLASS_CARD} p-5`}>
              <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <FiX className="w-4 h-4 text-red-500" />
                Foods to Avoid
              </h3>
              <div className="space-y-2">
                {foodsToAvoid.map((food, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50/70 border border-red-100">
                    <FiX className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-800">{food}</span>
                  </div>
                ))}
                {foodsToAvoid.length === 0 && <p className="text-sm text-emerald-500">No foods to avoid listed</p>}
              </div>
            </div>
          </div>

          {/* Meal Plan */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <MdOutlineLocalDining className="w-4 h-4 text-emerald-600" />
              Daily Meal Plan
            </h3>
            {mealPlan.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-200/40">
                      <TableHead className="text-emerald-700 text-xs font-semibold">Time</TableHead>
                      <TableHead className="text-emerald-700 text-xs font-semibold">Meal</TableHead>
                      <TableHead className="text-emerald-700 text-xs font-semibold">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealPlan.map((item, idx) => (
                      <TableRow key={idx} className="border-emerald-100/40">
                        <TableCell className="text-sm text-emerald-600 font-medium whitespace-nowrap">{item.time ?? ''}</TableCell>
                        <TableCell className="text-sm text-emerald-800 font-medium">{item.meal ?? ''}</TableCell>
                        <TableCell className="text-sm text-emerald-700">{item.description ?? ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-emerald-500">No meal plan available</p>
            )}
          </div>

          {/* Nutritional Notes & Hydration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${GLASS_CARD} p-5`}>
              <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-emerald-600" />
                Nutritional Notes
              </h3>
              <div className="text-sm text-emerald-700 leading-relaxed">
                {renderMarkdown(diagnosis.nutritional_notes ?? '')}
              </div>
            </div>
            <div className={`${GLASS_CARD} p-5`}>
              <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <FiDroplet className="w-4 h-4 text-blue-500" />
                Hydration Advice
              </h3>
              <div className="text-sm text-emerald-700 leading-relaxed">
                {renderMarkdown(diagnosis.hydration_advice ?? '')}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FITNESS & LIFESTYLE TAB */}
        <TabsContent value="fitness" className="mt-4 space-y-4">
          {/* Activity Level */}
          {diagnosis.activity_level && (
            <div className={`${GLASS_CARD} p-4 flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <RiRunLine className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-500 font-medium">Recommended Activity Level</p>
                <p className="text-sm font-semibold text-emerald-800">{diagnosis.activity_level}</p>
              </div>
            </div>
          )}

          {/* Exercise Routines */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <MdFitnessCenter className="w-4 h-4 text-emerald-600" />
              Exercise Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exerciseRoutines.map((routine, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/50 border border-emerald-100/60 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-emerald-900">{routine.name ?? ''}</h4>
                    <Badge className={`${getDifficultyBadge(routine.difficulty)} text-[10px] px-1.5`}>
                      {routine.difficulty ?? ''}
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-700 mb-3">{routine.description ?? ''}</p>
                  <div className="flex items-center gap-3 text-xs text-emerald-600">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {routine.duration ?? ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiRefreshCw className="w-3 h-3" />
                      {routine.frequency ?? ''}
                    </span>
                  </div>
                </div>
              ))}
              {exerciseRoutines.length === 0 && <p className="text-sm text-emerald-500">No exercise routines available</p>}
            </div>
          </div>

          {/* Lifestyle Tips */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <FiStar className="w-4 h-4 text-amber-500" />
              Lifestyle Tips
            </h3>
            <div className="space-y-2">
              {lifestyleTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100/60">
                  <FiStar className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-emerald-800">{tip}</span>
                </div>
              ))}
              {lifestyleTips.length === 0 && <p className="text-sm text-emerald-500">No lifestyle tips available</p>}
            </div>
          </div>

          {/* Follow-up Timeline */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-emerald-600" />
              Follow-up Timeline
            </h3>
            <FollowUpTimeline items={followUpTimeline} />
            {followUpTimeline.length === 0 && <p className="text-sm text-emerald-500">No follow-up timeline available</p>}
          </div>

          {/* Precautions */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <FiShield className="w-4 h-4 text-orange-500" />
              Precautions
            </h3>
            <div className="space-y-2">
              {precautions.map((p, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-orange-50/50 border border-orange-100/60">
                  <FiAlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-emerald-800">{p}</span>
                </div>
              ))}
              {precautions.length === 0 && <p className="text-sm text-emerald-500">No precautions listed</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Emergency Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border-emerald-200/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <FiAlertTriangle className="w-5 h-5" />
              Send Emergency Alert
            </DialogTitle>
            <DialogDescription className="text-emerald-600">
              This will send an emergency alert to nearby hospitals with the patient diagnosis details. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-red-50/80 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Condition:</strong> {diagnosis.disease_prediction ?? 'N/A'}
            </p>
            <p className="text-sm text-red-700 mt-1">
              <strong>Severity:</strong> {diagnosis.severity ?? 'N/A'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)} className="border-emerald-200/60">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={alertSending}
              onClick={() => {
                onSendAlert()
                setAlertDialogOpen(false)
              }}
            >
              {alertSending ? <FiLoader className="w-4 h-4 mr-2 animate-spin" /> : <FiAlertTriangle className="w-4 h-4 mr-2" />}
              Confirm & Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ----- MY REPORTS SCREEN -----
function ReportsScreen({
  diagnoses,
  onViewDiagnosis,
  showSample,
}: {
  diagnoses: StoredDiagnosis[]
  onViewDiagnosis: (d: StoredDiagnosis) => void
  showSample: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDiagnosis, setPreviewDiagnosis] = useState<StoredDiagnosis | null>(null)

  const displayDiagnoses = showSample && diagnoses.length === 0
    ? [
      { id: 'sample-1', date: new Date().toISOString(), data: SAMPLE_DIAGNOSIS, language: 'EN', reportUrl: undefined },
      { id: 'sample-2', date: new Date(Date.now() - 7 * 86400000).toISOString(), data: { ...SAMPLE_DIAGNOSIS, disease_prediction: 'Vitamin D Deficiency', severity: 'Normal', confidence_level: 92 }, language: 'EN', reportUrl: undefined },
      { id: 'sample-3', date: new Date(Date.now() - 14 * 86400000).toISOString(), data: { ...SAMPLE_DIAGNOSIS, disease_prediction: 'Hypercholesterolemia', severity: 'Moderate', confidence_level: 78 }, language: 'HI', reportUrl: undefined },
    ]
    : diagnoses

  const filtered = displayDiagnoses.filter((d) => {
    const matchesSearch = (d.data?.disease_prediction ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || (d.data?.severity ?? '').toLowerCase() === severityFilter.toLowerCase()
    return matchesSearch && matchesSeverity
  })

  const handlePreview = (d: StoredDiagnosis) => {
    setPreviewDiagnosis(d)
    setPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-900">My Reports</h2>
        <p className="text-sm text-emerald-600">View and manage your diagnosis history</p>
      </div>

      {/* Filters */}
      <div className={`${GLASS_CARD} p-4 flex flex-col sm:flex-row gap-3`}>
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <Input
            placeholder="Search by condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/60 border-emerald-200/60"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/60 border-emerald-200/60">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={`${GLASS_CARD} p-12 text-center`}>
          <FiFileText className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Reports Found</h3>
          <p className="text-sm text-emerald-600">
            {diagnoses.length === 0 ? 'Upload your first medical report to get started' : 'No reports match your filters'}
          </p>
        </div>
      ) : (
        <div className={`${GLASS_CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-emerald-200/40 bg-emerald-50/30">
                  <TableHead className="text-emerald-700 text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-emerald-700 text-xs font-semibold">Condition</TableHead>
                  <TableHead className="text-emerald-700 text-xs font-semibold">Confidence</TableHead>
                  <TableHead className="text-emerald-700 text-xs font-semibold">Severity</TableHead>
                  <TableHead className="text-emerald-700 text-xs font-semibold">Language</TableHead>
                  <TableHead className="text-emerald-700 text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="border-emerald-100/40 hover:bg-emerald-50/30 cursor-pointer" onClick={() => handlePreview(d)}>
                    <TableCell className="text-sm text-emerald-700">{new Date(d.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm font-medium text-emerald-900">{d.data?.disease_prediction ?? 'N/A'}</TableCell>
                    <TableCell className="text-sm text-emerald-700">{d.data?.confidence_level ?? 0}%</TableCell>
                    <TableCell><SeverityBadge severity={d.data?.severity} /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/50 text-xs">{d.language}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePreview(d) }} className="h-8 w-8 p-0 hover:bg-emerald-100">
                                <FiEye className="w-4 h-4 text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {d.reportUrl && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.open(d.reportUrl, '_blank') }} className="h-8 w-8 p-0 hover:bg-emerald-100">
                                  <FiDownload className="w-4 h-4 text-emerald-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download Report</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-emerald-200/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-900">
              <BiDna className="w-5 h-5 text-emerald-600" />
              {previewDiagnosis?.data?.disease_prediction ?? 'Diagnosis Details'}
            </DialogTitle>
            <DialogDescription className="text-emerald-600">
              {previewDiagnosis ? new Date(previewDiagnosis.date).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>
          {previewDiagnosis && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SeverityBadge severity={previewDiagnosis.data?.severity} />
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{previewDiagnosis.data?.confidence_level ?? 0}% Confidence</Badge>
              </div>
              <Separator className="bg-emerald-200/40" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900 mb-2">Summary</h4>
                <div className="text-sm text-emerald-700">{renderMarkdown(previewDiagnosis.data?.diagnosis_summary ?? '')}</div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-900 mb-2">Explanation</h4>
                <div className="text-sm text-emerald-700">{renderMarkdown(previewDiagnosis.data?.diagnosis_explanation ?? '')}</div>
              </div>
              {Array.isArray(previewDiagnosis.data?.key_findings) && previewDiagnosis.data.key_findings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 mb-2">Key Findings</h4>
                  <ul className="space-y-1">
                    {previewDiagnosis.data.key_findings.map((f, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                        <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { onViewDiagnosis(previewDiagnosis); setPreviewOpen(false) }} className="border-emerald-200/60">
                  View Full Results
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ----- EMERGENCY ALERTS SCREEN -----
function AlertsScreen({
  alerts,
  showSample,
}: {
  alerts: StoredAlert[]
  showSample: boolean
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const displayAlerts = showSample && alerts.length === 0
    ? [
      { id: 'sample-alert-1', date: new Date().toISOString(), data: SAMPLE_ALERT },
      { id: 'sample-alert-2', date: new Date(Date.now() - 3 * 86400000).toISOString(), data: { ...SAMPLE_ALERT, alert_status: 'Acknowledged', condition_detected: 'Severe Hypoglycemia', urgency_level: 'Critical' } },
    ]
    : alerts

  const getAlertStatusBadge = (status?: string) => {
    const s = (status ?? '').toLowerCase()
    if (s === 'sent') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (s === 'acknowledged') return 'bg-green-100 text-green-700 border-green-200'
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-900">Emergency Alerts</h2>
        <p className="text-sm text-emerald-600">History of emergency alerts sent to hospitals</p>
      </div>

      {displayAlerts.length === 0 ? (
        <div className={`${GLASS_CARD} p-12 text-center`}>
          <FiAlertTriangle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Alerts Sent</h3>
          <p className="text-sm text-emerald-600">Emergency alerts will appear here when sent</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id
            const hospitals = Array.isArray(alert.data?.hospitals_to_notify) ? alert.data.hospitals_to_notify : []
            const actions = Array.isArray(alert.data?.recommended_actions) ? alert.data.recommended_actions : []

            return (
              <div key={alert.id} className={`${GLASS_CARD} overflow-hidden transition-all duration-300`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                      <FiAlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{alert.data?.condition_detected ?? 'Alert'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-emerald-500">{new Date(alert.date).toLocaleString()}</span>
                        <span className="text-xs text-emerald-400">|</span>
                        <span className="text-xs text-emerald-500">{hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} notified</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${getAlertStatusBadge(alert.data?.alert_status)} text-xs`}>
                      {alert.data?.alert_status ?? 'Unknown'}
                    </Badge>
                    {isExpanded ? <FiChevronUp className="w-4 h-4 text-emerald-500" /> : <FiChevronDown className="w-4 h-4 text-emerald-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-emerald-100/40 pt-4">
                    {/* Urgency & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-emerald-500 font-medium mb-1">Urgency Level</p>
                        <Badge className="bg-red-100 text-red-700 border-red-200">{alert.data?.urgency_level ?? 'N/A'}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-500 font-medium mb-1">Patient Summary</p>
                        <p className="text-sm text-emerald-800">{alert.data?.patient_summary ?? 'N/A'}</p>
                      </div>
                    </div>

                    {/* Alert Message */}
                    {alert.data?.alert_message && (
                      <div className="p-3 rounded-lg bg-red-50/60 border border-red-100">
                        <p className="text-xs text-red-500 font-medium mb-1">Alert Message</p>
                        <p className="text-sm text-red-800">{alert.data.alert_message}</p>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {actions.length > 0 && (
                      <div>
                        <p className="text-xs text-emerald-500 font-medium mb-2">Recommended Actions</p>
                        <div className="space-y-1.5">
                          {actions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/40">
                              <FiArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-emerald-800">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hospitals */}
                    {hospitals.length > 0 && (
                      <div>
                        <p className="text-xs text-emerald-500 font-medium mb-2">Hospitals Notified</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {hospitals.map((h, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-white/50 border border-emerald-100/60">
                              <p className="text-sm font-medium text-emerald-900 flex items-center gap-1.5">
                                <RiHospitalLine className="w-4 h-4 text-emerald-600" />
                                {h.name ?? ''}
                              </p>
                              <div className="mt-1.5 space-y-0.5">
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                  <FiMapPin className="w-3 h-3" />{h.distance ?? ''}
                                </p>
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                  <RiStethoscopeLine className="w-3 h-3" />{h.specialty ?? ''}
                                </p>
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                  <FiPhone className="w-3 h-3" />{h.contact ?? ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==========================================
// ===== MAIN PAGE COMPONENT =====
// ==========================================
export default function Page() {
  // Navigation
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSample, setShowSample] = useState(false)

  // Data
  const [diagnoses, setDiagnoses] = useState<StoredDiagnosis[]>([])
  const [alerts, setAlerts] = useState<StoredAlert[]>([])
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisResult | null>(null)
  const [currentReportUrl, setCurrentReportUrl] = useState<string | undefined>(undefined)
  const [alertSending, setAlertSending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const storedDiagnoses = localStorage.getItem('diagnoses')
      if (storedDiagnoses) setDiagnoses(JSON.parse(storedDiagnoses))
      const storedAlerts = localStorage.getItem('alerts')
      if (storedAlerts) setAlerts(JSON.parse(storedAlerts))
    } catch {
      // ignore parse errors
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('diagnoses', JSON.stringify(diagnoses)) } catch { /* ignore */ }
  }, [diagnoses])

  useEffect(() => {
    try { localStorage.setItem('alerts', JSON.stringify(alerts)) } catch { /* ignore */ }
  }, [alerts])

  // Handle diagnosis complete
  const handleDiagnosisComplete = useCallback((data: DiagnosisResult, reportUrl?: string) => {
    setCurrentDiagnosis(data)
    setCurrentReportUrl(reportUrl)
    const stored: StoredDiagnosis = {
      id: generateId(),
      date: new Date().toISOString(),
      data,
      language: 'EN',
      reportUrl,
    }
    setDiagnoses((prev) => [stored, ...prev])
  }, [])

  // Handle view from reports
  const handleViewDiagnosis = useCallback((d: StoredDiagnosis) => {
    setCurrentDiagnosis(d.data)
    setCurrentReportUrl(d.reportUrl)
    setActiveScreen('results')
  }, [])

  // Handle send emergency alert
  const handleSendAlert = useCallback(async () => {
    if (!currentDiagnosis) return
    setAlertSending(true)
    setActiveAgentId(HOSPITAL_ALERT_AGENT_ID)

    try {
      const message = `EMERGENCY ALERT: Patient diagnosed with ${currentDiagnosis.disease_prediction ?? 'unknown condition'}. Severity: ${currentDiagnosis.severity ?? 'unknown'}. Confidence: ${currentDiagnosis.confidence_level ?? 0}%. Key findings: ${Array.isArray(currentDiagnosis.key_findings) ? currentDiagnosis.key_findings.join('; ') : 'N/A'}. Diagnosis summary: ${currentDiagnosis.diagnosis_summary ?? 'N/A'}`

      const result = await callAIAgent(message, HOSPITAL_ALERT_AGENT_ID)

      if (result.success) {
        const alertData = parseAgentResult(result) as AlertResult
        const storedAlert: StoredAlert = {
          id: generateId(),
          date: new Date().toISOString(),
          data: alertData,
        }
        setAlerts((prev) => [storedAlert, ...prev])
        setStatusMessage('Emergency alert sent successfully!')
        setTimeout(() => setStatusMessage(null), 5000)
      } else {
        setStatusMessage('Failed to send alert: ' + (result.error ?? 'Unknown error'))
        setTimeout(() => setStatusMessage(null), 5000)
      }
    } catch (err: any) {
      setStatusMessage('Error sending alert: ' + (err?.message ?? 'Unknown error'))
      setTimeout(() => setStatusMessage(null), 5000)
    } finally {
      setAlertSending(false)
      setActiveAgentId(null)
    }
  }, [currentDiagnosis])

  const handleNavigate = useCallback((screen: string) => {
    setActiveScreen(screen)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(160, 40%, 94%) 0%, hsl(180, 35%, 93%) 30%, hsl(160, 35%, 95%) 60%, hsl(140, 40%, 94%) 100%)' }}>
        {/* Sidebar */}
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[280px]'}`}>
          {/* Top Header */}
          <header className={`sticky top-0 z-30 ${GLASS} rounded-none border-b border-white/[0.18] px-6 py-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-emerald-900 capitalize">
                  {activeScreen === 'results' ? 'Diagnosis Results' : activeScreen.replace('-', ' ')}
                </h2>
                {activeAgentId && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                    Agent Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* Status Message */}
                {statusMessage && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${statusMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {statusMessage.includes('success') ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
                    {statusMessage}
                  </div>
                )}
                {/* Sample Data Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-emerald-600 cursor-pointer">Sample Data</Label>
                  <Switch
                    id="sample-toggle"
                    checked={showSample}
                    onCheckedChange={setShowSample}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            <ScrollArea className="h-[calc(100vh-76px)]">
              <div className="pr-4 pb-8">
                {activeScreen === 'dashboard' && (
                  <DashboardScreen
                    diagnoses={diagnoses}
                    alerts={alerts}
                    onNavigate={handleNavigate}
                    showSample={showSample}
                  />
                )}
                {activeScreen === 'upload' && (
                  <UploadScreen
                    onDiagnosisComplete={handleDiagnosisComplete}
                    onNavigate={handleNavigate}
                  />
                )}
                {activeScreen === 'results' && (
                  <ResultsScreen
                    diagnosis={currentDiagnosis ?? (showSample ? SAMPLE_DIAGNOSIS : null)}
                    reportUrl={currentReportUrl}
                    onSendAlert={handleSendAlert}
                    alertSending={alertSending}
                  />
                )}
                {activeScreen === 'reports' && (
                  <ReportsScreen
                    diagnoses={diagnoses}
                    onViewDiagnosis={handleViewDiagnosis}
                    showSample={showSample}
                  />
                )}
                {activeScreen === 'alerts' && (
                  <AlertsScreen
                    alerts={alerts}
                    showSample={showSample}
                  />
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
