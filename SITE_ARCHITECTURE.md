# Real Dogs Website Architecture

## 1. Quiz Flow & Data Collection

**Linear sequence with conditional branches:**

```
1. Dog Name (text input)
   ↓
2. Dog Size: Small | Large
   ↓
3. Allergies/Dietary (multi-select with badge)
   └─ Badge: "🐾 All our pupcakes are vegetarian & meat-free"
   ↓
4. Muffin Recipe: [Placeholder A] | [Placeholder B] | [Placeholder C]
   (Recipes TBC - user selects based on preference)
   ↓
5. Occasion: Birthday | Gift | Sweet Treat | Other
   ↓
6. Customize with [Name]'s face?
   ├─ YES → Photo Upload Modal (max 3 photos)
   │        └─ Guidance: lighting, background options, AI generation fee ($5 one-time)
   │        └─ Choose best photo after preview
   └─ NO → Browse Dog Library (curated 5-7 dogs)
            └─ Select one or more dog photos
            └─ For each selection: +/- qty controls (how many cupcakes?)
            └─ Running total: X cupcakes selected = $Y (auto-applies 6pk/12pk discounts)
            └─ Profile panel updates live with count + cost
   ↓
7. Contact Info
   - Mobile number
   - Preference: WhatsApp | Instagram DM
     ├─ If WhatsApp → use mobile number
     └─ If Instagram → ask for Instagram handle (@username)
                    → Prompt: "Please follow @realdogs on Instagram so we can DM you!"
                    → [Follow @realdogs] link/button
   ↓
8. Publish [Name]'s Real Dog Story?
   - YES | NO | MAYBE (we'll email you)
   ↓
9. Marketing Permission
   - "Can we feature [Name] in marketing/products?"
   - If YES: reference Real Dog Story page via links/QR codes
   ↓
10. Order Timeline
    - "When do you need your order by?"
    - Note: minimum 2 weeks notice
    ↓
11. Email (final)
    - Collect email for profile association + story follow-up
```

---

## 2. Right-Panel Profile Card (Dynamic)

**As they answer each question, the right panel updates with:**

```
┌─────────────────────────┐
│   [Dog Name]'s Profile  │
├─────────────────────────┤
│ 🐕 Size: Small / Large  │
│                         │
│ 🚫 Allergies:           │
│    • Gluten-free        │
│    • Dairy-free         │
│                         │
│ 🎉 Occasion:            │
│    Birthday             │
│                         │
│ 📸 Custom Photo:        │
│    ✓ Uploaded           │
│                         │
│ 📱 Contact:             │
│    WhatsApp             │
│                         │
│ 📖 Dog Story:           │
│    ✓ Yes, publish       │
│                         │
│ 🎨 Marketing:           │
│    ✓ Yes, use my pic    │
│                         │
│ 📅 Needed by:           │
│    [Date selected]      │
└─────────────────────────┘
```

---

## 3. Data Structure (Per Quiz Completion)

```javascript
{
  email: "user@example.com",
  dogName: "Felix",
  dogSize: "large",  // small | large
  allergies: ["gluten-free", "dairy-free"],
  muffinRecipe: "gluten-free-option",  // placeholder name TBC
  occasion: "birthday",  // birthday | gift | sweet-treat | other
  customization: {
    wantsCustom: true,
    photoUrls: ["url1", "url2", "url3"],  // max 3
    selectedPhotoUrl: "url1",
    fee: 5.00
  },
  contact: {
    mobile: "+61...",
    preference: "instagram",  // whatsapp | instagram
    instagramHandle: "@felix_the_pup",  // only if preference = instagram
    followsRealDogs: true  // confirmed they followed @realdogs
  },
  randomDogSelection: [  // only if wantsCustom = false
    { dogName: "Bailey", dogSlug: "bailey", quantity: 3 },
    { dogName: "Luna", dogSlug: "luna", quantity: 3 }
  ],
  totalCupcakes: 6,  // sum of all quantities in randomDogSelection
  calculatedPrice: 54.00,  // auto-applies pack discounts
  storyPermission: true,  // true | false | maybe
  marketingPermission: true,
  orderDeadline: "2026-05-15",
  recommendedProduct: {
    size: "large",
    quantity: 6,  // 1, 6, or 12
    customType: "custom",  // random | custom
    price: 59.00,
    recipe: "gluten-free-option"
  },
  timestamp: "2026-04-17T..."
}
```

**Storage:**
- Browser: localStorage + cookie (expires 30 days)
- Backend: Email as primary key (associate with Supabase dog_stories table)

---

## 4. Product Recommendation Matrix

**Pricing Structure (AUD):**

| Size | Qty | Random Dog Photo | Custom Dog Photo* |
|------|-----|------------------|-------------------|
| Small | 1 | $7 | $7 + $1 + $5 = $13 |
| Small | 6-pack | $6 each ($36 total) | $6 + $1 each + $5 = $41 total |
| Small | 12-pack | $5 each ($60 total) | $5 + $1 each + $5 = $65 total |
| Large | 1 | $10 | $10 + $1 + $5 = $16 |
| Large | 6-pack | $9 each ($54 total) | $9 + $1 each + $5 = $59 total |
| Large | 12-pack | $8 each ($96 total) | $8 + $1 each + $5 = $101 total |

