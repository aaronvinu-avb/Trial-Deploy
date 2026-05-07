import { useEffect } from 'react'
import { Link } from 'react-router-dom'

/** Aligned with dashboard tokens: page #f3f3f3, line #e5e5e5, ink #1f1f1f */
const pageBg = '#f3f3f3'
const gridLine = 'rgba(31, 31, 31, 0.06)'
const ink = '#1f1f1f'

function GridTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.85]"
      aria-hidden
      style={{
        backgroundColor: pageBg,
        backgroundImage: `
          linear-gradient(${gridLine} 1px, transparent 1px),
          linear-gradient(90deg, ${gridLine} 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 72% 58% at 50% 48%, black 35%, transparent 100%)',
      }}
    />
  )
}

export default function LandingPage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Project Tracker'
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-12 antialiased"
      style={{
        backgroundColor: pageBg,
        color: ink,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <GridTexture />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mid-grey md:text-[11px]">
          Governance dashboard
        </p>
        <div className="mt-3 h-0.5 w-7 rounded-full bg-bank/90" aria-hidden />

        <h1 className="mt-6 font-['Manrope',ui-sans-serif,system-ui,sans-serif] text-[2.25rem] font-bold leading-tight tracking-tight text-ink md:text-4xl md:tracking-tight">
          Project Tracker
        </h1>

        <p className="mt-5 max-w-[20rem] text-[13px] leading-relaxed text-ink-muted md:text-sm">
          Governance dashboard for structured weekly review
        </p>

        <Link
          to="/dashboard"
          className="mt-10 inline-flex h-10 items-center justify-center rounded-lg bg-bank px-8 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] outline-none transition-[filter,box-shadow] hover:bg-bank-hover hover:shadow-[0_2px_8px_rgba(219,0,17,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bank"
        >
          Launch Project Tracker
        </Link>
      </div>
    </div>
  )
}
