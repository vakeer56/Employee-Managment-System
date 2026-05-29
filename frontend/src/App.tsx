import { AppRoutes } from './routes/AppRoutes'
import { DashboardRefreshProvider } from './context/DashboardRefreshContext'

function App() {
  return (
    <DashboardRefreshProvider>
      <AppRoutes />
    </DashboardRefreshProvider>
  )
}

export default App