*Custom = user's dog photo + $1/cupcake + $5 one-time art fee (reorder same design = no additional fee)

**Recommendation Logic (IF/THEN):**

| Size | Allergies | Recipe | Occasion | Custom? | Recommended | Reason |
|---|---|---|---|---|---|---|
| Small | None | Standard | Birthday | Yes | 1× Small Custom $13 | "Perfect for a birthday moment! [Name]'s face on their special treat." |
| Large | Gluten-free | GF Option | Gift | No | 6× Large Random $9 each | "Gluten-free, bigger celebration—great gift for a furry friend." |
| Small | Dairy-free | DF Option | Sweet Treat | No | 1× Small Random $7 | "Dairy-free cupcake for a quick sweet moment." |
| Large | Nut-free | NF Option | Birthday | Yes | 6× Large Custom $59 total | "Nut-free, birthday ready, [Name] gets to be the star! (saves $10 with 6-pack)" |

**Panel after quiz (shown before checkout):**
```
┌────────────────────────────────────┐
│  Perfect for [Name]!               │
├────────────────────────────────────┤
│ Based on your preferences:          │
│ ✓ Large cupcakes                    │
│ ✓ Gluten-free recipe                │
│ ✓ Birthday celebration              │
│ ✓ [Name]'s custom photo             │
│                                     │
│ We recommend:                       │
│ → Large Deluxe Pupcake + Custom     │
│   $23 each (includes $5 custom fee) │
│                                     │
│ "Your pup deserves the spotlight!" │
│                                     │
│ [Browse All Products] [Add to Cart] │
└────────────────────────────────────┘
```

---

## 5. Photo Upload Modal Flow

**Trigger:** User selects "Yes, customize with [Name]'s face"

**Modal Steps:**

1. **Instructions Panel**
   - "Upload up to 3 photos of [Name]"
   - Best practices:
     - Well-lit face photo
     - Clear view of markings
     - Background options: solid color, natural, decorated
   - File requirements: JPG/PNG, max 5MB each
   - Reassurance: "I'll use AI to generate the perfect image from your selection"
   - Fee callout: "$5 one-time customization fee (reorder same design free)"

2. **Upload Area**
   - Drag-and-drop zone
   - File picker button
   - Show uploaded photos with checkboxes

3. **Photo Preview & Selection**
   - Show all 3 uploaded photos
   - User selects which one to use (or "let AI pick the best")
   - Confirm and close modal

---

## 6. Post-Quiz Flow

**After they complete quiz & submit email:**

1. **Show recommendation panel** (see Section 4)
2. **Options:**
   - "Add to Cart" → Goes to cart with recommended product pre-selected
   - "Browse All Products" → Go to shop, filters auto-apply (allergies, size)
   - "Continue Shopping" → Back to quiz/home
3. **Save profile** 
   - localStorage (immediate)
   - Email as key for Supabase sync
4. **Send follow-up email** (if they opted into story)
   - "Hi [Name]'s parent! We're creating [Name]'s Real Dog Story..."
   - Link to form where they describe what the story should be about
   - AI will generate story based on their input
   - They'll see story preview + can request edits

---

## 7. Integration Points

**Email Association:**
- Email collected → unique profile key
- Profile stored in Supabase `user_profiles` table
- Linked to `dog_stories` table for story generation
- Used for order follow-up + story updates

**Dog Story Publishing:**
- If opted in, profile triggers email
- User fills form (Typeform or simple HTML form)
- AI generates story
- Story published to `/dogs/[slug]/` page with QR code
- QR code printed on product packaging

**Checkout Integration:**
- Quiz profile pre-fills email, contact info
- Recommended products pre-selected in cart
- Custom photo URL stored with order
- At fulfillment: AI image generation + photo applied to template

---

## 8. Allergies/Dietary List

- Gluten-free
- Dairy-free
- Nut-free (or specify: peanut-free, tree-nut-free)
- Vegan
- Egg-free
- Soy-free
- None / no allergies

---

## 9. Curated Dog Library (5-7 Options)

**"Browse Dogs Similar to [Name]"**

Used when user selects "No" to custom photo. Shows 5-7 curated dogs with:
- Dog name
- Breed/description
- Link to Real Dog Story page
- Option to select their dog's image for the cupcake

Example:
```
🐕 Bailey (Golden Retriever)
   → See Bailey's Story
   [Select Bailey's photo]

🐕 Luna (Husky)
   → See Luna's Story
   [Select Luna's photo]

🐕 Max (Dachshund)
   → See Max's Story
   [Select Max's photo]
```

Each links to `/dogs/[slug]/` where full story + QR code are displayed.

---

