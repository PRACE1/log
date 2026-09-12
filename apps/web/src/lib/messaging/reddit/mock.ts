import type { ChatMessage, Thread } from '../types'

export const REDDIT_THREADS: Thread[] = [
  {
    id: 'rd-t1',
    platform: 'reddit',
    participant: { name: 'u/dallasplumb911', initials: 'DP', color: '#FF4500' },
    preview: 'Sent you the cross streets, thanks!',
    updatedAt: '8:15 AM',
    unread: 3
  },
  {
    id: 'rd-t2',
    platform: 'reddit',
    participant: { name: 'u/diy_dan', initials: 'DD', color: '#14A800' },
    preview: 'Drained — hearing air in the pipes?',
    updatedAt: 'Mon',
    unread: 0
  }
]

export const REDDIT_MESSAGES: Record<string, ChatMessage[]> = {
  'rd-t1': [
    { id: 'rd-t1-m1', threadId: 'rd-t1', from: 'them', body: 'Toilet is still leaking after I tightened everything.', sentAt: '7:58 AM' },
    { id: 'rd-t1-m2', threadId: 'rd-t1', from: 'me', body: 'Probably the fill valve — I can swing by tomorrow, DM me your cross streets.', sentAt: '8:04 AM' },
    { id: 'rd-t1-m3', threadId: 'rd-t1', from: 'them', body: 'Sent you the cross streets, thanks!', sentAt: '8:15 AM' },
    {
      id: 'rd-t1-m4',
      threadId: 'rd-t1',
      from: 'them',
      body: 'Here’s the post we’re looking at — the floor is finally dry.',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
      sentAt: '8:19 AM'
    },
    {
      id: 'rd-t1-m5',
      threadId: 'rd-t1',
      from: 'me',
      body: 'Take a look at this — same setup, worth a follow.',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
      sentAt: '8:24 AM'
    }
  ],
  'rd-t2': [
    { id: 'rd-t2-m1', threadId: 'rd-t2', from: 'them', body: 'Shut the main off like you said.', sentAt: 'Mon' },
    { id: 'rd-t2-m2', threadId: 'rd-t2', from: 'me', body: 'Good — now drain the lowest faucet in the house.', sentAt: 'Mon' },
    { id: 'rd-t2-m3', threadId: 'rd-t2', from: 'them', body: 'Drained — hearing air in the pipes, is that normal?', sentAt: 'Mon' }
  ]
}
