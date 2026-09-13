import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Select, useToast } from '@listeningkit/ui'
import { getAccounts, type ConnectionRecord } from '../lib/connections'
import { createListing, saveListing, type ListingRecord } from '../lib/listings'
import { SOCIAL_ICONS, SocialBadge, type SocialIcon } from '../lib/social-icons'
import { DashboardFormSheet } from './DashboardFormSheet'
import { EmptyLine, FormInput, LoadingLine, PickRow } from './DashboardFormPrimitives'

const facebookIcon: SocialIcon = SOCIAL_ICONS.find((icon) => icon.id === 'facebook') ?? SOCIAL_ICONS[0]

// The category / condition lists mirror the marketplace schemas the mock
// rows were captured from (facebook-camofox-client), so form output always
// lands in a bucket the status poller understands.
const CATEGORIES = ['Household', 'Furniture', 'Electronics', 'Clothing', 'Services']
const CONDITIONS = ['New', 'Used - like new', 'Used - good', 'Used - fair']
const CONDITION_NONE = 'n/a'

// Marketplace fans up to four 9:16 photos per listing (MarketplaceImages);
// the picker enforces the same cap, first pick = cover.
const MAX_PHOTOS = 4

/**
 * Publish a Facebook Marketplace listing. Three steps, in order:
 *  - pick one of the connected facebook accounts (the draft's `account` is
 *    the same label space as lib/connections) — auto-advances on select,
 *  - the details block (title / price / category / condition / location) —
 *    advances on Continue once valid,
 *  - the photos: a file picker that reads up to four images as data URLs.
 * The draft goes out through `POST /listings` (which rejects photo-less
 * drafts) and comes back as `under-review` until the client clears it.
 *
 * Edit mode (`initialListing`): pre-fills every field and jumps straight to
 * the details step with the account scope fixed — Back is hidden and the
 * final confirm saves through `PATCH /listings/:id` instead of creating.
 */
