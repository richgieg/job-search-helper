import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type RevealProps = {
  children: ReactNode
  className?: string
  delayMs?: number
}

type FeatureCardProps = {
  title: string
  description: string
  accentClassName: string
}

type JourneyStep = {
  label: string
  title: string
  description: string
}

const displayFontStyle: CSSProperties = {
  fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
}

const heroStats = [
  { label: 'New leads added this week', value: '18', tone: 'bg-app-primary-soft text-app-primary' },
  { label: 'Applications sent', value: '6', tone: 'bg-app-status-applied-soft text-app-status-applied' },
  { label: 'Interviews booked', value: '3', tone: 'bg-app-status-interview-soft text-app-status-interview' },
] as const

const journeySteps: JourneyStep[] = [
  {
    label: 'Capture',
    title: 'Save every lead before it disappears into another tab.',
    description:
      'Track company, role, recruiter links, compensation notes, and source details in one place instead of piecing them back together later.',
  },
  {
    label: 'Prioritize',
    title: 'See what is fresh, what is moving, and what still needs action.',
    description:
      'The dashboard stays focused on jobs added, applications sent, interviews coming up, and the roles that still have not been touched.',
  },
  {
    label: 'Tailor',
    title: 'Keep tailored resumes, cover letters, and references attached to the job they belong to.',
    description:
      'Profiles and generated documents stay connected to each application so you are not hunting for the right version right before an interview.',
  },
] as const

const useReveal = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) {
      return
    }

    if (typeof IntersectionObserver !== 'function') {
      setIsVisible(true)
      return
    }

    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) {
          return
        }

        setIsVisible(true)
        observer.disconnect()
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isVisible])

  return { ref, isVisible }
}

const Reveal = ({ children, className = '', delayMs = 0 }: RevealProps) => {
  const { ref, isVisible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={[className, 'landing-reveal'].filter(Boolean).join(' ')}
      data-visible={isVisible}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}

const FeatureCard = ({ title, description, accentClassName }: FeatureCardProps) => {
  return (
    <div className="rounded-[2rem] border border-app-border-muted bg-app-surface/85 p-6 shadow-[0_18px_50px_-28px_color-mix(in_oklab,var(--app-heading)_30%,transparent)] backdrop-blur-sm">
      <div className={[accentClassName, 'mb-4 h-1.5 w-16 rounded-full'].join(' ')} />
      <h3 className="text-lg font-semibold tracking-tight text-app-heading">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-app-text-muted">{description}</p>
    </div>
  )
}

const HeroIllustration = () => {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="landing-float absolute -left-6 top-8 hidden rounded-2xl border border-app-border bg-app-surface-overlay px-4 py-3 shadow-lg backdrop-blur lg:block">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-app-text-subtle">Today</p>
        <p className="mt-2 text-sm font-semibold text-app-heading">2 applications ready to send</p>
      </div>

      <div className="landing-float-slow absolute -right-4 bottom-10 hidden rounded-2xl border border-app-border bg-app-surface-overlay px-4 py-3 shadow-lg backdrop-blur lg:block">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-app-text-subtle">Next up</p>
        <p className="mt-2 text-sm font-semibold text-app-heading">Architecture interview on Thursday</p>
      </div>

      <svg aria-hidden="true" className="w-full overflow-visible" viewBox="0 0 680 540">
        <defs>
          <linearGradient id="hero-board-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--app-surface) 92%, white)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--app-primary-soft) 70%, var(--app-surface))" />
          </linearGradient>
          <linearGradient id="hero-activity-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--app-primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--app-primary)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <circle cx="158" cy="124" fill="var(--app-primary-soft)" opacity="0.9" r="84" />
        <circle cx="552" cy="404" fill="var(--app-status-offer-soft)" opacity="0.75" r="104" />

        <rect fill="url(#hero-board-gradient)" height="402" rx="36" stroke="var(--app-border-muted)" strokeWidth="2" width="540" x="70" y="72" />

        <rect fill="var(--app-surface)" height="92" rx="24" stroke="var(--app-border-muted)" strokeWidth="2" width="470" x="104" y="112" />
        <rect fill="var(--app-primary-soft)" height="16" rx="8" width="112" x="132" y="140" />
        <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="164" x="132" y="170" />
        <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="104" x="316" y="170" />
        <rect fill="var(--app-status-interview-soft)" height="34" rx="17" width="124" x="426" y="142" />

        <rect fill="var(--app-surface)" height="206" rx="28" stroke="var(--app-border-muted)" strokeWidth="2" width="286" x="104" y="230" />
        <text fill="var(--app-text-subtle)" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" letterSpacing="0.2em" x="132" y="266">
          ACTIVITY
        </text>
        <path className="landing-stroke-draw" d="M136 376C176 312 218 334 252 286C282 244 334 254 356 310" fill="none" stroke="var(--app-primary)" strokeDasharray="1" strokeLinecap="round" strokeWidth="10" />
        <path d="M132 392H362" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="6" />
        <rect fill="url(#hero-activity-gradient)" height="42" rx="12" width="24" x="148" y="344" />
        <rect fill="url(#hero-activity-gradient)" height="62" rx="12" width="24" x="192" y="324" />
        <rect fill="url(#hero-activity-gradient)" height="88" rx="12" width="24" x="236" y="298" />
        <rect fill="url(#hero-activity-gradient)" height="58" rx="12" width="24" x="280" y="328" />
        <rect fill="url(#hero-activity-gradient)" height="110" rx="12" width="24" x="324" y="276" />

        <rect fill="var(--app-surface)" height="206" rx="28" stroke="var(--app-border-muted)" strokeWidth="2" width="160" x="414" y="230" />
        <text fill="var(--app-text-subtle)" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" letterSpacing="0.2em" x="442" y="266">
          FOCUS
        </text>
        <rect fill="var(--app-primary-soft)" height="54" rx="18" width="104" x="442" y="290" />
        <rect fill="var(--app-status-applied-soft)" height="54" rx="18" width="104" x="442" y="354" />
        <text fill="var(--app-primary)" fontFamily="Inter, sans-serif" fontSize="26" fontWeight="700" x="458" y="324">
          4
        </text>
        <text fill="var(--app-status-applied)" fontFamily="Inter, sans-serif" fontSize="26" fontWeight="700" x="458" y="388">
          7
        </text>
      </svg>
    </div>
  )
}

