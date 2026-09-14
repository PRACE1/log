import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Message, MessageList } from '@chatscope/chat-ui-kit-react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import './chat-theme.css'
import { ArrowUp, Mic, Paperclip, Smile, X } from 'lucide-react'
import {
  Button,
  useComposedRef,
  useSquircleBorder,
  useSquircleClip,
  useToast
} from '@listeningkit/ui'
import {
  getThreadMessages,
  getThreads,
  sendMessage,
  type ChatMessage,
  type MessagingPlatform,
  type Thread
} from '@/lib/messaging'
import { SOCIAL_ICONS, SocialGlyph, type SocialIcon } from '@/lib/social-icons'
import { DashboardTab } from './DashboardTab'

const MESSAGING_PLATFORM_BY_ICON: Record<string, MessagingPlatform> = {
  facebook: 'facebook',
  x: 'twitter',
  reddit: 'reddit'
}

function PlatformTab({ icon, active, onClick }: { icon: SocialIcon; active: boolean; onClick: () => void }) {
  return (
    <DashboardTab
      label={icon.label}
      icon={<SocialGlyph icon={icon} className="size-4" />}
      active={active}
      onClick={onClick}
    />
  )
}

function ThreadAvatar({ name, initials, color }: { name: string; initials: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      title={name}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  )
}

const BUBBLE_RADIUS = 10
const BUBBLE_TAIL_RADIUS = 2

function MessageBubble({ tone, image, children }: { tone: 'incoming' | 'outgoing'; image?: string; children: ReactNode }) {
  const clip = useSquircleClip<HTMLDivElement>(
    BUBBLE_RADIUS,
    1,
    tone === 'outgoing' ? { bottomRight: BUBBLE_TAIL_RADIUS } : { bottomLeft: BUBBLE_TAIL_RADIUS }
  )
  const imageOnly = Boolean(image) && !children
  const altText = typeof children === 'string' && children ? children : 'Shared image'

  return (
    <div
      ref={clip.ref}
      style={clip.style}
      className={`max-w-[420px] text-sm leading-relaxed ${imageOnly ? 'overflow-hidden' : 'px-4 py-2.5'} ${
        tone === 'outgoing' ? 'bg-[#2A8CFF] text-white' : 'bg-[#F1F5F9] text-text-primary'
      }`}
    >
      {image && <img src={image} alt={altText} loading="lazy" className="block w-full max-h-[320px] object-cover" />}
      {children}
    </div>
  )
}

const COMPOSER_RADIUS = 24

/**
 * Composer ported from prompt-kit's "prompt input with actions" pattern:
 * click-to-focus squircle shell, borderless auto-growing textarea on top,
 * full-width action bar underneath (left: attach + emoji, right: voice + send).
 */
