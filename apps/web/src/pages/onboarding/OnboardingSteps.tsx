import { useState } from 'react'
import { siGithub, siGooglechrome } from 'simple-icons'
import { Button } from '@listeningkit/ui'
import { SOCIAL_ICONS, SocialGlyph } from '@/lib/social-icons'
import { FunnelVideo } from '@/components/FunnelVideo'
import { ReadyFill } from '@/components/ReadyFill'

type Step = 0 | 1 | 2 | 3

// Swap in your own footage via VITE_ONBOARDING_VIDEO_URL (e.g. an R2 public URL).
const VIDEO_URL =
  import.meta.env.VITE_ONBOARDING_VIDEO_URL || 'https://files.vidstack.io/sprite-fight/720p.mp4'

// Where to send the user to grab cookies, per platform.
const PLATFORM_SITES: Record<string, { label: string; url: string }> = {
  facebook: { label: 'facebook.com', url: 'https://facebook.com' },
  x: { label: 'x.com', url: 'https://x.com' },
  reddit: { label: 'reddit.com', url: 'https://reddit.com' }
}

const EXTENSION_URL = 'https://chromewebstore.google.com/'
// Centered brand header — same pattern as
// open-offer-builder/frontend/src/pages/PreviewPage.tsx (lines ~431-453):
// logo left, name right + sub beneath, centered by the parent column.
function BrandHeader() {
  return (
    <div className="flex items-center gap-3 text-left">
      <img src="/logo.svg" alt="ListeningKit logo" className="size-11 shrink-0 rounded-[10px] object-contain" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[17px] font-bold leading-tight text-white">ListeningKit</p>
        <p className="text-[13px] leading-snug text-white/70">Live social listening</p>
      </div>
    </div>
  )
}

