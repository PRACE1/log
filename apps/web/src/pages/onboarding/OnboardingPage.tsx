import { OnboardingSteps } from './OnboardingSteps'

const BG = '#2a8cff'

export function OnboardingPage() {
  return (
    <div
      className="flex min-h-screen flex-col text-white"
      style={{ backgroundColor: BG, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}
    >
      <OnboardingSteps />
    </div>
  )
}
