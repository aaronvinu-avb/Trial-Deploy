import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const INITIAL_DATA = [
  {
    id: 'proj-001',
    name: 'Digital Merchant Services Onboarding Rollout',
    businessUnit: 'Commercial Banking',
    owner: 'Anika Sharma',
    dueDate: '2026-06-15',
    weeklyUpdate: 'Vendor alignment completed, UAT scheduling in progress',
    blocker: 'Awaiting legal sign-off on data agreement',
    nextAction: 'Legal review to complete by 12 May',
    escalationRequired: false,
    lastUpdated: '2026-05-06',
    tags: [],
    blockerOwner: 'Legal — contracting',
    hasBlocker: true,
    blockerTargetResolutionDate: '2026-05-12',
  },
  {
    id: 'proj-002',
    name: 'SME Credit Process Simplification',
    businessUnit: 'Business Banking',
    owner: 'Rohan Mehta',
    dueDate: '2026-05-20',
    weeklyUpdate: 'Process mapping complete, stakeholder sign-off received',
    blocker: '',
    nextAction: 'Present recommendations to steering committee on 15 May',
    escalationRequired: false,
    lastUpdated: '2026-05-07',
    tags: [],
  },
  {
    id: 'proj-003',
    name: 'Client Portal UX Upgrade',
    businessUnit: 'Innovation & Insights',
    owner: 'Priya Nair',
    dueDate: '2026-04-30',
    weeklyUpdate: 'Design phase complete but development delayed',
    blocker: 'Resource bandwidth constraints in tech team',
    nextAction: 'Escalate resource conflict to division head',
    escalationRequired: true,
    lastUpdated: '2026-04-28',
    tags: [],
    governanceStatus: 'Needs Escalation',
    riskReason: 'Resource conflict is delaying delivery and requires executive alignment.',
    targetResolutionDate: '2026-05-20',
    escalationRecordRaised: true,
    escalationRecordRef: 'ESC-2026-0142',
    blockerOwner: 'Division head — tech delivery',
    hasBlocker: true,
    blockerTargetResolutionDate: '2026-05-20',
  },
  {
    id: 'proj-004',
    name: 'Cross-Border Payments Workflow Review',
    businessUnit: 'Transaction Banking',
    owner: 'Arjun Rao',
    dueDate: '2026-07-01',
    weeklyUpdate: 'Current state analysis completed, gap identification ongoing',
    blocker: '',
    nextAction: 'Complete mapping and circulate findings by 20 May',
    escalationRequired: false,
    lastUpdated: '2026-05-07',
    tags: [],
  },
  {
    id: 'proj-005',
    name: 'Sustainability Reporting Compliance Initiative',
    businessUnit: 'ESG & Strategy',
    owner: 'Meera Iyer',
    dueDate: '2026-06-28',
    weeklyUpdate: 'Data collection framework designed',
    blocker: 'Data source alignment pending with finance systems',
    nextAction: 'Follow up with finance data lead by 10 May',
    escalationRequired: false,
    lastUpdated: '2026-05-05',
    tags: [],
  },
  {
    id: 'proj-006',
    name: 'Internal Risk Dashboard Prototype',
    businessUnit: 'Risk & Compliance',
    owner: 'Siddharth Kumar',
    dueDate: '2026-05-10',
    weeklyUpdate: 'Prototype wireframes approved, development started',
    blocker: '',
    nextAction: 'Complete first iteration and schedule demo by 9 May',
    escalationRequired: false,
    lastUpdated: '2026-05-07',
    tags: [],
  },
  {
    id: 'proj-007',
    name: 'Trade Finance Digitisation Pilot',
    businessUnit: 'Commercial Banking',
    owner: 'Divya Krishnan',
    dueDate: '2026-08-01',
    weeklyUpdate: 'Vendor evaluation criteria finalized',
    blocker: 'Vendor selection process still in progress',
    nextAction: 'Shortlist 3 vendors and schedule presentations by 25 May',
    escalationRequired: false,
    lastUpdated: '2026-05-04',
    tags: [],
  },
  {
    id: 'proj-008',
    name: 'Employee Onboarding Process Review',
    businessUnit: 'HR Operations',
    owner: 'Kabir Singh',
    dueDate: '2026-05-31',
    weeklyUpdate: 'Pain point interviews completed across 4 departments',
    blocker: '',
    nextAction: 'Consolidate findings and draft improvement roadmap by 14 May',
    escalationRequired: false,
    lastUpdated: '2026-05-06',
    tags: [],
  },
]

/**
 * Portfolio governance snapshot: prior-week attention totals for week-on-week deltas.
 * Set `attentionPriorWeekCounts` to `null` when no historical baseline exists (shows "—").
 */
const PORTFOLIO_GOVERNANCE_META = {
  attentionPriorWeekCounts: {
    overdue: 1,
    stale: 2,
    escalations: 1,
  },
}

const TAG_OPTIONS = [
  'Compliance',
  'Digital',
  'Onboarding',
  'Merchant Services',
  'Risk',
  'ESG',
  'Payments',
  'Process Improvement',
  'Customer Experience',
  'Internal Operations',
]

function emptyCreateForm() {
  return {
    name: '',
    businessUnit: '',
    owner: '',
    dueDate: '',
    nextAction: '',
    weeklyUpdate: '',
    blocker: '',
    escalationRequired: false,
    tags: [],
    governanceStatus: 'On Track',
    riskReason: '',
    targetResolutionDate: '',
    escalationRecordRaised: null,
    escalationRecordRef: '',
    blockerOwner: '',
    blockerTargetResolutionDate: '',
    hasBlocker: null,
    allowIncompleteEscalationRecord: false,
  }
}

function inferHasBlocker(data) {
  if (data?.hasBlocker === true || data?.hasBlocker === false) return data.hasBlocker
  return Boolean((data?.blocker ?? '').trim())
}

function emptyBlockerDetailFields() {
  return {
    blocker: '',
    blockerOwner: '',
    blockerTargetResolutionDate: '',
  }
}

function normalizeBlockerForPersist(data) {
  if (data.hasBlocker !== true) {
    return { ...data, hasBlocker: false, ...emptyBlockerDetailFields() }
  }
  return {
    ...data,
    hasBlocker: true,
    blocker: (data.blocker ?? '').trim(),
    blockerOwner: (data.blockerOwner ?? '').trim(),
    blockerTargetResolutionDate: data.blockerTargetResolutionDate || '',
  }
}

function validateCreateForm(form) {
  const f = form || {}
  const errors = {}
  if (!(f.name || '').trim()) errors.name = 'Please enter a project name.'
  if (!(f.businessUnit || '').trim()) errors.businessUnit = 'Please enter or select a business unit.'
  if (!(f.owner || '').trim()) errors.owner = 'Please enter an owner.'
  if (!f.dueDate) errors.dueDate = 'Please choose a due date.'
  if (f.hasBlocker !== true && !(f.nextAction || '').trim()) {
    errors.nextAction = 'Please describe the next action.'
  }
  const gov = validateGovernanceForm(f)
  const blocker = validateBlockerForm(f)
  return { ...errors, ...gov, ...blocker }
}