const SearchChaosIllustration = () => {
  return (
    <svg aria-hidden="true" className="w-full" viewBox="0 0 600 420">
      <defs>
        <linearGradient id="search-chaos-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="var(--app-primary-soft)" />
          <stop offset="100%" stopColor="var(--app-surface)" />
        </linearGradient>
      </defs>
      <rect fill="url(#search-chaos-gradient)" height="360" rx="34" stroke="var(--app-border-muted)" strokeWidth="2" width="520" x="40" y="30" />
      <circle cx="150" cy="126" fill="var(--app-warning-muted)" r="52" />
      <circle cx="468" cy="302" fill="var(--app-primary-muted)" r="60" />
      <path className="landing-stroke-draw" d="M156 126C220 116 250 178 300 180C352 182 380 124 448 142" fill="none" stroke="var(--app-heading)" strokeDasharray="1" strokeLinecap="round" strokeWidth="8" />
      <rect fill="var(--app-surface)" height="76" rx="22" stroke="var(--app-border-muted)" strokeWidth="2" width="220" x="92" y="208" />
      <rect fill="var(--app-surface)" height="76" rx="22" stroke="var(--app-border-muted)" strokeWidth="2" width="220" x="288" y="118" />
      <rect fill="var(--app-surface)" height="76" rx="22" stroke="var(--app-border-muted)" strokeWidth="2" width="224" x="246" y="274" />
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" x="120" y="245">
        Role details
      </text>
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" x="316" y="155">
        Recruiter notes
      </text>
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" x="272" y="311">
        Portfolio links
      </text>
      <path d="M124 262H228" fill="none" stroke="var(--app-border)" strokeLinecap="round" strokeWidth="10" />
      <path d="M124 278H208" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="10" />
      <path d="M320 172H420" fill="none" stroke="var(--app-border)" strokeLinecap="round" strokeWidth="10" />
      <path d="M320 188H388" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="10" />
      <path d="M278 328H398" fill="none" stroke="var(--app-border)" strokeLinecap="round" strokeWidth="10" />
      <path d="M278 344H374" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="10" />
    </svg>
  )
}