## 10. Homepage Layout & Mobile-Friendly Design

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  HEADER (nav + logo)                                    │
├─────────────────────────────────────────────────────────┤
│  HERO BANNER                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Quiz Widget (Modal Takeover Entry Point)        │   │
│  │                                                  │   │
│  │  "Find the Perfect Pupcake for [Name]"          │   │
│  │  [Subtitle: "Answer a few quick questions"]     │   │
│  │                                                  │   │
│  │  Dog Name: [________]  [TAKE THE QUIZ →]        │   │
│  │                                                  │   │
│  │  (Or browse without the quiz below)             │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  PRODUCT SHOWCASE (6 products grid or carousel)         │
│  ┌─────────┬─────────┬─────────┐                       │
│  │ Product │ Product │ Product │                       │
│  ├─────────┼─────────┼─────────┤                       │
│  │ Product │ Product │ Product │                       │
│  └─────────┴─────────┴─────────┘                       │
├─────────────────────────────────────────────────────────┤
│  SECTION: "Meet the Real Dogs"                         │
│  [5-7 curated dogs with links to stories]              │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
└─────────────────────────────────────────────────────────┘

Sticky CTA (floating button or persistent banner):
┌─────────────────────────────────────────────────────┐
│ 🐾 Find [Name]'s Perfect Cupcake  [QUIZ →]         │
└─────────────────────────────────────────────────────┘
```

**Mobile Layout:**
```
┌──────────────────────────┐
│ HEADER (hamburger menu)  │
├──────────────────────────┤
│ HERO (full width)        │
│ "Find the Perfect..."    │
│ Quiz widget (single col) │
│ [TAKE QUIZ CTA]          │
├──────────────────────────┤
│ PRODUCT SHOWCASE         │
│ (vertical scroll/grid)   │
├──────────────────────────┤
│ MEET THE REAL DOGS       │
│ (carousel or stack)      │
├──────────────────────────┤
│ FOOTER                   │
└──────────────────────────┘

Sticky CTA (bottom floating button):
┌──────────────────────────┐
│ 🐾 TAKE THE QUIZ →      │  ← Fixed to bottom
└──────────────────────────┘
```

**Quiz Modal Takeover (Full-Screen):**
- Z-index high (covers entire viewport)
- Close button (X) top-right
- Left panel: Quiz question + input
- Right panel (desktop only): Profile card building in real-time
- Mobile: Profile card below question (stack vertically)
- Progress indicator (question 1 of 11, etc.)
- Next/Back buttons
- All form inputs touch-friendly (large tap targets)

**Sticky CTA Behavior:**
- Shows on scroll past hero
- Disappears when quiz modal is open
- Text: "🐾 Find [Dog Name]'s Perfect Cupcake" or "Take the Quiz for Personalized Recommendations"
- On mobile: full-width button at bottom (50px height)
- On desktop: floating button or sticky top bar

**Mobile-Friendly Considerations:**
- Single-column layout for quiz questions
- Large touch targets (minimum 44×44px)
- Profile card stacked below question (not side-by-side)
- Photo upload with native file picker
- Minimal scrolling within modal (questions fit viewport)
- Simplified product grid (1 column on mobile, 2-3 on desktop)
- Dog library cards: full-width on mobile, 2-3 across on desktop

---

## 11. Data Flow Diagram

```
Homepage
    ↓
User clicks "Take the Quiz" (hero widget or sticky CTA)
    ↓
Full-screen modal takeover opens
    ↓
Quiz questions collected (dog name → email)
    ├─ Dog name, size, allergies, recipe, occasion
    ├─ Photo upload (if custom) or dog library selection
    └─ Contact, story permission, marketing, deadline
    ↓
Profile stored: localStorage + Supabase (email key)
    ↓
Recommendation panel shown with:
    ├─ Why these products recommended
    ├─ Pricing breakdown (size + quantity + custom fee if applicable)
    └─ [Add to Cart] [Browse All] buttons
    ↓
User chooses:
    ├─ PATH A: Add Recommended → Cart (pre-filled)
    │   ↓
    │   Checkout (email pre-filled, order details)
    │   ↓
    │   Stripe payment
    │   ↓
    │   Order stored + email trigger
    │
    └─ PATH B: Browse All Products
        ↓
        Shop page (filters auto-apply: size, allergies, recipe)
        ↓
        Manual selection → Add to cart
        ↓
        Checkout (email & allergies pre-filled)
        ↓
        Stripe payment
        ↓
        Order stored + email trigger

If customization photo uploaded:
    ↓
Fulfillment: AI generates cupcake image
    ↓
Image applied to template
    ↓
Physical cupcakes printed + packaged

If storyPermission = true:
    ↓
Email sent: "Tell us about [Name]"
    └─ Link to form: What should [Name]'s story be about?
    ↓
User fills form
    ↓
AI generates story (using user input + Edie's writing)
    ↓
Story reviewed, approved, published
    ↓
Story page: /dogs/[slug]/
    ↓
QR code printed on packaging → links to story
```

