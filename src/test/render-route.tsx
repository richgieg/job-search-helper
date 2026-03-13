import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

export const renderRoute = ({
  element,
  path,
  route,
}: {
  element: ReactElement
  path: string
  route: string
}): RenderResult => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={element} path={path} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}