export function OnboardingSteps() {
  const [step, setStep] = useState<Step>(0)
  const [sources, setSources] = useState<string[]>([])
  const [tokens, setTokens] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggleSource(id: string) {
    setSources((prev) => (prev.includes(id) ? [] : [id]))
  }

  function continueFromSources() {
    if (sources.length === 0) return
    setStep(1)
  }

  function finish() {
    setStep(2)
  }

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-16 pt-24 text-center sm:px-10">
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <BrandHeader />
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center">

      {step === 0 && (
        <div className="mt-8 w-full">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Where should we listen?</h1>
          <p className="mt-4 text-lg text-white/85">
            Pick the platforms you care about. We&apos;ll cluster what customers keep repeating.
          </p>
          <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-2 gap-4">
            {SOCIAL_ICONS.map((icon) => {
              const active = sources.includes(icon.id)
              return (
                <Button
                  key={icon.id}
                  type="button"
                  onClick={() => toggleSource(icon.id)}
                  aria-pressed={active}
                  className={`h-auto min-h-44 flex-row items-center gap-5 whitespace-normal rounded-3xl border p-6 text-left ${
                    active
                      ? 'border-white bg-white text-[#2a8cff]'
                      : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <SocialGlyph icon={icon} className="size-20 shrink-0" />
                  <span className="flex-1">
                    <span className="block text-3xl font-bold">{icon.label}</span>
                    <span className={`mt-1 block text-base ${active ? 'text-[#2a8cff]/70' : 'text-white/70'}`}>
                      {active ? 'Selected — tap to remove' : 'Tap to select'}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
          <Button
            type="button"
            onClick={continueFromSources}
            disabled={sources.length === 0}
            size="xl"
            shadow="hard"
            className="mt-6 h-14 gap-3 rounded-xl bg-white px-10 font-bold text-slate-900 hover:bg-white/90"
          >
            Continue with {sources.length === 0 ? '…' : (SOCIAL_ICONS.find((icon) => icon.id === sources[0])?.label ?? '…')}
            {sources.length > 0 && (
              <span className="flex items-center">
                {sources.map((id) => {
                  const icon = SOCIAL_ICONS.find((i) => i.id === id)
                  if (!icon) return null
                  return (
                    <span
                      key={id}
                      title={icon.label}
                      className="-ml-2 flex size-8 items-center justify-center rounded-full bg-[#2a8cff] ring-2 ring-white first:ml-0"
                    >
                      <SocialGlyph icon={icon} className="size-4 text-white" />
                    </span>
                  )
                })}
              </span>
            )}
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-8 w-full">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
             Watch this here quick video
           </h1>
          <div className="mx-auto mt-6 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/30 bg-white/10" style={{ aspectRatio: '16/10' }}>
            <FunnelVideo src={VIDEO_URL} title="How ListeningKit works" variant="controls" />
          </div>
          <h2 className="mt-10 text-2xl font-bold sm:text-3xl">
            Install the Chrome Extension
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="https://chromewebstore.google.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-3xl border border-white/30 bg-white/10 p-5 text-left text-white transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" role="img" aria-label="Google Chrome" className="size-12 shrink-0" fill="currentColor">
                <path d={siGooglechrome.path} />
              </svg>
              <span>
                <span className="block text-xl font-bold">Install the Chrome Extension</span>
                <span className="mt-0.5 block text-sm text-white/70">Capture signals right from your browser</span>
              </span>
            </a>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-3xl border border-white/30 bg-white/10 p-5 text-left text-white transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" role="img" aria-label="GitHub" className="size-12 shrink-0" fill="currentColor">
                <path d={siGithub.path} />
              </svg>
              <span>
                <span className="block text-xl font-bold">Install from Github</span>
                <span className="mt-0.5 block text-sm text-white/70">Self-host and hack on the source</span>
              </span>
            </a>
          </div>
          <Button
            type="button"
            onClick={finish}
            size="xl"
            shadow="hard"
            className="mt-6 h-14 rounded-xl bg-white px-10 font-bold text-slate-900 hover:bg-white/90"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 flex w-full flex-col items-center">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Connect your accounts
          </h1>
          <div className="mt-6 w-[min(100vw-4rem,96rem)] rounded-[32px] bg-white p-6 text-slate-900 sm:p-10">
          <div className="grid grid-cols-1 items-stretch gap-6 text-left lg:grid-cols-[minmax(0,9fr)_minmax(0,8fr)]">
            <div className="flex h-full min-h-80 flex-col justify-center overflow-hidden rounded-3xl border border-slate-200 bg-black">
              <div className="aspect-video w-full">
                <FunnelVideo src={VIDEO_URL} title="How ListeningKit works" variant="controls" />
              </div>
            </div>
            <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <p className="text-2xl font-bold">Paste your tokens</p>
              <p className="mt-1 text-sm text-slate-600">
                Tokens stay in your browser for this hackathon demo — nothing is uploaded.
              </p>
              <div className="mt-5 flex flex-col gap-5">
                {SOCIAL_ICONS.filter((icon) => sources.includes(icon.id)).map((icon) => (
                  <div key={icon.id}>
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <SocialGlyph icon={icon} className="size-5 text-slate-700" />
                      What we need from {icon.label}
                    </span>
                    <ol className="ml-6 mt-3 flex flex-col gap-2">
                      <li className="flex gap-2.5 text-sm text-slate-600">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf0f6] text-[11px] font-bold text-slate-900">
                          1
                        </span>
                        <span>
                          Make sure you&apos;ve got the{' '}
                          <a
                            href={EXTENSION_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold underline decoration-dashed underline-offset-4 hover:text-[#2a8cff]"
                          >
                            ListeningKit Chrome extension
                          </a>{' '}
                          installed.
                        </span>
                      </li>
                      <li className="flex gap-2.5 text-sm text-slate-600">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf0f6] text-[11px] font-bold text-slate-900">
                          2
                        </span>
                        <span>
                          Navigate to{' '}
                          <a
                            href={PLATFORM_SITES[icon.id]?.url ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold underline decoration-dashed underline-offset-4 hover:text-[#2a8cff]"
                          >
                            {PLATFORM_SITES[icon.id]?.label ?? icon.label}
                          </a>{' '}
                          and log in.
                        </span>
                      </li>
                      <li className="flex gap-2.5 text-sm text-slate-600">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf0f6] text-[11px] font-bold text-slate-900">
                          3
                        </span>
                        <span>Open up the Chrome extension and copy the cookie information it pulls out.</span>
                      </li>
                      <li className="flex gap-2.5 text-sm text-slate-600">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf0f6] text-[11px] font-bold text-slate-900">
                          4
                        </span>
                        <span>Enter the information below into the input.</span>
                      </li>
                    </ol>
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {icon.label} token
                      </span>
                      <input
                        type="password"
                        value={tokens[icon.id] ?? ''}
                        onChange={(e) => {
                          setTokens((prev) => ({ ...prev, [icon.id]: e.target.value }))
                          setSaved(false)
                        }}
                        placeholder={`Paste your ${icon.label} token`}
                        autoComplete="off"
                        className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none"
                      />
                    </label>
                  </div>
                ))}
              </div>
<Button
                type="button"
                onClick={() => {
        if (saving) return
        setSaving(true)
        setSaved(false)
        window.setTimeout(() => {
          setSaving(false)
          setSaved(true)
          window.setTimeout(() => {
            setStep(3)
            setSaved(false)
          }, 900)
        }, 1500)
      }}
                disabled={saving}
                size="xl"
                shadow="hard"
                variant={saved && !saving ? 'default' : 'blue'}
                className={`mt-6 h-14 w-full rounded-xl px-10 font-bold text-white disabled:opacity-80 ${
                  saved && !saving ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                }`}
              >
                {saving ? (
                  <>
                    <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-label="Saving">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving…
                  </>
                ) : saved ? (
                  'Saved'
                ) : (
'Save tokens'
)}
                </Button>
              </div>
           </div>
           </div>
         </div>
       )}

      {step === 3 && <ReadyFill />}
      </div>
    </div>
  )
}
