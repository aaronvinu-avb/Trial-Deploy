import { useEffect, useId, useMemo, useState } from 'react'
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
  }
}

function validateCreateForm(form) {
  const f = form || {}
  const errors = {}
  if (!(f.name || '').trim()) errors.name = 'Please enter a project name.'
  if (!(f.businessUnit || '').trim()) errors.businessUnit = 'Please enter or select a business unit.'
  if (!(f.owner || '').trim()) errors.owner = 'Please enter an owner.'
  if (!f.dueDate) errors.dueDate = 'Please choose a due date.'
  if (!(f.nextAction || '').trim()) errors.nextAction = 'Please describe the next action.'
  return errors
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

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseDate(value))
}

function getStatus(project) {
  const today = startOfDay(new Date())
  const due = startOfDay(parseDate(project.dueDate))
  const msPerDay = 86400000
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / msPerDay)

  // 1. Red: due date before today OR escalation required
  if (due.getTime() < today.getTime() || project.escalationRequired) {
    return { key: 'red', label: 'Needs Escalation' }
  }

  // 2. Amber: non-empty blocker OR due within 7 calendar days (today … +7)
  const dueWithinSevenDays = daysUntilDue >= 0 && daysUntilDue <= 7
  if ((project.blocker ?? '').trim() || dueWithinSevenDays) {
    return { key: 'amber', label: 'At Risk' }
  }

  // 3. Green
  return { key: 'green', label: 'On Track' }
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

  function startEdit() {
    if (!selectedProject) return
    setDraft({
      owner: selectedProject.owner,
      dueDate: selectedProject.dueDate,
      weeklyUpdate: selectedProject.weeklyUpdate,
      blocker: selectedProject.blocker,
      nextAction: selectedProject.nextAction,
      escalationRequired: selectedProject.escalationRequired,
      tags: [...(selectedProject.tags || [])],
    })
    setIsEditing(true)
  }

  function cancelEdit() {
    setDraft(null)
    setIsEditing(false)
  }

  function saveEdit() {
    if (!selectedProject || !draft) return
    const today = new Date().toISOString().slice(0, 10)
    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              owner: draft.owner,
              dueDate: draft.dueDate,
              weeklyUpdate: draft.weeklyUpdate,
              blocker: draft.blocker,
              nextAction: draft.nextAction,
              escalationRequired: draft.escalationRequired,
              tags: [...(draft.tags || [])].sort((a, b) => a.localeCompare(b)),
              lastUpdated: today,
            }
          : project,
      ),
    )
    setIsEditing(false)
    setDraft(null)
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
  }

  function openCreateDrawer() {
    setCreateForm(emptyCreateForm())
    setCreateFieldErrors({})
    setCreateDrawerOpen(true)
  }

  function submitCreateProject(formData) {
    const errors = validateCreateForm(formData)
    setCreateFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const today = new Date().toISOString().slice(0, 10)
    let newId = ''

    setProjects((prev) => {
      newId = generateProjectId(prev)
      const sortedTags = [...(formData.tags || [])].sort((a, b) => a.localeCompare(b))
      const record = {
        id: newId,
        name: formData.name.trim(),
        businessUnit: formData.businessUnit.trim(),
        owner: formData.owner.trim(),
        dueDate: formData.dueDate,
        weeklyUpdate: formData.weeklyUpdate.trim(),
        blocker: formData.blocker.trim(),
        nextAction: formData.nextAction.trim(),
        escalationRequired: Boolean(formData.escalationRequired),
        lastUpdated: today,
        tags: sortedTags,
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

  function closeDetailPanel() {
    setSelectedProjectId('')
    setIsEditing(false)
    setDraft(null)
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
            <div className="h-0.5 bg-bank" aria-hidden />
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-['Manrope',ui-sans-serif,system-ui,sans-serif] text-lg font-semibold leading-tight tracking-tight text-ink sm:text-xl">
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-bank px-3 py-2 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank sm:px-3.5 sm:text-sm"
                  >
                    <span className="text-sm font-normal leading-none" aria-hidden>
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
                  As at{' '}
                  {new Intl.DateTimeFormat('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date())}
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
                  className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-mid-grey/35 hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
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
                  className="h-11 w-full rounded-lg border border-line bg-surface-muted pl-10 pr-10 text-[13px] font-medium text-ink shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-colors placeholder:text-ink-muted/65 focus:border-bank focus:bg-white focus:ring-2 focus:ring-[color:var(--color-focus-ring)]"
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
                            <Td className="font-semibold text-ink">{project.name}</Td>
                            <Td className="text-ink-muted">{project.businessUnit}</Td>
                            <Td className="text-ink-muted">{project.owner}</Td>
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
                              <BooleanChip active={Boolean(project.blocker)} />
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
                    onEdit={startEdit}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    onClose={closeDetailPanel}
                    onRequestDelete={openDeleteModal}
                    saveMessage={saveMessage}
                    freshness={getFreshness(selectedProject.lastUpdated)}
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
    </>
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
          <TextAreaField
            label="Next action"
            value={form.nextAction}
            onChange={(v) => patchForm({ nextAction: v })}
            error={fieldErrors.nextAction}
            rows={2}
          />
          <TextAreaField
            label="Weekly update (optional)"
            value={form.weeklyUpdate}
            onChange={(v) => patchForm({ weeklyUpdate: v })}
            rows={3}
          />
          <TextAreaField
            label="Blocker (optional)"
            value={form.blocker}
            onChange={(v) => patchForm({ blocker: v })}
            rows={2}
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3 text-[13px] font-medium text-ink transition-colors hover:bg-page">
            <input
              type="checkbox"
              checked={form.escalationRequired}
              onChange={(e) => patchForm({ escalationRequired: e.target.checked })}
              className="size-4 rounded border-line text-bank focus:ring-2 focus:ring-[color:var(--color-focus-ring)]"
            />
            Escalation required
          </label>
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

function AttentionStrip({ attention, activeFocus, onToggle }) {
  return (
    <div className="border-b border-line bg-surface-muted px-5 py-3.5 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mid-grey">
        Attention required
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <AttentionMetric
          kind="overdue"
          count={attention.overdue}
          active={activeFocus === 'overdue'}
          onToggle={() => onToggle('overdue')}
        />
        <AttentionMetric
          kind="stale"
          count={attention.stale}
          active={activeFocus === 'stale'}
          onToggle={() => onToggle('stale')}
        />
        <AttentionMetric
          kind="escalation"
          count={attention.escalations}
          active={activeFocus === 'escalation'}
          onToggle={() => onToggle('escalation')}
        />
      </div>
    </div>
  )
}

function AttentionMetric({ kind, count, active, onToggle }) {
  const label =
    kind === 'overdue' ? 'Overdue' : kind === 'stale' ? 'Stale updates' : 'Escalations'
  const warn = count > 0
  const base =
    'inline-flex min-w-[8.5rem] items-center justify-between gap-4 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank'
  const tone =
    active && warn
      ? 'border-bank/35 bg-bank-tint'
      : active
        ? 'border-line bg-white'
        : warn
          ? 'border-status-amber/40 bg-status-amber-bg/50 hover:bg-status-amber-bg'
          : 'border-line bg-white hover:bg-surface-muted'
  return (
    <button type="button" onClick={onToggle} className={`${base} ${tone} ${cardShadow}`}>
      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      <span
        className={`text-lg font-bold tabular-nums leading-none ${warn && kind !== 'stale' ? 'text-bank' : warn ? 'text-status-amber' : 'text-ink'}`}
      >
        {count}
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
          className="mt-6 w-full rounded-xl bg-bank py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
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
          className="mt-6 w-full rounded-xl bg-bank py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bank-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
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
  onEdit,
  onCancel,
  onSave,
  onClose,
  onRequestDelete,
  saveMessage,
  freshness,
}) {
  const status = project.derivedStatus

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
            <Field label="Weekly Update" value={project.weeklyUpdate} />
            <Field label="Blocker" value={project.blocker || 'None'} />
            <Field label="Next Action" value={project.nextAction} />
            <div className="rounded-xl border border-line bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">
                Escalation Required
              </p>
              <div className="mt-2">
                <EscalationChip required={project.escalationRequired} />
              </div>
            </div>
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
        ) : (
          <div className="space-y-4">
            <InputField
              label="Owner"
              value={draft.owner}
              onChange={(value) => onDraftChange((prev) => ({ ...prev, owner: value }))}
            />
            <InputField
              label="Due Date"
              type="date"
              value={draft.dueDate}
              onChange={(value) => onDraftChange((prev) => ({ ...prev, dueDate: value }))}
            />
            <TextAreaField
              label="Weekly Update"
              value={draft.weeklyUpdate}
              onChange={(value) => onDraftChange((prev) => ({ ...prev, weeklyUpdate: value }))}
            />
            <TextAreaField
              label="Blocker"
              value={draft.blocker}
              onChange={(value) => onDraftChange((prev) => ({ ...prev, blocker: value }))}
            />
            <TextAreaField
              label="Next Action"
              value={draft.nextAction}
              onChange={(value) => onDraftChange((prev) => ({ ...prev, nextAction: value }))}
            />
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3 text-[13px] font-medium text-ink transition-colors hover:bg-page">
              <input
                type="checkbox"
                checked={draft.escalationRequired}
                onChange={(event) =>
                  onDraftChange((prev) => ({ ...prev, escalationRequired: event.target.checked }))
                }
                className="size-4 rounded border-line text-bank focus:ring-2 focus:ring-[color:var(--color-focus-ring)]"
              />
              Escalation Required
            </label>
            <TagPicker
              selected={draft.tags || []}
              onChange={(tags) => onDraftChange((prev) => ({ ...prev, tags }))}
            />
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
        )}
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

function InputField({ label, value, onChange, type = 'text', error, list, id }) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">{label}</span>
      <input
        id={inputId}
        list={list}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 rounded-lg border bg-white px-3 text-[13px] font-medium text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-bank focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)] ${
          error ? 'border-status-red focus-visible:border-status-red' : 'border-line'
        }`}
      />
      {error ? <p className="text-[12px] font-medium text-status-red">{error}</p> : null}
    </label>
  )
}

function TextAreaField({ label, value, onChange, error, rows = 3 }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-mid-grey">{label}</span>
      <textarea
        value={value}
        rows={rows}
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
