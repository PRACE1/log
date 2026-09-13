# AGENTS.md — listeningkit-hackathon

## Form Rules (2026-09-13)

- **No auto-advance on card select inside forms.** Selecting a card/row/tile
  inside a multi-step form only marks the selection — it must NEVER advance
  the step on its own. Every step advances exclusively through the sheet's
  Continue/confirm button.
- Pattern: selection state + a `*Confirmed` flag per gated step
  (`platformConfirmed`, `accountConfirmed`, `groupConfirmed`); the sheet's
  `onConfirm` branches per step (`Continue` vs the final action); Back
  un-confirms (and clears the pick, matching existing reset behavior).
- When touching any form, audit ALL of its steps for select-to-advance logic
  (`onSelect`/`onClick` handlers that call `setStep`, flip derived step
  state, or fire the fetch that unlocks the next step) and convert them to
  the Continue gate. Applies to `DashboardGroupsForm`, `DashboardKeywordsForm`,
  `DashboardListingsForm`, and any future form.