const PipelineIllustration = () => {
  return (
    <svg aria-hidden="true" className="w-full" viewBox="0 0 700 430">
      <rect fill="var(--app-surface)" height="330" rx="34" stroke="var(--app-border-muted)" strokeWidth="2" width="620" x="40" y="54" />
      <rect fill="var(--app-primary-soft)" height="254" rx="28" width="132" x="70" y="92" />
      <rect fill="var(--app-status-applied-soft)" height="214" rx="28" width="132" x="220" y="132" />
      <rect fill="var(--app-status-interview-soft)" height="172" rx="28" width="132" x="370" y="174" />
      <rect fill="var(--app-status-offer-soft)" height="136" rx="28" width="132" x="520" y="210" />
      <text fill="var(--app-primary)" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" letterSpacing="0.12em" x="100" y="124">
        JOBS
      </text>
      <text fill="var(--app-status-applied)" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" letterSpacing="0.12em" x="248" y="164">
        APPLIED
      </text>
      <text fill="var(--app-status-interview)" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" letterSpacing="0.12em" x="390" y="206">
        INTERVIEWS
      </text>
      <text fill="var(--app-status-offer)" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" letterSpacing="0.12em" x="556" y="242">
        OFFERS
      </text>
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="48" fontWeight="700" x="112" y="196">
        18
      </text>
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="48" fontWeight="700" x="262" y="234">
        7
      </text>
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="48" fontWeight="700" x="414" y="272">
        3
      </text>
      <text fill="var(--app-heading)" fontFamily="Inter, sans-serif" fontSize="48" fontWeight="700" x="564" y="306">
        1
      </text>
      <path className="landing-stroke-draw" d="M170 80C230 44 316 44 372 104C430 166 512 170 584 146" fill="none" stroke="var(--app-heading)" strokeDasharray="1" strokeLinecap="round" strokeWidth="6" />
    </svg>
  )
}

const DocumentsIllustration = () => {
  return (
    <svg aria-hidden="true" className="w-full" viewBox="0 0 620 460">
      <rect fill="var(--app-primary-soft)" height="320" rx="36" width="250" x="72" y="94" />
      <rect fill="var(--app-surface)" height="320" rx="36" stroke="var(--app-border-muted)" strokeWidth="2" width="250" x="104" y="64" />
      <rect fill="var(--app-surface)" height="320" rx="36" stroke="var(--app-border-muted)" strokeWidth="2" width="250" x="266" y="92" />
      <rect fill="var(--app-primary-muted)" height="18" rx="9" width="104" x="138" y="118" />
      <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="168" x="138" y="156" />
      <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="148" x="138" y="180" />
      <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="172" x="138" y="204" />
      <rect fill="var(--app-status-applied-soft)" height="18" rx="9" width="124" x="300" y="146" />
      <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="164" x="300" y="184" />
      <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="152" x="300" y="208" />
      <rect fill="var(--app-surface-subtle)" height="12" rx="6" width="170" x="300" y="232" />
      <path className="landing-stroke-draw" d="M262 260C282 238 294 214 332 202C380 186 408 204 442 166" fill="none" stroke="var(--app-primary)" strokeDasharray="1" strokeLinecap="round" strokeWidth="7" />
      <circle cx="262" cy="260" fill="var(--app-primary)" r="10" />
      <circle cx="442" cy="166" fill="var(--app-primary)" r="10" />
    </svg>
  )
}

