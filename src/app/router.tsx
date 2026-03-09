import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './layout/AppLayout'
import { ApplicationPage } from '../pages/ApplicationPage'
import { CoverLetterPage } from '../pages/CoverLetterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ImportExportPage } from '../pages/ImportExportPage'
import { JobPage } from '../pages/JobPage'
import { JobsPage } from '../pages/JobsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProfilesPage } from '../pages/ProfilesPage'
import { ResumePage } from '../pages/ResumePage'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/cover-letter/:profileId" element={<CoverLetterPage />} />
      <Route path="/resume/:profileId" element={<ResumePage />} />

      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/profiles/:profileId" element={<ProfilePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId" element={<JobPage />} />
        <Route path="/import-export" element={<ImportExportPage />} />
        <Route path="/application/:profileId" element={<ApplicationPage />} />
      </Route>
    </Routes>
  )
}
