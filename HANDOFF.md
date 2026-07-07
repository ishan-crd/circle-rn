# Circle (React Native) — Engineering Handoff

> A SwiftUI iOS app ported to **React Native (Expo, TypeScript)**. Circle is a
> **make-friends** app: you see one profile at a time, **like** or **pass**
> (5 likes/day), and a **mutual like → match → chat**. Matching is driven by
> **shared interests**.
>
> This document is the single source of truth for the RN app. Read it before
> substantial work. The canonical product/behavior reference is the original
> SwiftUI app at **`/Users/ishangupta/Desktop/coterie-ios`** (see its
> `HANDOFF.md`) — when in doubt about intended UX, compare against it.

---

## 0. TL;DR for a new agent

- **Same backend as iOS.** This app talks to the **same live Supabase project**
  (`https://zkoweftcxxnmytnezmcf.supabase.co`). Do **not** create a new DB. All
  schema/RPCs/edge functions already exist and are shared. To change the DB, use
  the Supabase MCP tools against that project (and keep the iOS app in mind).
- **State lives in one Zustand store** (`src/store.ts`) — the port of the iOS
  `AppState`. Almost everything flows through it.
- **Design system** is `src/theme.ts` (`CT` tokens + `serif()/grotesk()/eyebrow()`).
  Never hardcode colors/fonts; use these.
- **Verify your work** with `npx tsc --noEmit` (must stay clean) and
  `npx expo export --platform ios --output-dir /tmp/out` (must bundle). Both are
  green right now.
- Full runtime needs a **dev build** (`npx expo run:ios`), not Expo Go, because
  of native modules (Apple auth, Reanimated, notifications, image picker).

---

## 1. Tech stack

- **Expo SDK 57**, **React Native 0.86**, **New Architecture enabled**.
- **TypeScript** throughout.
- **Zustand 5** for state (`src/store.ts`).
- **react-native-reanimated 4** for animations (worklets plugin in
  `babel.config.js` — must stay last).
- **@supabase/supabase-js 2** + `@react-native-async-storage/async-storage` +
  `react-native-url-polyfill` for the backend.
- **@expo-google-fonts** Cormorant Garamond (serif) + Hanken Grotesk (grotesk).
- **expo-image, expo-linear-gradient, expo-blur, @expo/vector-icons** (Ionicons).
- **expo-apple-authentication, expo-web-browser** (Google OAuth),
  **expo-notifications, expo-image-picker, expo-crypto, base64-arraybuffer**.

No navigation library: navigation is **state-driven** (like the SwiftUI app).
`RootView` switches on `stage`; the tab bar is custom; sheets are RN `Modal`s.

---

## 2. Project layout

```
App.tsx                 // entry: loads fonts, providers, calls store.bootstrap(), renders RootView
babel.config.js         // babel-preset-expo + react-native-worklets/plugin (LAST)
app.json                // name "Circle", bundleId com.circlein.app, scheme circlein, plugins, iOS infoPlist
src/
  theme.ts              // CT color tokens; serif()/grotesk()/eyebrow(); Fonts; fontsToLoad
  types.ts              // domain models (UserProfile, Member, Conversation…) + age/birthday helpers
  data.ts               // CTData port: PRONOUNS, SEEKING, PROMPTS, INTERESTS, slugify, seedFor
  lib/
    supabase.ts         // Supabase client (shared project url + publishable key)
    service.ts          // backend gateway — port of SupabaseService.swift
  store.ts              // the Zustand store — port of AppState.swift (the brain)
  components/
    ui.tsx              // shared components: Text, PillButton, ProfilePhoto, ChoiceChip,
                        //   UnderlineField, TagPill, LogoMark, PortraitGradient, Pressed, Eyebrow
  RootView.tsx          // routes on stage; hosts overlays (Match/Like) + sheets (Chat/Detail/Edit)
  screens/
    Auth.tsx            // Apple / Google / email-OTP (email sheet is in-file)
    Onboarding.tsx      // all 10 steps + progress chrome
    MainTabs.tsx        // custom frosted GlassTabBar + active-tab switch
    Today.tsx           // Explore: one profile, pass swipe-away, like → composer
    Gallery.tsx         // browse feed as big cards
    Invites.tsx         // people who liked you (get_likers), note = shared interests
    Messages.tsx        // conversation list
    Profile.tsx         // own profile + settings + delete account
    Chat.tsx            // 1:1 conversation (send + realtime)
    ProfileDetail.tsx   // full member profile sheet (from Gallery/Invites) + pass/like
    EditProfile.tsx     // edit own profile (reuses onboarding building blocks)
    MatchMoment.tsx     // "It's a match" celebration overlay
    LikeComposer.tsx    // greeting-on-like bottom sheet
```

