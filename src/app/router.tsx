import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './layout/AppLayout'
import { ApplicationPage } from '../pages/ApplicationPage'
import { CoverLetterResumePage } from '../pages/CoverLetterResumePage'
import { CoverLetterPage } from '../pages/CoverLetterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ImportExportPage } from '../pages/ImportExportPage'
import { JobPage } from '../pages/JobPage'
import { JobsPage } from '../pages/JobsPage'
import { LandingPage } from '../pages/LandingPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProfilesPage } from '../pages/ProfilesPage'
import { ReferencesPage } from '../pages/ReferencesPage'
import { ResumePage } from '../pages/ResumePage'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/profiles/:profileId/cover-letter" element={<CoverLetterPage />} />
      <Route path="/profiles/:profileId/combined" element={<CoverLetterResumePage />} />
      <Route path="/profiles/:profileId/references" element={<ReferencesPage />} />
      <Route path="/profiles/:profileId/resume" element={<ResumePage />} />

      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/profiles/:profileId" element={<ProfilePage />} />
        <Route path="/profiles/:profileId/application" element={<ApplicationPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId" element={<JobPage />} />
        <Route path="/import-export" element={<ImportExportPage />} />
      </Route>
    </Routes>
  )
}
