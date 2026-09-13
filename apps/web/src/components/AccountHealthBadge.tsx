import type { ReactNode } from 'react'
import { Badge } from '@listeningkit/ui'
import type { AccountHealth } from '../lib/health'

/**
 * The standard account badge: the `Badge` pill whose variant, dot and
 * native tooltip all derive from one `lib/health` assessment, so every
 * dashboard surface shows the same account the same way. Healthy reads
 * as its own quiet state (green dot), anything less is flagged.
 */
export function AccountHealthBadge({
  label,
  health,
  icon,
  className
}: {
  label: string
  health: AccountHealth
  /** Optional leading glyph (e.g. the account's social icon). */
  icon?: ReactNode
  className?: string
}) {
  switch (health.state) {
    case 'healthy':
      return (
        <Badge variant="success" dot icon={icon} className={className} title={health.reason}>
          {label}
        </Badge>
      )
    case 'degraded':
      return (
        <Badge variant="warning" dot icon={icon} className={className} title={health.reason}>
          {label}
        </Badge>
      )
    default:
      return (
        <Badge variant="danger" icon={icon} className={className} title={health.reason}>
          {label}
        </Badge>
      )
  }
}