Mapping to the SwiftUI source (same folder names under `coterie-ios/Circle/`):
`AppState.swift`→`store.ts`, `SupabaseService.swift`→`lib/service.ts`,
`Theme/Theme.swift`→`theme.ts`+`components/ui.tsx`, `Views/*`→`screens/*`.

---

## 3. The store (`src/store.ts`) — the brain

Single Zustand store created with `create<Store>()`. Access it two ways:

```ts
// In components (reactive; re-renders on change):
const tab = useStore((s) => s.tab);
const s = useStore();                 // whole state (fine for screens)

// Outside React / imperatively:
useStore.getState().someAction();
useStore.setState({ paused: true });
```

**Selectors are exported functions** (not methods) that take the store value:
`exploreCandidates(s)`, `sharedInterests(s, member)`, `memberOf(s, id)`,
`promptQuestion(s, id)`, `interestLabels(s)`, `myTopics(s)`. Call them as
`exploreCandidates(useStore.getState())` or `exploreCandidates(s)` with `s = useStore()`.

### Key state fields
`stage` (loading|auth|onboarding|app), `tab`, `profile` (UserProfile),
`onboardingStep` (index into `ONBOARDING_STEPS`), `feed: Member[]`,
`passedIDs/likedIDs`, `likesRemaining`, `matchedMember`, `pendingLike`,
`knownMembers` (id→Member), `memberPhotos` (id→url[]), `invitations`,
`conversations` (id→Conversation) + `conversationOrder`, `matchIDs` (memberId→matchId),
`interestOptions`/`promptOptions` (vocab), `notifications`, `paused`,
`authBusy`/`authError`, `exploreTopics`, `activeSheet`.

### Key actions (names match iOS AppState intent)
- Boot/auth: `bootstrap()`, `enterSignedIn()`, `signInWithApple()`,
  `signInWithGoogle()`, `sendEmailCode()`, `verifyEmailCode()`.
- Loads: `loadVocabularies()`, `loadSignedInData()`, `refreshFeed()`,
  `refreshLikes()`, `refreshLikers()`, `refreshConversations()`, `startRealtime()`.
- Onboarding/profile: `patchProfile(patch)`, `toggleInterest()`, `setPrompt()`,
  `canAdvance(stepName)`, `nextStep()`, `prevStep()`, `completeOnboarding()`,
  `saveProfileEdits()`.
- Explore: `passMember(id)`, `beginLike(id)` (opens composer), `cancelLike()`,
  `confirmLike(note)`, `likeMember(id, note?)`, `messageMatch()`, `dismissMatch()`,
  `resetDeck()`, `toggleTopic()`, `clearTopics()`.
- Sheets/chat: `openProfile(id)`, `openChat(id)`, `closeSheet()`, `send(text, id)`.
  (Edit sheet is opened via `useStore.setState({ activeSheet: { type: 'edit' } })`.)
- Account/push: `setNotifications()`, `logout()`, `deleteAccount()`,
  `syncPushRegistration()`, `registerPushToken()`.

### Important internal helpers (bottom of store.ts)
`applyProfileRow` (DB row → local profile), `loadOwnExtras` (own interests/
prompts/photos), `materialize` / `materializeProfile` (build a `Member` from a
row + fetch its interests/prompts/photo URLs into `knownMembers`/`memberPhotos`),
`pushProfile` (upsert profile + replace interests/prompts; **photo upload is a
stubbed hook — see §7**), `friendlyAuthError` (maps raw errors to human text).

---

## 4. Navigation model

`RootView` renders by `stage`:
- `loading` → spinner (during `bootstrap`)
- `auth` → `Auth`
- `onboarding` → `Onboarding`
- `app` → `MainTabs`

Over the top, `RootView` also renders:
- `LikeComposer` when `pendingLike` is set,
- `MatchMoment` when `matchedMember` is set,
- a full-screen `Modal` for `activeSheet` → `Chat` / `ProfileDetail` / `EditProfile`.

`MainTabs` swaps the active screen on `tab` and draws the custom `GlassTabBar`
(a `BlurView` with Ionicons; invites badge from `invitations.length`).

---

## 5. Backend contract (shared Supabase project)

Client: `src/lib/supabase.ts` (URL + **publishable** key — safe to ship). Auth
persists to AsyncStorage. All access via `Service` in `src/lib/service.ts`.