const VaultIllustration = () => {
  return (
    <svg aria-hidden="true" className="w-full" viewBox="0 0 620 320">
      <rect fill="var(--app-surface)" height="200" rx="30" stroke="var(--app-border-muted)" strokeWidth="2" width="540" x="40" y="60" />
      <rect fill="var(--app-surface-subtle)" height="160" rx="24" width="188" x="78" y="80" />
      <rect fill="var(--app-primary-soft)" height="160" rx="24" width="120" x="286" y="80" />
      <rect fill="var(--app-surface-subtle)" height="160" rx="24" width="136" x="426" y="80" />
      <circle cx="346" cy="160" fill="var(--app-primary)" r="34" />
      <circle cx="346" cy="160" fill="none" r="16" stroke="var(--app-primary-contrast)" strokeWidth="8" />
      <path d="M346 144V176" fill="none" stroke="var(--app-primary-contrast)" strokeLinecap="round" strokeWidth="8" />
      <path d="M140 126H206" fill="none" stroke="var(--app-border)" strokeLinecap="round" strokeWidth="12" />
      <path d="M140 154H222" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="12" />
      <path d="M140 182H192" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="12" />
      <path d="M458 128H524" fill="none" stroke="var(--app-border)" strokeLinecap="round" strokeWidth="12" />
      <path d="M458 156H510" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="12" />
      <path d="M458 184H520" fill="none" stroke="var(--app-border-muted)" strokeLinecap="round" strokeWidth="12" />
    </svg>
  )
}