function PromptComposer({ onSend }: { onSend: (body: string, image?: string) => void }) {
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clip = useSquircleClip<HTMLDivElement>(COMPOSER_RADIUS)
  const border = useSquircleBorder<HTMLDivElement>(COMPOSER_RADIUS + 2)
  const shellRef = useComposedRef(clip.ref, border.ref)

  const canSend = draft.trim().length > 0 || attachment !== null

  function adjustHeight(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  function send() {
    if (!canSend) return
    onSend(draft, attachment ?? undefined)
    setDraft('')
    setAttachment(null)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAttachment(URL.createObjectURL(file))
    }
    e.target.value = ''
  }

  return (
    <div
      ref={shellRef}
      style={clip.style}
      onClick={() => textareaRef.current?.focus()}
      className="relative w-full cursor-text bg-white transition-shadow"
    >
      {border.state.path && (
        <svg
          className="pointer-events-none absolute inset-0 block"
          width={border.state.width}
          height={border.state.height}
          viewBox={`0 0 ${border.state.width} ${border.state.height}`}
          style={{ overflow: 'visible' }}
          aria-hidden="true"
        >
          <path
            d={border.state.path}
            fill="none"
            stroke={focused ? '#2A8CFF' : '#E4E7EC'}
            strokeWidth={focused ? 2 : 1.5}
            style={{ transition: 'stroke 150ms ease, stroke-width 150ms ease' }}
          />
        </svg>
      )}
      <div className="flex h-full flex-col">
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            requestAnimationFrame(() => adjustHeight(e.target))
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
          }}
          placeholder="Send a message…"
          className="block min-h-[44px] w-full resize-none border-none bg-transparent px-4 pt-3 pb-1 text-[15px] leading-[1.35] text-text-primary outline-none placeholder:text-text-tertiary"
        />
        {attachment ? (
          <div className="flex px-4 pb-1">
            <span className="relative inline-block">
              <img src={attachment} alt="Attachment preview" className="h-20 w-20 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#1D2433] text-white transition-colors hover:bg-black"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        ) : null}
        <div className="flex w-full items-center justify-between gap-2 px-3 pb-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="icon-lg"
              className="rounded-full"
              title="Attach image"
              aria-label="Attach image"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
            </Button>
            <Button variant="outline" size="icon-lg" className="rounded-full" title="Insert emoji" aria-label="Insert emoji">
              <Smile size={18} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-lg" className="rounded-full" title="Voice message" aria-label="Voice message">
              <Mic size={18} />
            </Button>
            <Button
              type="button"
              disabled={!canSend}
              variant={canSend ? 'blue' : 'secondary'}
              size="icon-lg"
              className="rounded-full"
              title="Send message"
              aria-label="Send message"
              onClick={send}
            >
              <ArrowUp size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardMessages() {
  const { error: notifyError } = useToast()
  const [platform, setPlatform] = useState(SOCIAL_ICONS[0].id)
  const [threads, setThreads] = useState<Thread[] | null>(null)
  const [activeIds, setActiveIds] = useState<Partial<Record<MessagingPlatform, string>>>({})
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMessage[]>>({})
  const [loadingMessages, setLoadingMessages] = useState(false)

  const CHAT_SQUIRCLE_RADIUS = 20
  const chatClip = useSquircleClip<HTMLDivElement>(CHAT_SQUIRCLE_RADIUS)
  const chatBorder = useSquircleBorder<HTMLDivElement>(CHAT_SQUIRCLE_RADIUS)
  const chatPaneRef = useComposedRef(chatClip.ref, chatBorder.ref)

  const messagesPlatform = MESSAGING_PLATFORM_BY_ICON[platform] ?? 'facebook'
  const activeId: string | null = activeIds[messagesPlatform] ?? null

  useEffect(() => {
    let cancelled = false
    getThreads()
      .then((res) => {
        if (cancelled) return
        setThreads(res.threads)
        setActiveIds((prev) => {
          let changed = false
          const next = { ...prev }
          for (const t of res.threads) {
            if (!next[t.platform]) {
              next[t.platform] = t.id
              changed = true
            }
          }
          return changed ? next : prev
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          notifyError('Messages failed to load', err instanceof Error ? err.message : 'Could not load threads.')
          setThreads([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [notifyError])

  useEffect(() => {
    if (!activeId || messagesByThread[activeId]) return
    let cancelled = false
    const thread = threads?.find((t) => t.id === activeId)
    if (!thread) return
    setLoadingMessages(true)
    getThreadMessages(thread.platform, activeId)
      .then((res) => {
        if (!cancelled) setMessagesByThread((prev) => ({ ...prev, [activeId]: res.messages }))
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          notifyError('Messages failed to load', err instanceof Error ? err.message : 'Could not load messages.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeId, messagesByThread, threads, notifyError])

  function openThread(id: string) {
    setActiveIds((prev) => ({ ...prev, [messagesPlatform]: id }))
    setThreads((prev) => prev?.map((t) => (t.id === id ? { ...t, unread: 0 } : t)) ?? prev)
  }

  async function appendMessage(body: string, image?: string) {
    const text = body.trim()
    if ((!text && !image) || !activeId) return
    const thread = threads?.find((t) => t.id === activeId)
    const platform = thread?.platform ?? messagesPlatform
    const tempId = `${activeId}-local-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      threadId: activeId,
      from: 'me',
      body: text,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(image && { image })
    }
    setMessagesByThread((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), optimistic] }))
    setThreads((prev) => prev?.map((t) => (t.id === activeId ? { ...t, preview: text || 'Photo' } : t)) ?? prev)
    try {
      const res = await sendMessage(platform, activeId, text, image)
      setMessagesByThread((prev) => ({
        ...prev,
        [activeId]: (prev[activeId] ?? []).map((m) => (m.id === tempId ? res.message : m))
      }))
    } catch (err) {
      setMessagesByThread((prev) => ({
        ...prev,
        [activeId]: (prev[activeId] ?? []).filter((m) => m.id !== tempId)
      }))
      notifyError('Message failed to send', err instanceof Error ? err.message : 'Could not send message.')
    }
  }

  const visible = (threads ?? []).filter((t) => t.platform === messagesPlatform)
  const active = threads?.find((t) => t.id === activeId) ?? null
  const messages = activeId ? (messagesByThread[activeId] ?? []) : []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pt-5 pb-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="lk-no-scrollbar flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {SOCIAL_ICONS.map((icon) => (
              <PlatformTab key={icon.id} icon={icon} active={icon.id === platform} onClick={() => setPlatform(icon.id)} />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            {threads === null ? (
              <>
                <div className="h-16 animate-pulse rounded-xl bg-black/5" />
                <div className="h-16 animate-pulse rounded-xl bg-black/5" />
                <div className="h-16 animate-pulse rounded-xl bg-black/5" />
              </>
            ) : visible.length === 0 ? (
              <p className="rounded-xl bg-black/5 p-4 text-sm text-text-secondary">No conversations here yet.</p>
            ) : (
              visible.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => openThread(thread.id)}
                  aria-current={thread.id === activeId}
                  className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    thread.id === activeId ? 'bg-brand-600/10' : 'hover:bg-black/5'
                  }`}
                >
                  <ThreadAvatar
                    name={thread.participant.name}
                    initials={thread.participant.initials}
                    color={thread.participant.color}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-text-primary">
                        {thread.participant.name}
                      </span>
                      <span className="shrink-0 text-xs text-text-secondary">{thread.updatedAt}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-text-secondary">{thread.preview}</span>
                      {thread.unread > 0 && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2A8CFF] text-[11px] font-bold text-white">
                          {thread.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div
          ref={chatPaneRef}
          style={chatClip.style}
          className="relative flex min-h-80 min-w-0 flex-col overflow-hidden bg-white lg:min-h-0"
        >
          {chatBorder.state.path && (
            <svg
              className="pointer-events-none absolute inset-0 block z-10"
              width={chatBorder.state.width}
              height={chatBorder.state.height}
              viewBox={`0 0 ${chatBorder.state.width} ${chatBorder.state.height}`}
              style={{ overflow: 'visible' }}
              aria-hidden="true"
            >
              <path d={chatBorder.state.path} fill="none" stroke="#E4E7EC" strokeWidth={2} />
            </svg>
          )}
          {!active ? (
            <p className="m-auto text-sm text-text-secondary">Select a conversation to read it.</p>
          ) : (
<div className="cs-messenger absolute inset-0 flex flex-col bg-white">
                <header className="flex items-center gap-3 border-b border-[#E4E7EC] px-4 py-3">
                  <ThreadAvatar
                    name={active.participant.name}
                    initials={active.participant.initials}
                    color={active.participant.color}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-text-primary">{active.participant.name}</span>
                    {active.participant.handle ? (
                      <span className="truncate text-xs text-text-secondary">{active.participant.handle}</span>
                    ) : null}
                  </span>
                </header>
                <MessageList loading={loadingMessages && messages.length === 0}>
                  <MessageList.Content>
                    {messages.map((message, index) => (
                      <Message
                        key={message.id}
                        model={{
                          sentTime: message.sentAt,
                          sender: message.from === 'me' ? 'You' : active.participant.name,
                          direction: message.from === 'me' ? 'outgoing' : 'incoming',
                          position:
                            messages.length === 1 ? 'single' : index === 0 ? 'first' : index === messages.length - 1 ? 'last' : 'normal'
                        }}
                      >
                        <Message.CustomContent>
                          <MessageBubble tone={message.from === 'me' ? 'outgoing' : 'incoming'} image={message.image}>
                            {message.body}
                          </MessageBubble>
                        </Message.CustomContent>
                      </Message>
                    ))}
                  </MessageList.Content>
                </MessageList>
                <div className="px-4 pb-4 pt-2">
                  <PromptComposer onSend={(body, image) => appendMessage(body, image)} />
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  )
}