**Tables** (all RLS, own-row): `profiles`, `profile_photos`, `profile_interests`,
`profile_prompts`, `interests`, `prompts`, `interactions`, `matches`, `messages`,
`device_tokens`.

**RPCs** used:
- `get_discovery_feed(p_topics, p_limit)` → the FYP: other onboarded, non-paused,
  non-deleted users you haven't acted on, ranked by shared-interest count.
- `act_on_profile(p_target, p_action, p_note?)` → like/pass; enforces 5/day;
  mutual like → match; a `p_note` greeting seeds the conversation on match.
- `likes_remaining()`, `get_likers()`.
- `deactivate_account()` / `reactivate_account()` (soft-delete: keeps the auth
  user + row, wipes profile data; reactivates on next sign-in).

**Storage**: bucket `photos`, path `{uid}/{uuid}.jpg`.

**Realtime**: `startRealtime()` subscribes to INSERTs on `public.messages` and
appends incoming messages (ignoring own).

**Edge functions** (already deployed, shared with iOS):
- `send-auth-email` — branded email OTP via Resend (Send Email Hook).
- `push-notify` — APNs push on new message/match (DB webhooks). RN registers
  device tokens into `device_tokens`; delivery reuses this function.

> Auth notes: email OTP length must be **6** (the UI caps input at 6). Google
> uses Supabase OAuth via `expo-web-browser` with redirect `circlein://auth-callback`
> — that redirect must be in the Supabase URL allow-list.

---

## 6. Conventions

- **Colors/fonts:** only from `theme.ts`. Text uses `serif(size, weight?)` or
  `grotesk(size, weight?)`; small caps labels use `eyebrow(color?, tracking?)`.
  Use the `Text` from `components/ui.tsx` (it disables font scaling).
- **Photos:** always render via `ProfilePhoto` (fills + clips via `overflow:hidden`
  so a wide image can never blow out layout — this was a real bug class on iOS;
  keep any photo inside a fixed-size, `overflow:hidden` container).
- **Buttons:** `PillButton` (filled/outline) and `Pressed` (press-scale wrapper).
- **Selectors** are functions, not store methods (see §3).
- **Do not** put secrets in the repo. The Supabase publishable key + Google
  client id are public by design; APNs/Resend keys live only in Supabase.
- Keep `tsc --noEmit` clean. Prefer explicit types over `any`.

---

## 7. Known gaps / good first tasks

1. **Photo upload finalize.** Onboarding/EditProfile store local `file://` URIs
   in `profile.photos`. `pushProfile` has a hook where local photos should be
   read as base64 and sent through `Service.uploadPhoto(base64, position)`.
   Use `expo-image-picker` with `base64: true` (or `expo-file-system` to read
   the URI) and upload dirty slots on save. **This is the top TODO.**
2. **Location step.** Onboarding `city` is a plain text field; the SwiftUI app
   has a map picker (`LocationPicker.swift`). Port with `react-native-maps` +
   `expo-location` if desired.
3. **Google redirect.** Confirm `circlein://auth-callback` is in Supabase Auth
   URL config; test the `expo-web-browser` flow on a dev build.
4. **Push delivery.** Token registration is wired; verify APNs env + that
   `getDevicePushTokenAsync` returns an APNs token on a dev build.
5. **Match/empty-state parity.** Compare each screen against the SwiftUI
   original for spacing/typography and tighten.
6. **App icon / splash.** Replace the Expo default assets with the Circle icon
   (cream serif "C" on `#E0674A`).

---

## 8. Build / verify / run

```bash
npm install

# Static checks (keep these green):
npx tsc --noEmit
npx expo export --platform ios --output-dir /tmp/circle-export

# Run (dev build required for native modules):
npx expo run:ios          # iOS simulator dev client
npx expo run:android      # Android
npx expo start            # JS-only iteration (limited without native modules)
```

Current status: **tsc clean; iOS bundle succeeds (~1300 modules).**

---

## 9. Gotchas

- **Reanimated:** the worklets babel plugin must be **last** in `babel.config.js`.
  After changing babel config, restart Metro with `--clear`.
- **`babel-preset-expo`** is a dev dependency — if you see "Cannot find module
  babel-preset-expo", run `npm install`.
- **Expo Go won't fully work** (Apple auth / notifications / some native modules);
  use a dev build.
- **Session persistence** is AsyncStorage; `bootstrap()` checks `expires_at` and
  reactivates a soft-deleted account on sign-in (mirrors iOS).
- **New Architecture** is on; prefer libraries that support it (all current deps do).
- When editing the **shared DB**, remember the **iOS app depends on the same
  schema** — coordinate changes.