function generateProjectId(projects) {
  let max = 0
  for (const p of projects) {
    const m = /^proj-(\d+)$/i.exec(p.id)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `proj-${String(max + 1).padStart(3, '0')}`
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`)
}

const CAL_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Calendar dates as DD MMM YYYY (e.g. 07 May 2026) */
function formatCalendarDate(d) {
  const day = String(d.getDate()).padStart(2, '0')
  const mon = CAL_MONTHS_SHORT[d.getMonth()]
  return `${day} ${mon} ${d.getFullYear()}`
}

function formatDate(value) {
  if (!value) return '—'
  return formatCalendarDate(parseDate(value))
}

function getStatus(project) {
  const gs = project.governanceStatus
  if (gs === 'Needs Escalation') return { key: 'red', label: 'Needs Escalation' }
  if (gs === 'At Risk') return { key: 'amber', label: 'At Risk' }
  if (gs === 'On Track') return { key: 'green', label: 'On Track' }

  const today = startOfDay(new Date())
  const due = startOfDay(parseDate(project.dueDate))
  const msPerDay = 86400000
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / msPerDay)

  if (due.getTime() < today.getTime() || project.escalationRequired) {
    return { key: 'red', label: 'Needs Escalation' }
  }

  const dueWithinSevenDays = daysUntilDue >= 0 && daysUntilDue <= 7
  if (inferHasBlocker(project) || dueWithinSevenDays) {
    return { key: 'amber', label: 'At Risk' }
  }

  return { key: 'green', label: 'On Track' }
}

/** Table / tooltip: governance consistency issues */
function getGovernanceWarnings(project) {
  const warnings = []
  const gs = project.governanceStatus
  const label = getStatus(project).label
  if (inferHasBlocker(project)) {
    const desc = (project.blocker ?? '').trim()
    if (!desc) warnings.push('Blocker description is required when a blocker is recorded.')
    if (!(project.blockerOwner ?? '').trim()) warnings.push('Blocker owner is required when a blocker is recorded.')
    if (!(project.nextAction ?? '').trim()) warnings.push('Next action is required when a blocker is recorded.')
    if (!project.blockerTargetResolutionDate) {
      warnings.push('Target resolution date is required when a blocker is recorded.')
    }
  }

  const needsRiskFields = gs === 'At Risk' || gs === 'Needs Escalation'
  if (needsRiskFields) {
    const rr = (project.riskReason ?? '').trim()
    if (rr.length < 10) warnings.push('Reason for risk must be at least 10 characters.')
    if (!project.targetResolutionDate) warnings.push('Target resolution date is required for this status.')
  }

  const needsEscalationByLabel = label === 'Needs Escalation'
  if (needsEscalationByLabel && project.escalationRecordRaised !== true) {
    warnings.push('Needs Escalation: escalation record not confirmed. Add or confirm a record.')
  }

  return warnings
}

function validateBlockerForm(f) {
  const errors = {}
  if (f.hasBlocker !== true && f.hasBlocker !== false) {
    errors.hasBlocker = 'Please confirm whether there is a blocker.'
  }
  if (f.hasBlocker !== true) return errors

  if (!(f.blocker ?? '').trim()) errors.blocker = 'Blocker description is required.'
  if (!(f.blockerOwner ?? '').trim()) errors.blockerOwner = 'Blocker owner is required.'
  if (!(f.nextAction ?? '').trim()) errors.nextAction = 'Next action is required.'
  if (!f.blockerTargetResolutionDate) {
    errors.blockerTargetResolutionDate = 'Target resolution date is required.'
  }
  return errors
}

function validateGovernanceForm(f) {
  const errors = {}
  const gs = f.governanceStatus || 'On Track'

  if (gs === 'At Risk' || gs === 'Needs Escalation') {
    const rr = (f.riskReason ?? '').trim()
    if (rr.length < 10) errors.riskReason = 'Enter at least 10 characters for the reason for risk.'
    if (!f.targetResolutionDate) errors.targetResolutionDate = 'Target resolution date is required.'
  }

  if (gs === 'Needs Escalation') {
    if (f.escalationRecordRaised !== true && f.escalationRecordRaised !== false) {
      errors.escalationRecordRaised = 'Please confirm whether an escalation record has been raised.'
    }
  }

  return errors
}

function needsEscalationRecordWarning(projectLike) {
  return (
    getStatus(projectLike).label === 'Needs Escalation' &&
    projectLike.escalationRecordRaised !== true
  )
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isOverdueProject(project) {
  const today = startOfDay(new Date())
  const due = startOfDay(parseDate(project.dueDate))
  return due.getTime() < today.getTime()
}

/** Stale = last governance update more than 7 calendar days ago */
function isStaleLastUpdated(lastUpdatedStr) {
  if (!lastUpdatedStr) return false
  const today = startOfDay(new Date())
  const u = startOfDay(parseDate(lastUpdatedStr))
  const diffDays = Math.round((today.getTime() - u.getTime()) / 86400000)
  return diffDays > 7
}

function getFreshness(lastUpdatedStr) {
  if (!lastUpdatedStr) return { label: '—', stale: false, variant: 'neutral' }
  const today = startOfDay(new Date())
  const u = startOfDay(parseDate(lastUpdatedStr))
  const diffDays = Math.round((today.getTime() - u.getTime()) / 86400000)
  if (diffDays <= 0) return { label: 'Updated today', stale: false, variant: 'today' }
  if (diffDays > 7) return { label: '⚠️ Stale update', stale: true, variant: 'stale' }
  return { label: `Updated ${diffDays} day${diffDays === 1 ? '' : 's'} ago`, stale: false, variant: 'recent' }
}

const cardShadow = 'shadow-[0_1px_2px_rgba(0,0,0,0.045),0_4px_12px_rgba(0,0,0,0.055)]'

/** Single split-workspace shell: lighter than stacked cards */
const workspaceShellShadow = 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]'

function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [filters, setFilters] = useState({
    status: 'All',
    owner: 'All',
    businessUnit: 'All',
  })
  const [searchQuery, setSearchQuery] = useState('')
  /** Attention strip drill-down */
  const [attentionFocus, setAttentionFocus] = useState(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createForm, setCreateForm] = useState(() => emptyCreateForm())
  const [createFieldErrors, setCreateFieldErrors] = useState({})
  const [createNotice, setCreateNotice] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletePhraseInput, setDeletePhraseInput] = useState('')
  const [deleteUndo, setDeleteUndo] = useState(null)
  const [raiseEscalationOpen, setRaiseEscalationOpen] = useState(false)
  const escalateResumeRef = useRef(null)
  const [editFieldErrors, setEditFieldErrors] = useState({})
  const [editGovernanceBanner, setEditGovernanceBanner] = useState('')

  useEffect(() => {
    document.title = 'Project Tracker'
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setProjects(INITIAL_DATA)
      } catch {
        setError('Unable to load project data. Please refresh and try again.')
      } finally {
        setLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!saveMessage) return undefined
    const timer = setTimeout(() => setSaveMessage(''), 2200)
    return () => clearTimeout(timer)
  }, [saveMessage])

  useEffect(() => {
    if (!createNotice) return undefined
    const timer = setTimeout(() => setCreateNotice(''), 2200)
    return () => clearTimeout(timer)
  }, [createNotice])

  useEffect(() => {
    if (!deleteUndo) return undefined
    const timer = setTimeout(() => setDeleteUndo(null), 8000)
    return () => clearTimeout(timer)
  }, [deleteUndo])

  useEffect(() => {
    if (!createDrawerOpen && !pendingDelete) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [createDrawerOpen, pendingDelete])

  useEffect(() => {
    if (!selectedProjectId) return undefined
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      if (createDrawerOpen || pendingDelete || raiseEscalationOpen) return
      setSelectedProjectId('')
      setIsEditing(false)
      setDraft(null)
      setEditFieldErrors({})
      setEditGovernanceBanner('')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedProjectId, createDrawerOpen, pendingDelete, raiseEscalationOpen])

  const decoratedProjects = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        tags: project.tags ?? [],
        derivedStatus: getStatus(project),
      })),
    [projects],
  )

  const owners = useMemo(
    () => [...new Set(decoratedProjects.map((project) => project.owner))].sort(),
    [decoratedProjects],
  )
  const businessUnits = useMemo(
    () => [...new Set(decoratedProjects.map((project) => project.businessUnit))].sort(),
    [decoratedProjects],
  )

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return decoratedProjects.filter((project) => {
      const statusMatch = filters.status === 'All' || project.derivedStatus.label === filters.status
      const ownerMatch = filters.owner === 'All' || project.owner === filters.owner
      const businessUnitMatch =
        filters.businessUnit === 'All' || project.businessUnit === filters.businessUnit
      const searchMatch = !q || project.name.toLowerCase().includes(q)

      if (attentionFocus === 'overdue' && !isOverdueProject(project)) return false
      if (attentionFocus === 'stale' && !isStaleLastUpdated(project.lastUpdated)) return false
      if (attentionFocus === 'escalation' && !project.escalationRequired) return false

      return statusMatch && ownerMatch && businessUnitMatch && searchMatch
    })
  }, [decoratedProjects, filters, searchQuery, attentionFocus])

  /** Portfolio-level counts (always all loaded projects) */
  const attention = useMemo(() => {
    let overdue = 0
    let stale = 0
    let escalations = 0
    for (const project of decoratedProjects) {
      if (isOverdueProject(project)) overdue += 1
      if (isStaleLastUpdated(project.lastUpdated)) stale += 1
      if (project.escalationRequired) escalations += 1
    }
    return { overdue, stale, escalations }
  }, [decoratedProjects])

  const summary = useMemo(() => {
    return filteredProjects.reduce(
      (acc, project) => {
        acc.total += 1
        if (project.derivedStatus.label === 'On Track') acc.onTrack += 1
        if (project.derivedStatus.label === 'At Risk') acc.atRisk += 1
        if (project.derivedStatus.label === 'Needs Escalation') acc.needsEscalation += 1
        return acc
      },
      { total: 0, onTrack: 0, atRisk: 0, needsEscalation: 0 },
    )
  }, [filteredProjects])

  const selectedProject = useMemo(
    () => decoratedProjects.find((project) => project.id === selectedProjectId) || null,
    [decoratedProjects, selectedProjectId],
  )

  function inferredGovernanceStatus(project) {
    if (project.governanceStatus) return project.governanceStatus
    const p = { ...project, governanceStatus: undefined }
    const lbl = getStatus(p).label
    if (lbl === 'Needs Escalation') return 'Needs Escalation'
    if (lbl === 'At Risk') return 'At Risk'
    return 'On Track'
  }

  function startEdit() {
    if (!selectedProject) return
    setEditFieldErrors({})
    setEditGovernanceBanner('')
    const hasBlocker = inferHasBlocker(selectedProject)
    setDraft({
      owner: selectedProject.owner,
      dueDate: selectedProject.dueDate,
      weeklyUpdate: selectedProject.weeklyUpdate,
      blocker: selectedProject.blocker,
      nextAction: selectedProject.nextAction,
      escalationRequired: selectedProject.escalationRequired,
      tags: [...(selectedProject.tags || [])],
      governanceStatus: inferredGovernanceStatus(selectedProject),
      riskReason: selectedProject.riskReason ?? '',
      targetResolutionDate: selectedProject.targetResolutionDate ?? '',
      escalationRecordRaised:
        selectedProject.escalationRecordRaised === true || selectedProject.escalationRecordRaised === false
          ? selectedProject.escalationRecordRaised
          : null,
      escalationRecordRef: selectedProject.escalationRecordRef ?? '',
      blockerOwner: selectedProject.blockerOwner ?? '',
      blockerTargetResolutionDate: selectedProject.blockerTargetResolutionDate ?? '',
      hasBlocker,
      allowIncompleteEscalationRecord: false,
    })
    setIsEditing(true)
  }

  function cancelEdit() {
    setDraft(null)
    setIsEditing(false)
    setEditFieldErrors({})
    setEditGovernanceBanner('')
  }

  function saveEdit() {
    if (!selectedProject || !draft) return

    if (draft.governanceStatus === 'Needs Escalation' && draft.escalationRecordRaised === false) {
      escalateResumeRef.current = (ref) => {
        setDraft((d) => ({
          ...d,
          escalationRecordRaised: true,
          escalationRecordRef: ref,
        }))
      }
      setRaiseEscalationOpen(true)
      return
    }

    const merged = normalizeBlockerForPersist({ ...selectedProject, ...draft })
    const errors = { ...validateGovernanceForm(merged), ...validateBlockerForm(merged) }
    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors)
      setEditGovernanceBanner('')
      return
    }

    if (needsEscalationRecordWarning(merged) && !draft.allowIncompleteEscalationRecord) {
      setEditGovernanceBanner(
        'This project is marked as needing escalation but has no escalation record. Add one?',
      )
      setEditFieldErrors({})
      return
    }

    const persisted = normalizeBlockerForPersist(draft)
    const today = new Date().toISOString().slice(0, 10)
    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              owner: persisted.owner,
              dueDate: persisted.dueDate,
              weeklyUpdate: persisted.weeklyUpdate,
              blocker: persisted.blocker,
              nextAction: persisted.nextAction,
              escalationRequired: persisted.governanceStatus === 'Needs Escalation',
              tags: [...(persisted.tags || [])].sort((a, b) => a.localeCompare(b)),
              lastUpdated: today,
              governanceStatus: persisted.governanceStatus,
              riskReason: persisted.riskReason?.trim() ?? '',
              targetResolutionDate: persisted.targetResolutionDate || '',
              escalationRecordRaised: persisted.escalationRecordRaised === true,
              escalationRecordRef: persisted.escalationRecordRef?.trim() ?? '',
              blockerOwner: persisted.blockerOwner,
              blockerTargetResolutionDate: persisted.blockerTargetResolutionDate,
              hasBlocker: persisted.hasBlocker,
            }
          : project,
      ),
    )
    setIsEditing(false)
    setDraft(null)
    setEditFieldErrors({})
    setEditGovernanceBanner('')
    setSaveMessage('Project update saved successfully.')
  }

  function clearFilters() {
    setFilters({ status: 'All', owner: 'All', businessUnit: 'All' })
    setSearchQuery('')
    setAttentionFocus(null)
  }

  function setStatusFilter(value) {
    setFilters((prev) => ({ ...prev, status: value }))
  }

  function toggleAttentionFocus(key) {
    setAttentionFocus((prev) => (prev === key ? null : key))
  }

  function applyStatusViewChip(kind) {
    setAttentionFocus(null)
    if (kind === 'all') {
      setFilters((prev) => ({ ...prev, status: 'All' }))
      return
    }
    if (kind === 'onTrack') {
      setFilters((prev) => ({ ...prev, status: 'On Track' }))
      return
    }
    if (kind === 'atRisk') {
      setFilters((prev) => ({ ...prev, status: 'At Risk' }))
      return
    }
    if (kind === 'needsEscalation') {
      setFilters((prev) => ({ ...prev, status: 'Needs Escalation' }))
    }
  }

  const chipAllActive =
    filters.status === 'All' && attentionFocus === null
  const chipOnTrackActive =
    filters.status === 'On Track' && attentionFocus === null
  const chipAtRiskActive =
    filters.status === 'At Risk' && attentionFocus === null
  const chipNeedsEscActive =
    filters.status === 'Needs Escalation' && attentionFocus === null

  function closeCreateDrawer() {
    setCreateDrawerOpen(false)
    setCreateForm(emptyCreateForm())
    setCreateFieldErrors({})
    setRaiseEscalationOpen(false)
    escalateResumeRef.current = null
  }

  function closeDetailPanel() {
    setSelectedProjectId('')
    setIsEditing(false)
    setDraft(null)
    setEditFieldErrors({})
    setEditGovernanceBanner('')
  }

  function openCreateDrawer() {
    setCreateForm(emptyCreateForm())
    setCreateFieldErrors({})
    setCreateDrawerOpen(true)
  }

  function submitCreateProject(formData) {
    if (formData.governanceStatus === 'Needs Escalation' && formData.escalationRecordRaised === false) {
      escalateResumeRef.current = (ref) => {
        setCreateForm((f) => ({
          ...f,
          escalationRecordRaised: true,
          escalationRecordRef: ref,
        }))
      }
      setRaiseEscalationOpen(true)
      return
    }

    const normalized = normalizeBlockerForPersist(formData)
    const errors = validateCreateForm(normalized)
    setCreateFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const today = new Date().toISOString().slice(0, 10)
    let newId = ''

    setProjects((prev) => {
      newId = generateProjectId(prev)
      const sortedTags = [...(normalized.tags || [])].sort((a, b) => a.localeCompare(b))
      const record = {
        id: newId,
        name: normalized.name.trim(),
        businessUnit: normalized.businessUnit.trim(),
        owner: normalized.owner.trim(),
        dueDate: normalized.dueDate,
        weeklyUpdate: normalized.weeklyUpdate.trim(),
        blocker: normalized.blocker,
        nextAction: normalized.nextAction.trim(),
        escalationRequired: normalized.governanceStatus === 'Needs Escalation',
        lastUpdated: today,
        tags: sortedTags,
        governanceStatus: normalized.governanceStatus,
        riskReason: (normalized.riskReason ?? '').trim(),
        targetResolutionDate: normalized.targetResolutionDate || '',
        escalationRecordRaised: normalized.escalationRecordRaised === true,
        escalationRecordRef: (normalized.escalationRecordRef ?? '').trim(),
        blockerOwner: normalized.blockerOwner,
        blockerTargetResolutionDate: normalized.blockerTargetResolutionDate,
        hasBlocker: normalized.hasBlocker,
      }
      return [...prev, record]
    })

    clearFilters()
    closeCreateDrawer()
    setCreateNotice('Project added successfully.')
    setSelectedProjectId(newId)
    setIsEditing(false)
    setDraft(null)
  }

  function openDeleteModal() {
    if (!selectedProject) return
    setPendingDelete({ id: selectedProject.id, name: selectedProject.name })
    setDeletePhraseInput('')
  }

  function cancelDeleteModal() {
    setPendingDelete(null)
    setDeletePhraseInput('')
  }

  function confirmDeleteProject() {
    if (deletePhraseInput !== 'DELETE' || !pendingDelete) return
    const snapshot = projects.find((p) => p.id === pendingDelete.id)
    if (!snapshot) {
      cancelDeleteModal()
      return
    }
    const backup = { ...snapshot }
    setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id))
    if (selectedProjectId === pendingDelete.id) {
      setSelectedProjectId('')
      setIsEditing(false)
      setDraft(null)
      setEditFieldErrors({})
      setEditGovernanceBanner('')
    }
    cancelDeleteModal()
    setDeleteUndo({ backup })
  }

  function undoDelete() {
    if (!deleteUndo?.backup) return
    const { backup } = deleteUndo
    setDeleteUndo(null)
    setProjects((prev) => {
      if (prev.some((p) => p.id === backup.id)) return prev
      return [...prev, backup]
    })
  }

  const shell = 'min-h-screen bg-page px-6 py-10 md:px-10 md:py-12'
  const container = 'mx-auto w-full max-w-[1400px]'

  if (error) {
    return (
      <div className={shell}>
        <main className={container}>
          <div
            className={`rounded-2xl border border-line bg-white p-8 ${cardShadow}`}
            role="alert"
          >
            <p className="text-sm font-medium text-status-red">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={shell}>
        <main className={container}>
          <div className={`rounded-2xl border border-line bg-white px-8 py-10 ${cardShadow}`}>
            <div className="flex items-center gap-3">
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-line border-t-ink-muted"
                aria-hidden
              />
              <p className="text-sm font-medium text-ink-muted">Loading Project Tracker…</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <>
      <div className={shell}>
        <main className={`${container} space-y-10`}>
          <header
            className={`relative overflow-hidden rounded-xl border border-line bg-white ${cardShadow}`}
          >
            <div className="h-[3px] bg-bank" aria-hidden />
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold leading-tight tracking-tight text-ink sm:text-xl">
                    Project Tracker
                  </h1>
                  <Link
                    to="/"
                    className="mt-1 inline-block text-[11px] font-semibold text-ink-muted underline-offset-4 hover:text-bank hover:underline sm:text-xs"
                  >
                    Concept overview
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={openCreateDrawer}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-bank px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
                  >
                    <span className="text-base font-normal leading-none" aria-hidden>
                      +
                    </span>
                    Add Project
                  </button>
                  <span className="inline-flex rounded-full border border-bank/20 bg-bank-tint px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-bank sm:px-3 sm:py-1">
                    Internal MVP
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-snug text-mid-grey sm:text-xs">
                <p className="font-medium text-ink-muted">
                  Commercial Banking Initiative Governance
                </p>
                <span className="hidden text-mid-grey/80 sm:inline" aria-hidden>
                  ·
                </span>
                <p className="tabular-nums">
                  {decoratedProjects.length} active initiative{decoratedProjects.length === 1 ? '' : 's'}
                </p>
                <span className="hidden text-mid-grey/80 sm:inline" aria-hidden>
                  ·
                </span>
                <p className="tabular-nums">
                  As at {formatCalendarDate(new Date())}
                </p>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total Active Projects" value={summary.total} tone="neutral" />
            <SummaryCard label="On Track" value={summary.onTrack} tone="green" />
            <SummaryCard label="At Risk" value={summary.atRisk} tone="amber" />
            <SummaryCard label="Needs Escalation" value={summary.needsEscalation} tone="red" />
          </section>

          {createNotice ? (
            <div
              className="rounded-xl border border-success-border bg-status-green-bg px-4 py-3 text-sm font-medium text-success-ink"
              role="status"
            >
              {createNotice}
            </div>
          ) : null}

          {deleteUndo ? (
            <div
              className="flex flex-col gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <p className="text-sm font-medium text-ink">
                <span className="font-semibold text-status-red">Project deleted.</span>{' '}
                You can restore it for a few seconds (this session only).
              </p>
              <button
                type="button"
                onClick={undoDelete}
                className="shrink-0 rounded-lg border border-bank bg-bank-tint px-4 py-2 text-sm font-semibold text-bank transition-colors hover:bg-bank/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
              >
                Undo
              </button>
            </div>
          ) : null}

        <section className={`rounded-2xl border border-line bg-white px-6 py-5 md:px-7 md:py-6 ${cardShadow}`}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-5 lg:gap-y-4">
              <div className="min-w-[11rem] flex-1">
                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onChange={(value) => setStatusFilter(value)}
                  options={['All', 'On Track', 'At Risk', 'Needs Escalation']}
                />
              </div>
              <div className="min-w-[11rem] flex-1">
                <FilterSelect
                  label="Owner"
                  value={filters.owner}
                  onChange={(value) => setFilters((prev) => ({ ...prev, owner: value }))}
                  options={['All', ...owners]}
                />
              </div>
              <div className="min-w-[12rem] flex-1">
                <FilterSelect
                  label="Business Unit"
                  value={filters.businessUnit}
                  onChange={(value) => setFilters((prev) => ({ ...prev, businessUnit: value }))}
                  options={['All', ...businessUnits]}
                />
              </div>
              <div className="flex w-full min-h-10 shrink-0 items-stretch lg:w-auto lg:min-w-[9.5rem]">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-mid-grey/35 hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <label className="relative block min-h-10 w-full" htmlFor="project-search">
                <span className="sr-only">Search projects</span>
                <span
                  className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-mid-grey"
                  aria-hidden
                >
                  <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                    />
                  </svg>
                </span>
                <input
                  id="project-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-line bg-surface-muted pl-10 pr-10 text-[13px] font-medium text-ink shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-colors placeholder:text-ink-muted/65 focus:border-bank focus:bg-white focus:ring-2 focus:ring-[color:var(--color-focus-ring)]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 z-[1] flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-mid-grey transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
                    aria-label="Clear search"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </label>
            </div>
          </div>
        </section>

        <section
          className={`overflow-hidden rounded-2xl border border-line bg-white ${workspaceShellShadow}`}
          aria-label="Project register and detail"
        >
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] xl:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-col border-b border-line xl:border-b-0 xl:border-r xl:border-line">
              <AttentionStrip
                attention={attention}
                priorWeekCounts={PORTFOLIO_GOVERNANCE_META.attentionPriorWeekCounts}
                activeFocus={attentionFocus}
                onToggle={toggleAttentionFocus}
              />
              <StatusViewTabs
                onSelect={applyStatusViewChip}
                chipAllActive={chipAllActive}
                chipOnTrackActive={chipOnTrackActive}
                chipAtRiskActive={chipAtRiskActive}
                chipNeedsEscActive={chipNeedsEscActive}
              />
              {filteredProjects.length === 0 ? (
                projects.length === 0 ? (
                  <NoProjectsRegisterEmptyState onAddProject={openCreateDrawer} />
                ) : (
                  <EmptyState onClearFilters={clearFilters} />
                )
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="min-w-[1120px] w-full border-collapse text-left text-[13px] leading-snug"
                    aria-label="Project register"
                  >
                    <thead className="sticky top-0 z-10 border-b border-line bg-surface-muted">
                      <tr className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
                        <Th>Project Name</Th>
                        <Th>Business Unit</Th>
                        <Th>Owner</Th>
                        <Th>Due Date</Th>
                        <Th>Status</Th>
                        <Th>Freshness</Th>
                        <Th>Blocker</Th>
                        <Th>Escalation</Th>
                        <Th>Next Action</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {filteredProjects.map((project, rowIndex) => {
                        const selected = selectedProjectId === project.id
                        const escalationRow = project.escalationRequired && !selected
                        const stripe = rowIndex % 2 === 1 && !selected && !escalationRow
                        const governanceWarnings = getGovernanceWarnings(project)
                        return (
                          <tr
                            key={project.id}
                            tabIndex={0}
                            aria-selected={selected ? true : false}
                            aria-label={`${project.name}, ${project.derivedStatus.label}. Press Enter to open details.`}
                            onClick={() => {
                              setSelectedProjectId(project.id)
                              setIsEditing(false)
                              setDraft(null)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setSelectedProjectId(project.id)
                                setIsEditing(false)
                                setDraft(null)
                              }
                            }}
                            className={`cursor-pointer border-l-[3px] outline-none transition-[background-color,border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)] focus-visible:ring-inset ${
                              selected
                                ? 'border-l-bank bg-bank-tint shadow-[inset_0_0_0_1px_rgba(219,0,17,0.08)] hover:bg-bank-tint'
                                : escalationRow
                                  ? 'border-l-bank/70 bg-bank-tint/55 hover:bg-bank-tint/75'
                                  : stripe
                                    ? 'border-l-transparent bg-surface-muted hover:bg-page'
                                    : 'border-l-transparent bg-white hover:bg-surface-muted'
                            }`}
                          >
                            <Td className="font-semibold text-ink">
                              <span className="inline-flex max-w-full items-center gap-1.5">
                                {governanceWarnings.length > 0 ? (
                                  <span
                                    className="shrink-0 cursor-default text-status-amber"
                                    title={governanceWarnings.join(' ')}
                                    aria-label={governanceWarnings.join(' ')}
                                  >
                                    ⚠
                                  </span>
                                ) : null}
                                <span className="min-w-0 truncate">{project.name}</span>
                              </span>
                            </Td>
                            <Td
                              className="max-w-[12rem] truncate text-ink-muted"
                              title={project.businessUnit}
                            >
                              {project.businessUnit}
                            </Td>
                            <Td className="max-w-[10rem] truncate text-ink-muted" title={project.owner}>
                              {project.owner}
                            </Td>
                            <Td className="whitespace-nowrap tabular-nums text-ink-muted">
                              {formatDate(project.dueDate)}
                            </Td>
                            <Td>
                              <StatusBadge status={project.derivedStatus} />
                            </Td>
                            <Td>
                              <FreshnessLabel lastUpdated={project.lastUpdated} />
                            </Td>
                            <Td>
                              <BooleanChip active={inferHasBlocker(project)} />
                            </Td>
                            <Td>
                              <EscalationChip required={project.escalationRequired} />
                            </Td>
                            <Td
                              className="max-w-[12rem] truncate text-ink-muted"
                              title={project.nextAction}
                            >
                              {project.nextAction}
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="flex min-h-0 min-w-0 flex-col bg-surface-muted/35 xl:max-h-[calc(100vh-7.5rem)] xl:bg-white xl:sticky xl:top-24 xl:self-start">
              {!selectedProject ? (
                <DetailPanelEmptyState />
              ) : (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <div className="h-px shrink-0 bg-bank/20" aria-hidden />
                  <DetailPanel
                    project={selectedProject}
                    isEditing={isEditing}
                    draft={draft}
                    onDraftChange={setDraft}
                    onClearGovernanceEditErrors={(keys) => {
                      setEditFieldErrors((prev) => {
                        const next = { ...prev }
                        for (const k of keys) delete next[k]
                        return next
                      })
                    }}
                    onEdit={startEdit}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    onClose={closeDetailPanel}
                    onRequestDelete={openDeleteModal}
                    saveMessage={saveMessage}
                    freshness={getFreshness(selectedProject.lastUpdated)}
                    editFieldErrors={editFieldErrors}
                    editGovernanceBanner={editGovernanceBanner}
                    onDismissGovernanceBanner={() => setEditGovernanceBanner('')}
                    onAllowIncompleteEscalationRecord={() => {
                      setDraft((d) => (d ? { ...d, allowIncompleteEscalationRecord: true } : d))
                      setEditGovernanceBanner('')
                    }}
                    onOpenRaiseEscalationRecord={() => {
                      escalateResumeRef.current = (ref) => {
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                escalationRecordRaised: true,
                                escalationRecordRef: ref,
                              }
                            : d,
                        )
                      }
                      setRaiseEscalationOpen(true)
                      setEditGovernanceBanner('')
                    }}
                  />
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>

      <CreateProjectDrawer
        open={createDrawerOpen}
        form={createForm}
        setForm={setCreateForm}
        fieldErrors={createFieldErrors}
        setFieldErrors={setCreateFieldErrors}
        businessUnitOptions={businessUnits}
        onClose={closeCreateDrawer}
        onSubmit={submitCreateProject}
      />

      {pendingDelete ? (
        <DeleteProjectModal
          projectName={pendingDelete.name}
          confirmInput={deletePhraseInput}
          onConfirmInputChange={setDeletePhraseInput}
          onCancel={cancelDeleteModal}
          onConfirm={confirmDeleteProject}
          canDelete={deletePhraseInput === 'DELETE'}
        />
      ) : null}

      {raiseEscalationOpen ? (
        <RaiseEscalationModal
          onClose={() => {
            setRaiseEscalationOpen(false)
            escalateResumeRef.current = null
          }}
          onSubmit={(ref) => {
            const fn = escalateResumeRef.current
            escalateResumeRef.current = null
            setRaiseEscalationOpen(false)
            fn?.(ref)
          }}
        />
      ) : null}
    </>
  )
}

function BlockerFieldsSection({ values, onPatch, fieldErrors, idPrefix = 'blocker' }) {
  const yesNoBtn =
    'rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank'
  const yesActive = 'border-bank bg-bank-tint text-bank'
  const yesInactive = 'border-line bg-white text-ink-muted hover:bg-page'

  function setHasBlocker(next) {
    if (next === false) {
      onPatch({ hasBlocker: false, ...emptyBlockerDetailFields() })
      return
    }
    onPatch({ hasBlocker: true })
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface-muted/50 px-4 py-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">Blocker</p>
        <p className="mt-2 text-[12px] font-semibold text-ink">Is there a blocker?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setHasBlocker(true)}
            className={`${yesNoBtn} ${values.hasBlocker === true ? yesActive : yesInactive}`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setHasBlocker(false)}
            className={`${yesNoBtn} ${values.hasBlocker === false ? yesActive : yesInactive}`}
          >
            No
          </button>
        </div>
        {fieldErrors?.hasBlocker ? (
          <p className="mt-2 text-[12px] font-medium text-status-red">{fieldErrors.hasBlocker}</p>
        ) : null}
      </div>
      {values.hasBlocker === true ? (
        <div className="space-y-4 border-t border-line pt-4">
          <TextAreaField
            label="Blocker description"
            value={values.blocker ?? ''}
            onChange={(v) => onPatch({ blocker: v })}
            error={fieldErrors?.blocker}
            rows={3}
            placeholder="Awaiting legal documentation clearance before merchant onboarding can proceed."
          />
          <InputField
            label="Blocker owner"
            id={`${idPrefix}-blocker-owner`}
            value={values.blockerOwner ?? ''}
            onChange={(v) => onPatch({ blockerOwner: v })}
            error={fieldErrors?.blockerOwner}
            helpText="Person responsible for clearing this blocker"
            helperSentence="This may be different from the project owner."
          />
          <TextAreaField
            label="Next action"
            value={values.nextAction ?? ''}
            onChange={(v) => onPatch({ nextAction: v })}
            error={fieldErrors?.nextAction}
            rows={2}
            placeholder="Recheck pending legal documents and confirm missing items with compliance team."
          />
          <InputField
            label="Target resolution date"
            id={`${idPrefix}-blocker-target-resolution`}
            type="date"
            value={values.blockerTargetResolutionDate ?? ''}
            onChange={(v) => onPatch({ blockerTargetResolutionDate: v })}
            error={fieldErrors?.blockerTargetResolutionDate}
          />
        </div>
      ) : null}
    </div>
  )
}

function TagPicker({ selected, onChange }) {
  function toggle(tag) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag].sort((a, b) => a.localeCompare(b)))
    }
  }
  return (
    <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Tags</p>
      <p className="mt-1 text-[12px] leading-snug text-ink-muted">
        Select applicable categories (optional).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TAG_OPTIONS.map((tag) => {
          const active = selected.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank ${
                active
                  ? 'border-bank/40 bg-bank-tint text-bank'
                  : 'border-line bg-white text-ink-muted hover:border-mid-grey/45 hover:text-ink'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RaiseEscalationModal({ onClose, onSubmit }) {
  const [refValue, setRefValue] = useState('')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const r = refValue.trim()
    if (!r) return
    onSubmit(r)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close escalation form"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-escalation-title"
        className={`relative z-10 w-full max-w-md rounded-2xl border border-line bg-white p-6 md:p-7 ${cardShadow}`}
      >
        <h2 id="raise-escalation-title" className="text-[1.125rem] font-semibold leading-snug text-ink">
          Raise escalation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Enter the escalation register reference or ticket ID. This will be stored on the project.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <InputField
            label="Escalation record reference"
            id="raise-esc-ref"
            value={refValue}
            onChange={setRefValue}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-bank px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
            >
              Save record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateProjectDrawer({
  open,
  form,
  setForm,
  fieldErrors,
  setFieldErrors,
  businessUnitOptions,
  onClose,
  onSubmit,
}) {
  const buListId = 'create-project-bu-suggestions'

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function patchForm(updates) {
    setForm((prev) => ({ ...prev, ...updates }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(updates)) delete next[k]
      return next
    })
  }

  function toggleCreateTag(tag) {
    setForm((prev) => {
      const list = prev.tags || []
      const has = list.includes(tag)
      const tags = has
        ? list.filter((t) => t !== tag)
        : [...list, tag].sort((a, b) => a.localeCompare(b))
      return { ...prev, tags }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="presentation">
      <button
        type="button"
        className="min-h-0 min-w-0 flex-1 cursor-default border-0 bg-black/20 p-0"
        aria-label="Close create project panel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className={`flex h-full max-h-[100dvh] w-full max-w-md shrink-0 flex-col border-l border-line border-t-[3px] border-t-bank bg-white ${cardShadow}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 md:px-7">
          <h2 id="create-project-title" className="text-[1.125rem] font-semibold leading-snug text-ink">
            Add project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-mid-grey transition-colors hover:border-mid-grey/45 hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
            aria-label="Close"
          >
            <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 md:px-7">
            {Object.keys(fieldErrors).length > 0 ? (
              <div
                role="alert"
                className="rounded-lg border border-status-red/25 bg-status-red-bg px-3 py-2.5 text-[13px] font-medium text-status-red"
              >
                Please complete all required fields marked below.
              </div>
            ) : null}
          <InputField
            label="Project name"
            id="create-name"
            value={form.name}
            onChange={(v) => patchForm({ name: v })}
            error={fieldErrors.name}
          />
          <datalist id={buListId}>
            {businessUnitOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          <InputField
            label="Business unit / department"
            id="create-bu"
            list={buListId}
            value={form.businessUnit}
            onChange={(v) => patchForm({ businessUnit: v })}
            error={fieldErrors.businessUnit}
          />
          <InputField
            label="Owner"
            id="create-owner"
            value={form.owner}
            onChange={(v) => patchForm({ owner: v })}
            error={fieldErrors.owner}
          />
          <InputField
            label="Due date"
            id="create-due"
            type="date"
            value={form.dueDate}
            onChange={(v) => patchForm({ dueDate: v })}
            error={fieldErrors.dueDate}
          />
          <BlockerFieldsSection
            values={form}
            onPatch={patchForm}
            fieldErrors={fieldErrors}
            idPrefix="create"
          />
          {form.hasBlocker !== true ? (
            <TextAreaField
              label="Next action"
              value={form.nextAction}
              onChange={(v) => patchForm({ nextAction: v })}
              error={fieldErrors.nextAction}
              rows={2}
            />
          ) : null}
          <label className="flex w-full flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
              Governance status
            </span>
            <select
              value={form.governanceStatus || 'On Track'}
              onChange={(e) => {
                const v = e.target.value
                patchForm({
                  governanceStatus: v,
                  escalationRequired: v === 'Needs Escalation',
                  escalationRecordRaised: v === 'Needs Escalation' ? form.escalationRecordRaised : null,
                })
              }}
              className="h-10 w-full cursor-pointer rounded-lg border border-line bg-white px-3 text-[13px] font-medium text-ink outline-none transition-colors focus-visible:border-bank focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
            >
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Needs Escalation">Needs Escalation</option>
            </select>
          </label>
          {(form.governanceStatus === 'At Risk' || form.governanceStatus === 'Needs Escalation') && (
            <>
              <TextAreaField
                label="Reason for risk"
                value={form.riskReason ?? ''}
                onChange={(v) => patchForm({ riskReason: v })}
                error={fieldErrors.riskReason}
                rows={3}
              />
              <InputField
                label="Target resolution date"
                id="create-target-resolution"
                type="date"
                value={form.targetResolutionDate ?? ''}
                onChange={(v) => patchForm({ targetResolutionDate: v })}
                error={fieldErrors.targetResolutionDate}
              />
            </>
          )}
          {form.governanceStatus === 'Needs Escalation' ? (
            <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
              <p className="text-[12px] font-semibold text-ink">Have you raised an escalation record?</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => patchForm({ escalationRecordRaised: true })}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank ${
                    form.escalationRecordRaised === true
                      ? 'border-bank bg-bank-tint text-bank'
                      : 'border-line bg-white text-ink-muted hover:bg-page'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => patchForm({ escalationRecordRaised: false })}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank ${
                    form.escalationRecordRaised === false
                      ? 'border-bank bg-bank-tint text-bank'
                      : 'border-line bg-white text-ink-muted hover:bg-page'
                  }`}
                >
                  No
                </button>
              </div>
              {fieldErrors.escalationRecordRaised ? (
                <p className="mt-2 text-[12px] font-medium text-status-red">{fieldErrors.escalationRecordRaised}</p>
              ) : null}
            </div>
          ) : null}
          <TextAreaField
            label="Weekly update (optional)"
            value={form.weeklyUpdate}
            onChange={(v) => patchForm({ weeklyUpdate: v })}
            rows={3}
          />
          <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Tags</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-muted">Optional — select all that apply.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const active = (form.tags || []).includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleCreateTag(tag)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank ${
                      active
                        ? 'border-bank/40 bg-bank-tint text-bank'
                        : 'border-line bg-white text-ink-muted hover:border-mid-grey/45 hover:text-ink'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-line bg-white px-6 py-4 md:px-7 sm:flex-row sm:gap-3">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-bank px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
            >
              Add project
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatAttentionWeekDelta(current, prior) {
  if (prior == null) return { text: '—', className: 'text-mid-grey' }
  const d = current - prior
  if (d > 0) return { text: `+${d}`, className: 'font-semibold text-bank' }
  if (d < 0) return { text: String(d), className: 'font-semibold text-status-green' }
  return { text: '0', className: 'font-medium text-mid-grey' }
}

function AttentionStrip({ attention, priorWeekCounts, activeFocus, onToggle }) {
  return (
    <div className="border-b border-line bg-surface-muted px-5 py-3.5 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mid-grey">
        Attention required
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <AttentionMetric
          kind="overdue"
          count={attention.overdue}
          priorCount={priorWeekCounts?.overdue ?? null}
          active={activeFocus === 'overdue'}
          onToggle={() => onToggle('overdue')}
        />
        <AttentionMetric
          kind="stale"
          count={attention.stale}
          priorCount={priorWeekCounts?.stale ?? null}
          active={activeFocus === 'stale'}
          onToggle={() => onToggle('stale')}
        />
        <AttentionMetric
          kind="escalation"
          count={attention.escalations}
          priorCount={priorWeekCounts?.escalations ?? null}
          active={activeFocus === 'escalation'}
          onToggle={() => onToggle('escalation')}
        />
      </div>
    </div>
  )
}

function AttentionMetric({ kind, count, priorCount, active, onToggle }) {
  const label =
    kind === 'overdue' ? 'Overdue' : kind === 'stale' ? 'Stale updates' : 'Escalations'
  const warn = count > 0
  const delta = formatAttentionWeekDelta(count, priorCount)
  const base =
    'inline-flex min-w-[8.5rem] items-center justify-between gap-4 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank'
  const tone = active
    ? 'border-2 border-bank bg-bank-tint shadow-[inset_0_0_0_1px_rgba(219,0,17,0.12)]'
    : warn
      ? 'border border-status-amber/40 bg-status-amber-bg/50 hover:bg-status-amber-bg'
      : 'border border-line bg-white hover:bg-surface-muted'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`${base} ${tone} ${cardShadow}`}
    >
      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      <span className="flex items-baseline gap-2 tabular-nums">
        <span
          className={`text-lg font-bold leading-none ${warn && kind !== 'stale' ? 'text-bank' : warn ? 'text-status-amber' : 'text-ink'}`}
        >
          {count}
        </span>
        <span className={`text-[11px] leading-none ${delta.className}`}>{delta.text}</span>
      </span>
    </button>
  )
}

function StatusViewTabs({
  onSelect,
  chipAllActive,
  chipOnTrackActive,
  chipAtRiskActive,
  chipNeedsEscActive,
}) {
  const chipBase =
    'rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank'
  const inactive =
    'border-line bg-white text-ink-muted hover:border-mid-grey/40 hover:bg-surface-muted hover:text-ink'
  const active =
    'border-bank bg-bank-tint text-bank shadow-[inset_0_0_0_1px_rgba(219,0,17,0.12)]'
  return (
    <div
      className="flex flex-wrap gap-2 border-b border-line bg-white px-5 py-3 md:px-6"
      role="tablist"
      aria-label="Project status view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={chipAllActive}
        onClick={() => onSelect('all')}
        className={`${chipBase} ${chipAllActive ? active : inactive}`}
      >
        All Projects
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={chipOnTrackActive}
        onClick={() => onSelect('onTrack')}
        className={`${chipBase} ${chipOnTrackActive ? active : inactive}`}
      >
        On Track
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={chipAtRiskActive}
        onClick={() => onSelect('atRisk')}
        className={`${chipBase} ${chipAtRiskActive ? active : inactive}`}
      >
        At Risk
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={chipNeedsEscActive}
        onClick={() => onSelect('needsEscalation')}
        className={`${chipBase} ${chipNeedsEscActive ? active : inactive}`}
      >
        Needs Escalation
      </button>
    </div>
  )
}

function FreshnessLabel({ lastUpdated }) {
  const f = getFreshness(lastUpdated)
  const cls =
    f.variant === 'stale'
      ? 'text-status-amber'
      : f.variant === 'today'
        ? 'text-status-green'
        : 'text-ink-muted'
  return (
    <span className={`text-[12px] font-medium leading-snug ${cls}`}>
      {f.variant === 'today' ? '✓ ' : ''}
      {f.label}
    </span>
  )
}

function SummaryCard({ label, value, tone }) {
  const leftAccent = {
    neutral: 'border-l-mid-grey',
    green: 'border-l-status-green',
    amber: 'border-l-status-amber',
    red: 'border-l-bank',
  }

  return (
    <article
      className={`rounded-2xl border border-line bg-white p-5 ${cardShadow} border-l-[3px] ${leftAccent[tone]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mid-grey">{label}</p>
      <p className="mt-3 text-[1.75rem] font-bold tabular-nums leading-none tracking-tight text-ink md:text-[2rem]">
        {value}
      </p>
    </article>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white bg-[length:0.875rem] bg-[right_0.65rem_center] bg-no-repeat px-3 pr-9 text-[13px] font-medium text-ink outline-none transition-colors hover:border-mid-grey/45 focus-visible:border-bank focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239fa1a4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function StatusBadge({ status }) {
  const styles = {
    red: 'border border-bank/20 bg-bank-tint text-bank',
    amber: 'border border-status-amber/15 bg-status-amber-bg text-status-amber',
    green: 'border border-[rgba(15,123,15,0.18)] bg-status-green-bg text-status-green',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-tight ${styles[status.key]}`}
    >
      {status.label}
    </span>
  )
}

function BooleanChip({ active }) {
  return (
    <span
      className={`inline-flex min-w-[2.25rem] justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        active
          ? 'border-line bg-surface-muted text-ink'
          : 'border-line bg-white text-mid-grey'
      }`}
    >
      {active ? 'Yes' : 'No'}
    </span>
  )
}

function EscalationChip({ required }) {
  if (required) {
    return (
      <span className="inline-flex rounded-full border border-line bg-bank-tint px-2 py-0.5 text-[11px] font-semibold text-bank">
        Required
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
      No
    </span>
  )
}

function EmptyState({ onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className={`w-full max-w-md rounded-2xl border border-line bg-white px-8 py-10 ${cardShadow}`}>
        <p className="text-[15px] font-semibold text-ink">No projects match the selected filters</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Try adjusting your search or filters to see more results
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 w-full rounded-lg bg-bank py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}

function NoProjectsRegisterEmptyState({ onAddProject }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className={`w-full max-w-md rounded-2xl border border-line bg-white px-8 py-10 ${cardShadow}`}>
        <p className="text-[15px] font-semibold text-ink">No projects in the register</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          There are no initiatives loaded for this session. Add a project to continue, or refresh the page to reload
          the default sample register.
        </p>
        <button
          type="button"
          onClick={onAddProject}
          className="mt-6 w-full rounded-lg bg-bank py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
        >
          + Add Project
        </button>
      </div>
    </div>
  )
}

function DeleteProjectModal({
  projectName,
  confirmInput,
  onConfirmInputChange,
  onCancel,
  onConfirm,
  canDelete,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Dismiss delete confirmation"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className={`relative z-10 w-full max-w-md rounded-2xl border border-line bg-white p-6 md:p-7 ${cardShadow}`}
      >
        <h2 id="delete-modal-title" className="text-[1.125rem] font-semibold leading-snug text-ink">
          Delete this project?
        </h2>
        <div id="delete-modal-desc" className="mt-3 space-y-3 text-sm leading-relaxed text-ink-muted">
          <p>
            You are about to permanently remove{' '}
            <span className="font-semibold text-ink">{projectName}</span> from this governance register for the
            current browser session.
          </p>
          <p className="font-medium text-status-red">
            This cannot be undone except by using Undo on the banner that appears after deletion (for a few seconds
            only). Refreshing the page will reload the default sample data and any session-only changes will be lost.
          </p>
        </div>
        <label className="mt-6 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
            Type DELETE to enable deletion
          </span>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => onConfirmInputChange(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-10 rounded-lg border border-line bg-surface-muted px-3 font-mono text-[13px] font-semibold uppercase tracking-wide text-ink outline-none transition-colors focus:border-bank focus:bg-white focus:ring-2 focus:ring-[color:var(--color-focus-ring)]"
            placeholder="DELETE"
            aria-invalid={confirmInput.length > 0 && !canDelete}
          />
        </label>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={onConfirm}
            className="rounded-lg bg-status-red px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-red"
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailPanelEmptyState() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center xl:min-h-0 xl:py-10"
      role="status"
    >
      <div className="mx-auto max-w-[16rem]">
        <div
          className="mx-auto flex size-10 items-center justify-center rounded-xl border border-line bg-surface-muted text-mid-grey"
          aria-hidden
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="mt-4 text-[13px] font-semibold text-ink-muted">No project selected</p>
        <p className="mt-1.5 text-[12px] leading-snug text-mid-grey">
          Select a project to review status, blockers, ownership, and next actions.
        </p>
      </div>
    </div>
  )
}

function DetailPanel({
  project,
  isEditing,
  draft,
  onDraftChange,
  onClearGovernanceEditErrors,
  onEdit,
  onCancel,
  onSave,
  onClose,
  onRequestDelete,
  saveMessage,
  freshness,
  editFieldErrors,
  editGovernanceBanner,
  onDismissGovernanceBanner,
  onAllowIncompleteEscalationRecord,
  onOpenRaiseEscalationRecord,
}) {
  const status = project.derivedStatus

  function patchDraft(updates) {
    onDraftChange((prev) => ({ ...prev, ...updates }))
    onClearGovernanceEditErrors?.(Object.keys(updates))
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-start gap-3 border-b border-line bg-surface-muted/40 px-5 py-4 md:px-6">
        <div className="min-w-0 flex-1 border-l-2 border-l-bank/25 pl-3.5 pr-2">
          <h2 className="text-[1.05rem] font-semibold leading-snug text-ink">{project.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-mid-grey transition-colors hover:border-mid-grey/50 hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
          aria-label="Close detail panel"
        >
          <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
        {saveMessage ? (
          <div
            className="mb-5 rounded-lg border border-success-border bg-status-green-bg px-3 py-2 text-[13px] font-medium text-success-ink"
            role="status"
          >
            {saveMessage}
          </div>
        ) : null}

        {!isEditing ? (
          <div className="space-y-4">
            <Field label="Project Name" value={project.name} />
            <Field label="Business Unit" value={project.businessUnit} />
            <Field label="Owner" value={project.owner} />
            <Field label="Due Date" value={formatDate(project.dueDate)} />
            <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">Status</p>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>
            {(project.governanceStatus || '').trim() ? (
              <Field label="Governance status (recorded)" value={project.governanceStatus} />
            ) : null}
            {(project.riskReason ?? '').trim() ? (
              <Field label="Reason for risk" value={project.riskReason} />
            ) : null}
            {project.targetResolutionDate ? (
              <Field label="Target resolution date" value={formatDate(project.targetResolutionDate)} />
            ) : null}
            <Field label="Weekly Update" value={project.weeklyUpdate} />
            <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">Blocker</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
                Is there a blocker?
              </p>
              <div className="mt-2">
                <BooleanChip active={inferHasBlocker(project)} />
              </div>
            </div>
            {inferHasBlocker(project) ? (
              <>
                <Field label="Blocker description" value={project.blocker} />
                <Field
                  label="Blocker owner"
                  value={(project.blockerOwner ?? '').trim() || '—'}
                />
                <Field label="Next action" value={project.nextAction} />
                <Field
                  label="Target resolution date"
                  value={
                    project.blockerTargetResolutionDate
                      ? formatDate(project.blockerTargetResolutionDate)
                      : '—'
                  }
                />
              </>
            ) : (
              <Field label="Next Action" value={project.nextAction} />
            )}
            <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
                Escalation required
              </p>
              <div className="mt-2">
                <EscalationChip required={project.escalationRequired} />
              </div>
            </div>
            {project.escalationRecordRaised === true || project.escalationRecordRaised === false ? (
              <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
                  Escalation record raised
                </p>
                <div className="mt-2">
                  <BooleanChip active={project.escalationRecordRaised === true} />
                </div>
              </div>
            ) : null}
            {(project.escalationRecordRef ?? '').trim() ? (
              <Field label="Escalation record reference" value={project.escalationRecordRef} />
            ) : null}
            <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">Tags</p>
              <div className="mt-2">
                {(project.tags || []).length === 0 ? (
                  <p className="text-[13px] font-medium text-ink-muted">None</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(project.tags || []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`rounded-xl border border-line px-4 py-3 ${
                freshness.variant === 'stale'
                  ? 'bg-status-amber-bg/40'
                  : freshness.variant === 'today'
                    ? 'bg-status-green-bg/50'
                    : 'bg-surface-muted'
              }`}
            >
              <p className="text-[13px] font-semibold text-ink">
                Last updated: {formatDate(project.lastUpdated)}
              </p>
              <p
                className={`mt-1.5 text-[12px] font-medium ${
                  freshness.variant === 'stale'
                    ? 'text-status-amber'
                    : freshness.variant === 'today'
                      ? 'text-status-green'
                      : 'text-ink-muted'
                }`}
              >
                {freshness.variant === 'today' ? '✓ ' : ''}
                {freshness.label}
              </p>
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="mt-2 w-full rounded-lg bg-bank px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
            >
              Edit
            </button>
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mid-grey">Danger zone</p>
              <button
                type="button"
                onClick={onRequestDelete}
                className="mt-3 w-full rounded-lg border border-status-red/40 bg-white px-4 py-2.5 text-sm font-semibold text-status-red transition-colors hover:bg-status-red-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-red"
              >
                Delete project
              </button>
            </div>
          </div>
        ) : draft ? (
          <div className="space-y-4">
            <InputField
              label="Owner"
              id="edit-owner"
              value={draft.owner}
              onChange={(value) => patchDraft({ owner: value })}
            />
            <InputField
              label="Due Date"
              id="edit-due"
              type="date"
              value={draft.dueDate}
              onChange={(value) => patchDraft({ dueDate: value })}
            />
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
                Governance status
              </span>
              <select
                value={draft.governanceStatus || 'On Track'}
                onChange={(e) => {
                  const v = e.target.value
                  onDraftChange((prev) => ({
                    ...prev,
                    governanceStatus: v,
                    escalationRequired: v === 'Needs Escalation',
                    escalationRecordRaised: v === 'Needs Escalation' ? prev.escalationRecordRaised : null,
                  }))
                  onClearGovernanceEditErrors?.([
                    'governanceStatus',
                    'escalationRequired',
                    'escalationRecordRaised',
                    'riskReason',
                    'targetResolutionDate',
                  ])
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-line bg-white px-3 text-[13px] font-medium text-ink outline-none transition-colors focus-visible:border-bank focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Needs Escalation">Needs Escalation</option>
              </select>
            </label>
            {(draft.governanceStatus === 'At Risk' || draft.governanceStatus === 'Needs Escalation') && (
              <>
                <TextAreaField
                  label="Reason for risk"
                  value={draft.riskReason ?? ''}
                  onChange={(value) => patchDraft({ riskReason: value })}
                  error={editFieldErrors?.riskReason}
                  rows={3}
                />
                <InputField
                  label="Target resolution date"
                  id="edit-target-resolution"
                  type="date"
                  value={draft.targetResolutionDate ?? ''}
                  onChange={(value) => patchDraft({ targetResolutionDate: value })}
                  error={editFieldErrors?.targetResolutionDate}
                />
              </>
            )}
            {draft.governanceStatus === 'Needs Escalation' ? (
              <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
                <p className="text-[12px] font-semibold text-ink">Have you raised an escalation record?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => patchDraft({ escalationRecordRaised: true })}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank ${
                      draft.escalationRecordRaised === true
                        ? 'border-bank bg-bank-tint text-bank'
                        : 'border-line bg-white text-ink-muted hover:bg-page'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => patchDraft({ escalationRecordRaised: false })}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank ${
                      draft.escalationRecordRaised === false
                        ? 'border-bank bg-bank-tint text-bank'
                        : 'border-line bg-white text-ink-muted hover:bg-page'
                    }`}
                  >
                    No
                  </button>
                </div>
                {editFieldErrors?.escalationRecordRaised ? (
                  <p className="mt-2 text-[12px] font-medium text-status-red">
                    {editFieldErrors.escalationRecordRaised}
                  </p>
                ) : null}
              </div>
            ) : null}
            <TextAreaField
              label="Weekly Update"
              value={draft.weeklyUpdate}
              onChange={(value) => patchDraft({ weeklyUpdate: value })}
            />
            <BlockerFieldsSection
              values={draft}
              onPatch={patchDraft}
              fieldErrors={editFieldErrors}
              idPrefix="edit"
            />
            {draft.hasBlocker !== true ? (
              <TextAreaField
                label="Next Action"
                value={draft.nextAction}
                onChange={(value) => patchDraft({ nextAction: value })}
                error={editFieldErrors?.nextAction}
              />
            ) : null}
            <TagPicker
              selected={draft.tags || []}
              onChange={(tags) => onDraftChange((prev) => ({ ...prev, tags }))}
            />
            {editGovernanceBanner ? (
              <div
                role="alert"
                className="rounded-lg border border-status-amber/35 bg-status-amber-bg/40 px-3 py-3 text-[13px] leading-relaxed text-ink"
              >
                <p className="font-medium">{editGovernanceBanner}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={onOpenRaiseEscalationRecord}
                    className="rounded-lg bg-bank px-3 py-2 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
                  >
                    Add escalation record
                  </button>
                  <button
                    type="button"
                    onClick={onAllowIncompleteEscalationRecord}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-muted"
                  >
                    Save without record
                  </button>
                  <button
                    type="button"
                    onClick={onDismissGovernanceBanner}
                    className="rounded-lg border border-transparent px-3 py-2 text-[12px] font-semibold text-ink-muted underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={onSave}
                className="flex-1 rounded-lg bg-bank px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-mid-grey">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-ink">{value}</p>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  list,
  id,
  placeholder,
  helpText,
  helperSentence,
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">{label}</span>
      {helpText ? <p className="text-[12px] leading-snug text-ink-muted">{helpText}</p> : null}
      <input
        id={inputId}
        list={list}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 rounded-lg border bg-white px-3 text-[13px] font-medium text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-bank focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)] ${
          error ? 'border-status-red focus-visible:border-status-red' : 'border-line'
        }`}
      />
      {helperSentence ? (
        <p className="text-[12px] leading-snug text-ink-muted">{helperSentence}</p>
      ) : null}
      {error ? <p className="text-[12px] font-medium text-status-red">{error}</p> : null}
    </label>
  )
}

function TextAreaField({ label, value, onChange, error, rows = 3, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`resize-y rounded-lg border bg-white px-3 py-2.5 text-[13px] font-medium leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-bank focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)] ${
          error ? 'border-status-red focus-visible:border-status-red' : 'border-line'
        }`}
      />
      {error ? <p className="text-[12px] font-medium text-status-red">{error}</p> : null}
    </label>
  )
}

function Th({ children }) {
  return <th className="whitespace-nowrap px-4 py-3.5 first:pl-5 last:pr-5">{children}</th>
}

function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 align-middle first:pl-5 last:pr-5 ${className}`}>{children}</td>
  )
}

export default Dashboard
