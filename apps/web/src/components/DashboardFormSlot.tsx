import { createContext, useContext, type ReactNode } from 'react'

/**
 * Form slot context. DashboardLayout renders the registered node in a
 * floating overlay above the layout (right side, form width); pages
 * register their form component when open and null it out when closed.
 * The dashboard underneath never reflows — the form sits a z-level higher.
 */
const DashboardFormContext = createContext<(node: ReactNode | null) => void>(() => {})

export function useDashboardFormSlot() {
  return useContext(DashboardFormContext)
}

export const DashboardFormProvider = DashboardFormContext.Provider