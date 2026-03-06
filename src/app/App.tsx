import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './router'

export const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
