import { createStaticPageTitle } from '../app/page-titles'
import { usePageTitle } from '../app/use-page-title'

const GitHubMark = () => (
  <svg aria-hidden="true" className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 .5C5.649.5.5 5.649.5 12c0 5.084 3.292 9.398 7.86 10.92.575.106.785-.25.785-.556 0-.274-.01-1-.016-1.962-3.197.695-3.872-1.54-3.872-1.54-.523-1.327-1.277-1.68-1.277-1.68-1.044-.714.08-.7.08-.7 1.154.081 1.761 1.185 1.761 1.185 1.026 1.759 2.693 1.251 3.35.957.104-.743.402-1.251.731-1.538-2.552-.29-5.236-1.276-5.236-5.68 0-1.255.449-2.281 1.184-3.085-.119-.29-.513-1.458.112-3.04 0 0 .965-.31 3.162 1.179A10.96 10.96 0 0 1 12 6.03c.973.005 1.954.132 2.87.388 2.195-1.49 3.158-1.18 3.158-1.18.627 1.583.233 2.751.115 3.04.737.805 1.182 1.83 1.182 3.086 0 4.415-2.688 5.387-5.248 5.672.414.355.783 1.058.783 2.134 0 1.542-.014 2.786-.014 3.166 0 .31.207.668.79.555A11.504 11.504 0 0 0 23.5 12C23.5 5.649 18.351.5 12 .5Z" />
  </svg>
)

const SectionCard = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) => (
  <section className="rounded-3xl border border-app-border-muted bg-app-surface px-6 py-8 shadow-sm sm:px-8 sm:py-10">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-text-subtle">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-app-heading">{title}</h2>
    <div className="mt-4 space-y-4 text-sm leading-7 text-app-text-muted sm:text-base">{children}</div>
  </section>
)

export const AboutPage = () => {
  usePageTitle(createStaticPageTitle('About'))

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-app-border-muted bg-app-surface px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-app-primary">About</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-app-heading sm:text-5xl">Why this app exists</h1>
          </div>

          <a
            className="inline-flex items-center gap-2 self-start rounded-full border border-app-border bg-app-background px-4 py-2 text-sm font-medium text-app-text-muted transition hover:border-app-primary/35 hover:text-app-heading"
            href="https://github.com/richgieg/job-search-helper"
            rel="noreferrer"
            target="_blank"
          >
            <GitHubMark />
            <span>View on GitHub</span>
          </a>
        </div>

        <p className="mt-4 max-w-3xl text-base leading-8 text-app-text-muted sm:text-lg">
          Job Search Helper is a local-first web app for organizing job opportunities, keeping tailored profile content in order, and staying on top of applications, interviews, contacts, and document views without scattering that work across browser tabs and notes.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="What It Does" title="A practical workspace for an active job search">
          <p>
            The app brings together the parts of a search that usually drift apart: job records, related profiles, contacts, links, interview scheduling, notes, and printable resume, cover-letter, and references views.
          </p>
          <p>
            It also stays intentionally simple to run. Data is stored in the browser, can be exported or imported as JSON, and can be replaced with sample data when it is useful to test the workflow or demonstrate the app.
          </p>
        </SectionCard>

        <SectionCard eyebrow="Why I Built It" title="Part job-search tool, part AI-assisted build experiment">
          <p>
            I built Job Search Helper first to support my own job search. I wanted a tool that keeps the operational side of the process organized while making it easier to tailor materials for specific roles.
          </p>
          <p>
            I also wanted a real project for gaining hands-on experience with AI agent coding. This app gives me a concrete place to explore how AI-assisted workflows help with planning, implementation, testing, refactoring, and product iteration.
          </p>
        </SectionCard>
      </div>

      <SectionCard eyebrow="About Me" title="Richard Gieg">
        <p>
          I am a technology professional with experience across software engineering, IT support, and systems and network administration. My background spans product development, troubleshooting, internal tooling, and practical cross-disciplinary technical work.
        </p>
        <p>
          On my personal site, I share projects ranging from web applications and games to lower-level systems work. That mix of interests carries into this project too: I like building software that is useful in day-to-day life while also using it as a way to learn new tools and sharpen engineering judgment.
        </p>
        <p>
          Job Search Helper sits directly in that overlap. It is both a tool I want for myself and a way to keep improving as a developer.
        </p>
        <p>
          <a
            className="font-medium text-app-primary underline decoration-app-primary/40 underline-offset-4 transition hover:text-app-primary-hover"
            href="https://www.richgieg.com/"
            rel="noreferrer"
            target="_blank"
          >
            Visit my website to see more of my background and projects.
          </a>
        </p>
      </SectionCard>
    </div>
  )
}