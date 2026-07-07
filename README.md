# Circle — React Native

A React Native (Expo, TypeScript) port of the SwiftUI **Circle** app (a
make-friends app: like/pass on profiles by shared interests, 5 likes/day, match
→ chat). This app talks to the **same live Supabase backend** as the iOS app —
same database, auth, RPCs, storage, realtime and edge functions. No separate
backend was created; both apps share one.

## Architecture (mirrors the SwiftUI app)

- `src/theme.ts` — design system: `CT` color tokens, `serif()/grotesk()/eyebrow()`
  helpers (Cormorant Garamond + Hanken Grotesk via `@expo-google-fonts`).
- `src/lib/supabase.ts` — Supabase client (AsyncStorage session persistence).
- `src/lib/service.ts` — backend gateway (port of `SupabaseService.swift`).
- `src/store.ts` — single Zustand store (port of `AppState.swift`): auth,
  onboarding, discovery, matching, chat, account, push.
- `src/components/ui.tsx` — shared components (`ProfilePhoto`, `PillButton`,
  `ChoiceChip`, `UnderlineField`, `LogoMark`, `PortraitGradient`, …).
- `src/RootView.tsx` — routes on `stage` (loading / auth / onboarding / app),
  hosts the match + like overlays and the chat / profile / edit sheets.
- `src/screens/` — every screen: `Auth`, `Onboarding`, `MainTabs` (custom glass
  tab bar), `Today` (explore w/ swipe animation), `Gallery`, `Invites`,
  `Messages`, `Profile`, `Chat`, `ProfileDetail`, `EditProfile`, `MatchMoment`,
  `LikeComposer`.

Signature animations are done with `react-native-reanimated`: the pass
swipe-away, the "It's a match" spring-in, and the like composer bottom sheet.

## Run it

This app uses native modules (Apple auth, Reanimated, notifications, image
picker), so it needs a **dev build** (not Expo Go) for full functionality:

```bash
npm install
npx expo run:ios      # builds & launches a dev client on the iOS simulator
# or, for the JS-only parts:
npx expo start
```

Typecheck / bundle check:

```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir /tmp/out
```

## Status / notes

- ✅ Typechecks clean and bundles (1300+ modules) with no errors.
- ✅ Wired end-to-end to the shared Supabase backend (auth, feed, like/pass,
  match, chat + realtime, invites, profile, account delete/reactivate, push
  token registration).
- **Apple Sign-In** works on a dev build (needs the entitlement, already in
  `app.json`).
- **Google Sign-In** uses Supabase OAuth via an in-app browser
  (`circlein://auth-callback`) — add that redirect to the Supabase URL config.
- **Push**: token registration + permission are wired; delivery uses the same
  `push-notify` edge function + APNs key already set up for iOS.
- **Location step** in onboarding is a plain text field (the SwiftUI map picker
  wasn't ported); everything else matches.
- Photo uploads: onboarding/edit store local URIs; wire base64 upload through
  `Service.uploadPhoto` when finalizing (hook point noted in `store.pushProfile`).
# circle-rn
# circle-rn
