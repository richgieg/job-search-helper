import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'

import { APP_NAME } from './page-titles'
import { AppLayout } from './layout/AppLayout'

const LandingPage = lazy(() => import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })))
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProfilesPage = lazy(() => import('../pages/ProfilesPage').then((module) => ({ default: module.ProfilesPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const ApplicationPage = lazy(() => import('../pages/ApplicationPage').then((module) => ({ default: module.ApplicationPage })))
const JobsPage = lazy(() => import('../pages/JobsPage').then((module) => ({ default: module.JobsPage })))
const JobPage = lazy(() => import('../pages/JobPage').then((module) => ({ default: module.JobPage })))
const ImportExportPage = lazy(() => import('../pages/ImportExportPage').then((module) => ({ default: module.ImportExportPage })))
const CoverLetterPage = lazy(() => import('../pages/CoverLetterPage').then((module) => ({ default: module.CoverLetterPage })))
const CoverLetterResumePage = lazy(() => import('../pages/CoverLetterResumePage').then((module) => ({ default: module.CoverLetterResumePage })))
const ReferencesPage = lazy(() => import('../pages/ReferencesPage').then((module) => ({ default: module.ReferencesPage })))
const ResumePage = lazy(() => import('../pages/ResumePage').then((module) => ({ default: module.ResumePage })))

const RouteLoadingScreen = () => (
  <div aria-live="polite" className="route-loading-screen" role="status">
    <div className="route-loading-spinner" aria-hidden="true">
      <span className="route-loading-spinner-ring route-loading-spinner-ring-base" />
      <span className="route-loading-spinner-ring route-loading-spinner-ring-accent" />
      <span className="route-loading-spinner-core" />
    </div>
    <div className="route-loading-copy">
      <p className="route-loading-eyebrow">{APP_NAME}</p>
      <p className="route-loading-label">Loading workspace</p>
    </div>
  </div>
)

const RouteReveal = ({ children }: { children: ReactNode }) => <div className="route-content-fade-in">{children}</div>

const withRouteReveal = (element: ReactNode) => <RouteReveal>{element}</RouteReveal>

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <Routes>
        <Route path="/profiles/:profileId/cover-letter" element={withRouteReveal(<CoverLetterPage />)} />
        <Route path="/profiles/:profileId/combined" element={withRouteReveal(<CoverLetterResumePage />)} />
        <Route path="/profiles/:profileId/references" element={withRouteReveal(<ReferencesPage />)} />
        <Route path="/profiles/:profileId/resume" element={withRouteReveal(<ResumePage />)} />

        <Route element={<AppLayout />}>
          <Route index element={withRouteReveal(<LandingPage />)} />
          <Route path="/dashboard" element={withRouteReveal(<DashboardPage />)} />
          <Route path="/profiles" element={withRouteReveal(<ProfilesPage />)} />
          <Route path="/profiles/:profileId" element={withRouteReveal(<ProfilePage />)} />
          <Route path="/profiles/:profileId/application" element={withRouteReveal(<ApplicationPage />)} />
          <Route path="/jobs" element={withRouteReveal(<JobsPage />)} />
          <Route path="/jobs/:jobId" element={withRouteReveal(<JobPage />)} />
          <Route path="/import-export" element={withRouteReveal(<ImportExportPage />)} />
        </Route>
      </Routes>
    </Suspense>
  )
}
