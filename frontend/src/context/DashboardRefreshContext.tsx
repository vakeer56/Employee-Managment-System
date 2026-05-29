import React, { createContext, useContext, useCallback, useState } from 'react'

interface DashboardRefreshContextType {
  triggerRefresh: () => void
  refreshCount: number
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | undefined>(undefined)

export function DashboardRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshCount, setRefreshCount] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1)
  }, [])

  return (
    <DashboardRefreshContext.Provider value={{ triggerRefresh, refreshCount }}>
      {children}
    </DashboardRefreshContext.Provider>
  )
}

export function useDashboardRefresh() {
  const context = useContext(DashboardRefreshContext)
  if (!context) {
    throw new Error('useDashboardRefresh must be used within DashboardRefreshProvider')
  }
  return context
}
