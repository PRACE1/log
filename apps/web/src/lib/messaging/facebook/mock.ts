import type { ChatMessage, Thread } from '../types'

export const FACEBOOK_THREADS: Thread[] = [
  {
    id: 'fb-t1',
    platform: 'facebook',
    participant: { name: 'Dana Whitfield', initials: 'DW', color: '#2A8CFF' },
    preview: 'Perfect, see you Thursday morning!',
    updatedAt: '9:41 AM',
    unread: 2
  },
  {
    id: 'fb-t2',
    platform: 'facebook',
    participant: { name: 'Marcus Webb', initials: 'MW', color: '#7C3AED' },
    preview: 'Do you charge extra for weekends?',
    updatedAt: 'Yesterday',
    unread: 0
  }
]

export const FACEBOOK_MESSAGES: Record<string, ChatMessage[]> = {
  'fb-t1': [
    { id: 'fb-t1-m1', threadId: 'fb-t1', from: 'them', body: 'Hi! Is Thursday still good for the faucet install?', sentAt: '9:12 AM' },
    { id: 'fb-t1-m2', threadId: 'fb-t1', from: 'me', body: 'Yes — I can be there between 8 and 10.', sentAt: '9:20 AM' },
    { id: 'fb-t1-m3', threadId: 'fb-t1', from: 'them', body: 'Perfect, see you Thursday morning!', sentAt: '9:41 AM' },
    {
      id: 'fb-t1-m4',
      threadId: 'fb-t1',
      from: 'them',
      body: 'Here’s the post we’re looking at — it looks a lot better now!',
      image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
      sentAt: '10:14 AM'
    },
    {
      id: 'fb-t1-m5',
      threadId: 'fb-t1',
      from: 'me',
      body: 'Take a look at this from the last install — same finish.',
      image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
      sentAt: '10:16 AM'
    }
  ],
  'fb-t2': [
    { id: 'fb-t2-m1', threadId: 'fb-t2', from: 'them', body: 'Hey, our kitchen sink is draining really slowly.', sentAt: 'Yesterday' },
    { id: 'fb-t2-m2', threadId: 'fb-t2', from: 'me', body: 'Sounds like a partial clog — I can snake it tomorrow if you like.', sentAt: 'Yesterday' },
    { id: 'fb-t2-m3', threadId: 'fb-t2', from: 'them', body: 'Do you charge extra for weekends?', sentAt: 'Yesterday' }
  ]
}
