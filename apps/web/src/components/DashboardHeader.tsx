import { Link } from 'react-router-dom'
import { BellIcon } from '@heroicons/react/24/outline'
import { Button, useSquircleClip } from '@listeningkit/ui'
import { SOCIAL_ICONS, SocialBadge } from '@/lib/social-icons'

// Floating white top card with the squircle clip, no border.
export function DashboardHeader() {
  const clip = useSquircleClip<HTMLElement>(20)

  return (
    <header ref={clip.ref} style={clip.style} className="m-4 flex shrink-0 items-center justify-between bg-white px-6 py-4 sm:px-8">
      <div>
        <h1 className="text-xl font-bold">Your listening dashboard</h1>
        <p className="text-sm text-text-secondary">Signals from your sources will land here.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild variant="gray" size="xl" shadow="hard" className="font-bold">
          <Link to="/onboarding">
            Connect your Socials
            <span className="flex items-center">
              {SOCIAL_ICONS.map((icon) => (
                <SocialBadge key={icon.id} icon={icon} variant="blue" className="-ml-2 first:ml-0" />
              ))}
            </span>
          </Link>
        </Button>
        <Button type="button" variant="blue" size="xl" shadow="hard" aria-label="Notifications" className="w-12 px-0 md:w-14">
          <BellIcon aria-hidden="true" className="size-5 text-white" />
        </Button>
      </div>
    </header>
  )
}
