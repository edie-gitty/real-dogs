# Real Dogs — Regression Test Checklist

Run this checklist after every change. Each item has an expected outcome — if anything fails, flag it before merging.

## 1. Homepage loads
- [ ] `index.html` loads without console errors
- [ ] Grain texture overlay visible
- [ ] "Real Dogs." logo appears top-left in Abril Fatface
- [ ] Hero heading with gradient "moment of fame." is visible
- [ ] Quiz widget with "Find the perfect pupcake" heading renders

## 2. Quiz entry
- [ ] Typing a name enables form submission
- [ ] Clicking "Take the Quiz →" opens the modal overlay
- [ ] Modal title shows "Pupcake Matchmaker"
- [ ] First visible question is "How big is [name]?" (Q2, not Q1)
- [ ] Dog name appears personalised throughout

## 3. Quiz navigation
- [ ] Back button closes modal on first question
- [ ] Next button is disabled or alerts when question not answered
- [ ] Progress bar advances correctly (e.g. Q3/12 = 25%)
- [ ] Back button goes to previous question (not to name step if started from widget)

## 4. Question validation
- [ ] **Size (Q2)**: Clicking Small/Large highlights card + updates profile
- [ ] **Allergies (Q3)**: Multi-select works; "None" is exclusive
- [ ] **Recipe (Q4)**: Single-select works
- [ ] **Occasion (Q5)**: Single-select, dog name appears in birthday option
- [ ] **Custom (Q6)**: Yes/No selects correctly
- [ ] **Q7 (if YES)**: Photo upload zone renders as full rectangle (not sliver)
- [ ] **Q7 (if NO)**: Dog library shows 6 cards with +/- qty controls
- [ ] **Contact (Q8)**: Mobile, DM preference work; IG handle box always visible
- [ ] **Story (Q9)**: Yes/Maybe/No selectable
- [ ] **Marketing (Q10)**: Yes/No selectable
- [ ] **Order date (Q11)**: Date picker enforces 2-week minimum
- [ ] **Email (Q12)**: Validates email format before showing recommendation

## 5. Discount nudges (dog library / Q7 if NO custom)
- [ ] Shows intro banner at 0 cupcakes
- [ ] Shows "Add X more to unlock 6-pack" at 1–5 cupcakes with pulsing animation + progress bar
- [ ] Shows "6-pack unlocked! Add X more" at 6–11 cupcakes
- [ ] Shows gold "Maximum discount unlocked!" at 12+ cupcakes
- [ ] Nudge bar sticks at top when scrolling the dog library

## 6. Profile card / mobile bottom sheet
- [ ] Desktop: aside panel shows on right, sticky on scroll
- [ ] Mobile: aside hidden; bottom bar shows with dog name + running total
- [ ] Bottom bar pulses magenta on state change (click, input, qty change)
- [ ] Tapping bottom bar opens full profile sheet
- [ ] Sheet header ("Tap to close") stays sticky while content scrolls
- [ ] Tapping overlay or header closes sheet

## 7. Recommendation panel (final step)
- [ ] Shows "Quiz complete!" + "Perfect for [name]"
- [ ] Lists selected criteria (size, allergies, recipe, occasion)
- [ ] Product card shows correct price:
  - Custom: `qty × base + qty × $1 + $5 art fee`
  - Random: `qty × tier_price` (6-pack or 12-pack applied)
- [ ] "Add to Cart" and "Browse All Products" buttons visible (not cut off)
- [ ] Back button labelled "← Modify Answers"

## 8. Responsive layout
- [ ] < 768px: single column, bottom sheet toggle visible
- [ ] ≥ 768px: two-column modal (question + profile aside)
- [ ] ≥ 1024px: larger hero, wider dog grid

## 9. Mobile-specific
- [ ] Touch targets ≥ 44×44px
- [ ] Photo upload opens native file picker
- [ ] Buttons on last quiz step clear the bottom nav + sheet toggle
- [ ] Sticky CTA shows after scrolling past hero, hides inside modal

## 10. Pricing matrix (verify recommendations)
| Size | Qty | Custom | Expected Price |
|---|---|---|---|
| small | 1 | no | $7 |
| small | 1 | yes | $13 ($7 + $1 + $5) |
| small | 6 | no | $36 ($6 × 6) |
| small | 6 | yes | $41 ($6 + $1 each + $5) |
| small | 12 | no | $60 |
| small | 12 | yes | $65 |
| large | 1 | no | $10 |
| large | 1 | yes | $16 |
| large | 6 | no | $54 |
| large | 6 | yes | $59 |
| large | 12 | no | $96 |
| large | 12 | yes | $101 |

## 11. Data persistence
- [ ] Clicking "Add to Cart" saves state to `localStorage` under `realdogs_profile`
- [ ] Profile contains: dogName, dogSize, allergies, recipe, occasion, wantsCustom, email, etc.
- [ ] Reload page: saved profile can be restored (once restore UI is built)

## 12. Edge cases
- [ ] Dog name with apostrophe renders correctly (e.g. "O'Malley")
- [ ] Empty/whitespace-only name does not start quiz
- [ ] Invalid email blocks "See My Recommendation"
- [ ] Selecting 0 dogs in library blocks Next
- [ ] Selecting no photos blocks Next in custom flow
- [ ] Browser back/forward does not break modal state

## 13. Browser compatibility
- [ ] Chrome latest
- [ ] Safari latest (iOS + macOS)
- [ ] Firefox latest
- [ ] Mobile Safari iOS (Felix's friends will mostly be on this)
- [ ] Mobile Chrome Android

---

## How to use this checklist

1. Before any deploy, open `index.html` locally
2. Walk through each section; tick items off
3. If anything breaks, file a note in git commit message
4. Re-run after fix

**Future work:** convert this into automated tests using Playwright or similar (separate session — requires extracting quiz logic into a testable module).