export const LandingPage = () => {
  return (
    <div className="relative -mx-6 overflow-hidden lg:-mx-10">
      <div className="landing-grid-background absolute inset-0 opacity-55" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--app-primary-soft)_88%,transparent),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-64 h-[42rem] bg-[radial-gradient(circle_at_80%_20%,color-mix(in_oklab,var(--app-status-offer-soft)_90%,transparent),transparent_52%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-24 px-6 pb-20 pt-8 lg:px-10 lg:pb-28 lg:pt-12">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal className="space-y-8" delayMs={40}>
            <div className="inline-flex rounded-full border border-app-border bg-app-surface/85 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-app-text-subtle backdrop-blur">
              Calm the job-search scramble
            </div>

            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-app-heading sm:text-6xl lg:text-7xl" style={displayFontStyle}>
                Take control of your job search.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-app-text-muted sm:text-xl">
                Stay on top of your job search with less friction at every stage.
              </p>
              <p className="max-w-2xl text-base leading-7 text-app-text-subtle">
                Keep every lead, document, interview, and decision connected so you always know what moved today and what still needs attention next.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat, index) => (
                <Reveal key={stat.label} delayMs={140 + index * 110}>
                  <div className="rounded-[1.75rem] border border-app-border bg-app-surface/85 p-4 shadow-sm backdrop-blur-sm">
                    <div className={[stat.tone, 'inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]'].join(' ')}>
                      {stat.label}
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-app-heading">{stat.value}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delayMs={180}>
            <HeroIllustration />
          </Reveal>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal className="rounded-[2rem] border border-app-border-muted bg-app-surface/80 p-6 shadow-[0_30px_70px_-42px_color-mix(in_oklab,var(--app-heading)_38%,transparent)] backdrop-blur-sm lg:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-app-text-subtle">From chaos to clarity</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-app-heading sm:text-4xl" style={displayFontStyle}>
                Turn scattered tabs and saved links into one reliable system.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-app-text-muted">
                Spend less time switching contexts, lose fewer details, and keep a clearer view of where each opportunity actually stands.
              </p>
              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-app-border bg-app-canvas p-4">
                <SearchChaosIllustration />
              </div>
            </Reveal>
          </div>

          <div className="space-y-5 lg:pt-16">
            {journeySteps.map((step, index) => (
              <Reveal key={step.label} delayMs={80 + index * 120}>
                <div className="rounded-[2rem] border border-app-border-muted bg-app-surface/88 p-7 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-app-text-subtle">{step.label}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-app-heading">{step.title}</h3>
                  <p className="mt-3 text-base leading-7 text-app-text-muted">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="grid gap-10 rounded-[2.5rem] border border-app-border-muted bg-app-surface/82 p-8 shadow-[0_30px_80px_-50px_color-mix(in_oklab,var(--app-heading)_45%,transparent)] backdrop-blur-sm lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:p-10">
          <Reveal className="space-y-5" delayMs={20}>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-app-text-subtle">Track the pipeline</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-app-heading sm:text-4xl" style={displayFontStyle}>
              See the top of funnel, applications, interviews, and offers without inventing busywork.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-app-text-muted">
              The dashboard is built around operational questions: what got added recently, what has been sent, what interviews are coming up, and which roles still have no application attached.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                accentClassName="bg-app-primary"
                description="Daily activity shows real movement across the week so you can spot momentum instead of guessing from memory."
                title="Event-based activity, not vanity charts"
              />
              <FeatureCard
                accentClassName="bg-app-status-interview"
                description="Upcoming interviews stay visible near the top so the next conversation is never buried under list maintenance."
                title="Upcoming interviews stay front and center"
              />
            </div>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="overflow-hidden rounded-[2rem] border border-app-border bg-app-canvas p-4 sm:p-6">
              <PipelineIllustration />
            </div>
          </Reveal>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
          <Reveal delayMs={40}>
            <div className="overflow-hidden rounded-[2rem] border border-app-border-muted bg-app-surface/82 p-4 shadow-sm backdrop-blur-sm sm:p-6">
              <DocumentsIllustration />
            </div>
          </Reveal>

          <Reveal className="space-y-5" delayMs={120}>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-app-text-subtle">Tailor faster</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-app-heading sm:text-4xl" style={displayFontStyle}>
              Build tailored application materials without losing track of which version belongs to which role.
            </h2>
            <p className="text-base leading-7 text-app-text-muted">
              Profiles, cover letters, resumes, references, and supporting details stay grouped around the job they support. That means less last-minute searching and less accidental reuse of the wrong draft.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                accentClassName="bg-app-status-applied"
                description="Profile variants let you adapt for different roles while keeping the core material reusable."
                title="Keep tailored profile variants together"
              />
              <FeatureCard
                accentClassName="bg-app-status-offer"
                description="Printable resume, cover letter, and references views are ready when you need to share or review them."
                title="Move from editing to sending quickly"
              />
            </div>
          </Reveal>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Reveal delayMs={30}>
            <div className="h-full rounded-[2rem] border border-app-border-muted bg-app-surface/85 p-8 shadow-sm backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-app-text-subtle">Every detail together</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-app-heading" style={displayFontStyle}>
                Keep the small details close to the job before they become the missing detail that slows you down.
              </h2>
              <p className="mt-4 text-base leading-7 text-app-text-muted">
                Agency names, recruiter notes, interview schedules, links, and compensation context stay attached to the record instead of drifting into a notes app or inbox search.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-app-border bg-app-canvas px-4 py-3 text-sm text-app-text-muted">Recruiter contact and source links</div>
                <div className="rounded-2xl border border-app-border bg-app-canvas px-4 py-3 text-sm text-app-text-muted">Interview timing and stage history</div>
                <div className="rounded-2xl border border-app-border bg-app-canvas px-4 py-3 text-sm text-app-text-muted">Notes that stay with the role, not with a browser session</div>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="h-full rounded-[2rem] border border-app-border-muted bg-app-surface/85 p-8 shadow-sm backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-app-text-subtle">Local-first and yours</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-app-heading" style={displayFontStyle}>
                Keep your data local, exportable, and easy to reset or demo.
              </h2>
              <p className="mt-4 text-base leading-7 text-app-text-muted">
                The app stores data locally in your browser, supports JSON export and import, and can load fresh sample data on demand so you can explore the full workflow with current-looking dates.
              </p>
              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-app-border bg-app-canvas p-4">
                <VaultIllustration />
              </div>
            </div>
          </Reveal>
        </section>

        <section className="landing-cta-panel relative overflow-hidden rounded-[2.75rem] border px-8 py-10 shadow-[0_36px_90px_-54px_color-mix(in_oklab,var(--app-heading)_38%,transparent)] sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--app-primary)_34%,transparent),transparent_56%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--app-surface)_24%,transparent),transparent)]" />

          <Reveal className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end" delayMs={20}>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-app-primary">Start with momentum</p>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-app-heading sm:text-5xl" style={displayFontStyle}>
                Load the sample data and see how to easily turn a messy search into a trackable pipeline.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-app-text-muted">
                Browse the dashboard, inspect jobs, tailor documents, and see how the full workflow fits together before adding your own data.
              </p>
            </div>

            <div className="flex items-start lg:justify-end">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-app-primary px-5 py-3 text-sm font-semibold text-app-primary-contrast transition hover:bg-app-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus-ring focus-visible:ring-offset-2"
                to="/import-export"
              >
                Load Sample Data
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  )
}