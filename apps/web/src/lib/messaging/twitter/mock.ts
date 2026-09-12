import type { ChatMessage, Thread } from '../types'

export const TWITTER_THREADS: Thread[] = [
  {
    id: 'tw-t1',
    platform: 'twitter',
    participant: { name: 'Dallas Homeowner', handle: '@dallasplumb911', initials: 'DH', color: '#0F1419' },
    preview: 'You’re a lifesaver, thank you!',
    updatedAt: '10:02 AM',
    unread: 1
  },
  {
    id: 'tw-t2',
    platform: 'twitter',
    participant: { name: 'Mike Torres', handle: '@mike_torres', initials: 'MT', color: '#1D9BF0' },
    preview: 'Can you quote a water heater replacement?',
    updatedAt: 'Tue',
    unread: 0
  }
]

export const TWITTER_MESSAGES: Record<string, ChatMessage[]> = {
  'tw-t1': [
    { id: 'tw-t1-m1', threadId: 'tw-t1', from: 'them', body: 'Slab leak crew just left — floor is finally dry!', sentAt: '9:48 AM' },
    { id: 'tw-t1-m2', threadId: 'tw-t1', from: 'me', body: 'Great news! Keep an eye on the meter over the next few days.', sentAt: '9:55 AM' },
    { id: 'tw-t1-m3', threadId: 'tw-t1', from: 'them', body: 'You’re a lifesaver, thank you!', sentAt: '10:02 AM' },
    {
      id: 'tw-t1-m4',
      threadId: 'tw-t1',
      from: 'them',
      body: 'Here’s the post we’re looking at — shared it so more neighbors can see the result.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
      sentAt: '10:05 AM'
    },
    {
      id: 'tw-t1-m5',
      threadId: 'tw-t1',
      from: 'me',
      body: 'Take a look at this — that’s the spot before the patch set.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
      sentAt: '10:09 AM'
    }
  ],
  'tw-t2': [
    { id: 'tw-t2-m1', threadId: 'tw-t2', from: 'them', body: 'Hi! Our water heater is 12 years old and rumbling.', sentAt: 'Tue' },
    { id: 'tw-t2-m2', threadId: 'tw-t2', from: 'me', body: 'That’s end of life — I can quote a replacement this week.', sentAt: 'Tue' },
    { id: 'tw-t2-m3', threadId: 'tw-t2', from: 'them', body: 'Can you quote a water heater replacement?', sentAt: 'Tue' }
  ]
}
