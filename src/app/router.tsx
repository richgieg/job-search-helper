import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { ImportExportPage } from '../pages/ImportExportPage'
import { JobsPage } from '../pages/JobsPage'
import { ProfilesPage } from '../pages/ProfilesPage'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/import-export" element={<ImportExportPage />} />
      </Route>
    </Routes>
  )
}
