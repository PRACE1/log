export type MessagingPlatform = 'facebook' | 'twitter' | 'reddit'

export interface Participant {
  name: string
  handle?: string
  initials: string
  color: string
}

export interface Thread {
  id: string
  platform: MessagingPlatform
  participant: Participant
  preview: string
  updatedAt: string
  unread: number
}

export interface ChatMessage {
  id: string
  threadId: string
  from: 'me' | 'them'
  body: string
  sentAt: string
  image?: string
}

export interface ThreadsResponse {
  threads: Thread[]
}

export interface MessagesResponse {
  threadId: string
  messages: ChatMessage[]
}