export function DashboardListingsForm({
  open,
  onClose,
  onCreated,
  initialListing = null
}: {
  open: boolean
  onClose: () => void
  /** Fires after a successful create so the parent page can reconcile. */
  onCreated: () => void
  /** Edit this listing instead of creating one: jumps to the details step. */
  initialListing?: ListingRecord | null
}) {
  const { success, error: notifyError } = useToast()
  const editing = initialListing ?? null
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [accounts, setAccounts] = useState<ConnectionRecord[] | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  // Picking an account only marks the row — Continue flips this and
  // unlocks the details step, so step one never auto-advances.
  const [accountConfirmed, setAccountConfirmed] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [condition, setCondition] = useState(CONDITION_NONE)
  const [location, setLocation] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const fbAccounts = (accounts ?? []).filter(
    (account) => account.platform === 'facebook' && account.connectedAt !== null
  )

  useEffect(() => {
    if (!open) return
    // Edit mode pre-fills from the record and jumps to details; create mode
    // starts blank on the account pick.
    setStep(editing ? 2 : 1)
    setAccounts(null)
    setAccountId(null)
    setAccountConfirmed(editing !== null)
    setTitle(editing?.title ?? '')
    setPrice(editing?.price ?? '')
    setCategory(editing?.category ?? CATEGORIES[0])
    setCondition(editing?.condition ?? CONDITION_NONE)
    setLocation(editing?.location ?? '')
    setImages(editing ? [...editing.images] : [])
    setBusy(false)
    // The account step never renders in edit mode, so no roster to load.
    if (!editing) {
      getAccounts()
        .then(setAccounts)
        .catch(() => setAccounts([]))
    }
  }, [open, initialListing])

  const detailsValid = title.trim() !== '' && /^\d+$/.test(price.trim()) && location.trim() !== ''

  const stepHint =
    step === 1
      ? 'Pick the account, then press Continue.'
      : step === 2
        ? 'Title, price, and delivery area.'
        : 'Add at least one photo — the first one is the cover.'

  function back() {
    if (step === 3) {
      setStep(2)
      return
    }
    setStep(1)
    setAccountId(null)
    setAccountConfirmed(false)
  }

  // Step one's Continue: confirm the account pick and unlock details.
  // Selecting a row only marks it, so the advance lives here.
  function continueFromAccount() {
    if (accountId === null || accountConfirmed || busy) return
    setAccountConfirmed(true)
    setStep(2)
  }

  async function confirm() {
    if (busy) return
    if (step === 2) {
      if (detailsValid) setStep(3)
      return
    }
    if (step < 3) return
    if (images.length === 0) return
    const draft = {
      title: title.trim(),
      price: price.trim(),
      category,
      condition: condition === CONDITION_NONE ? null : condition,
      location: location.trim(),
      images
    }
    setBusy(true)
    try {
      if (editing) {
        // Account scope is fixed in edit mode — the stored label rides along.
        const record = await saveListing(editing.listingId, { ...draft, account: editing.account })
        success(`“${record.title}” updated`, 'Changes are live on the listing.')
      } else {
        const account = fbAccounts.find((fb) => fb.id === accountId)
        if (!account) return
        const record = await createListing({ ...draft, account: account.label })
        success(`“${record.title}” published`, 'Under review on Facebook Marketplace.')
      }
      onCreated()
      onClose()
    } catch (err: unknown) {
      notifyError(
        editing ? 'Could not save the listing' : 'Could not publish the listing',
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardFormSheet
      open={open}
      title={editing ? 'Edit listing' : 'New listing'}
      subtitle="Publish to Facebook Marketplace — it lands under review until the client clears it."
      step={step}
      stepCount={3}
      stepHint={stepHint}
      busy={busy}
      confirmLabel={step === 1 ? 'Continue' : step === 2 ? 'Continue' : step === 3 ? (editing ? 'Save changes' : 'Publish listing') : undefined}
      confirmDisabled={step === 1 ? accountId === null : step === 2 ? !detailsValid : images.length === 0}
      onConfirm={step === 1 ? continueFromAccount : confirm}
      onBack={back}
      backDisabled={step === 1 || editing !== null}
      onClose={onClose}
    >
      {step === 1 ? (
        accounts === null ? (
          <LoadingLine label="Loading connected accounts…" />
        ) : fbAccounts.length === 0 ? (
          <EmptyLine label="No connected Facebook accounts yet — connect one in Settings first." />
        ) : (
          <div className="flex flex-col gap-2">
            {fbAccounts.map((account) => (
              <PickRow
                key={account.id}
                active={accountId === account.id}
                onClick={() => setAccountId(account.id)}
                label={account.label}
                sub={account.viaProxy ? 'via proxy' : 'direct connection'}
                icon={<SocialBadge icon={facebookIcon} />}
              />
            ))}
          </div>
        )
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <Field label="Title" required>
            <FormInput
              type="text"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Rubbish Removal in Galway"
              autoComplete="off"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (€)" required>
              <FormInput
                type="number"
                min={0}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="50"
              />
            </Field>
            <Field label="Category">
              <Select
                value={category}
                onChange={(value) => setCategory(value)}
                aria-label="Listing category"
                options={CATEGORIES.map((name) => ({ value: name, label: name }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Condition">
              <Select
                value={condition}
                onChange={(value) => setCondition(value)}
                aria-label="Listing condition"
                options={[
                  { value: CONDITION_NONE, label: 'Not applicable' },
                  ...CONDITIONS.map((name) => ({ value: name, label: name }))
                ]}
              />
            </Field>
            <Field label="Location" required>
              <FormInput
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Galway, Ireland"
                autoComplete="off"
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <ImageStep
          images={images}
          busy={busy}
          onAdd={setImages}
          onRemove={(index) => setImages((current) => current.filter((_, i) => i !== index))}
        />
      ) : null}
    </DashboardFormSheet>
  )
}

function ImageStep({
  images,
  busy,
  onAdd,
  onRemove
}: {
  images: string[]
  busy: boolean
  onAdd: (next: string[]) => void
  onRemove: (index: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const room = MAX_PHOTOS - images.length
    const files = Array.from(list)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, room)
    if (files.length === 0) return
    setReading(true)
    try {
      const urls = await Promise.all(files.map(readFile))
      onAdd([...images, ...urls].slice(0, MAX_PHOTOS))
    } catch {
      // A single unreadable file shouldn't sink the whole batch — retry and
      // keep whichever ones decode.
      const urls = (
        await Promise.all(files.map((file) => readFile(file).catch(() => null)))
      ).filter((url): url is string => url !== null)
      if (urls.length > 0) onAdd([...images, ...urls].slice(0, MAX_PHOTOS))
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: MAX_PHOTOS }, (_, slot) => {
          const src = images[slot]
          return src !== undefined ? (
            <div key={slot} className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-black/10">
              <img src={src} alt={`Listing photo ${slot + 1}`} className="h-full w-full object-cover" />
              {slot === 0 ? (
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Remove photo ${slot + 1}`}
                disabled={busy}
                onClick={() => onRemove(slot)}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              key={slot}
              type="button"
              disabled={busy || reading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[9/16] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-text-secondary transition-colors hover:border-[#2A8CFF] hover:text-[#2A8CFF] disabled:opacity-50"
            >
              {reading ? (
                <span className="text-xs font-semibold">Reading…</span>
              ) : (
                <>
                  <ImagePlus size={18} strokeWidth={2} aria-hidden="true" />
                  <span className="text-[11px] font-semibold">{slot === 0 ? 'Add photo' : 'Add'}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-text-secondary">
        Up to {MAX_PHOTOS} photos — the first is the cover. JPG / PNG, straight from your device.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
    </div>
  )
}

function Field({
  label,
  required,
  children
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-[#2A8CFF]"> *</span> : null}
      </span>
      {children}
    </label>
  )
}