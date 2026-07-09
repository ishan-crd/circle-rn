<div align="center">

<img src="./assets/circle-logo.png" alt="Circle" width="120" />

# Circle

**Meet people who share your world.**

A calm, intentional way to find friends and connections through the things you actually care about — not endless swiping.

<br/>

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-1c1c1e?style=flat-square)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-backend-3ecf8e?style=flat-square&logo=supabase)

</div>

---

## ✦ What is Circle?

Circle is a mobile app for meeting people around shared interests. You build a small, honest profile, browse a curated daily feed filtered by topics you love — cooking, art, gardening, and more — and send a like with an optional hello. When two people like each other, it's a match, and the conversation opens up.

Beyond one-to-one chats, Circle has **Rooms** — group chats where you can bring your matches together, manage membership, and keep the good conversations going.

The whole experience is designed to feel unhurried and editorial: a warm paper palette, an elegant serif typeface, and gentle motion throughout — in both light and dark mode.

## ✦ Features

- **Curated daily feed** — discover people, filtered by the interests that matter to you
- **Thoughtful likes** — send a like with a personal greeting instead of a cold swipe
- **Real-time matching** — an animated "You're both in" moment the instant a match happens
- **1:1 chat** — clean, real-time messaging with your matches
- **Rooms (group chats)** — invite your matches into shared rooms with role-based control
  - Owners rename, delete, and promote admins
  - Owners & admins invite and remove members
  - Members accept, decline, and leave freely
- **Invites** — see who liked you and respond on your terms
- **Rich profiles** — photos, prompts, and interests that show who you really are
- **Light & dark mode** — a hand-tuned palette for both, following the system theme
- **Push & in-app notifications** — never miss a match or a message
- **Native polish** — animated splash, blur effects, spring animations, and haptic-quality motion

## ✦ Tech Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| **Framework**    | [Expo](https://expo.dev) SDK 57 · React Native 0.86 (New Architecture) |
| **Language**     | TypeScript                                                        |
| **State**        | [Zustand](https://github.com/pmndrs/zustand) 5                    |
| **Animation**    | [Reanimated](https://docs.swmansion.com/react-native-reanimated/) 4 · Gesture Handler |
| **Backend**      | [Supabase](https://supabase.com) — Postgres, Row-Level Security, RPCs, Realtime, Storage, Auth |
| **Auth**         | Apple Sign In · Email OTP                                          |
| **Media**        | expo-image · expo-image-picker                                    |
| **Notifications**| expo-notifications (push + in-app banners)                        |
| **Typography**   | Cormorant Garamond (serif) · Hanken Grotesk (sans)                |
| **UI accents**   | expo-blur · expo-linear-gradient · insyd-bottom-sheet             |

## ✦ Getting Started

**Prerequisites:** Node.js, the [Expo CLI](https://docs.expo.dev/), and Xcode / Android Studio for native builds.

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start
```

Circle relies on the New Architecture and native modules, so use a **development build** (or run on a simulator/device via `expo run:ios` / `expo run:android`) rather than Expo Go.

### Environment

Supabase credentials are required to connect to the backend. Configure them as expected by `src/lib/` before running against a live project.

## ✦ Project Structure

```
src/
├── screens/        Feature screens (Today, Chat, Rooms, Onboarding, …)
├── components/     Shared UI + design-system primitives
├── lib/            Supabase service layer & hooks
├── store.ts        Zustand store — app state, actions & realtime
├── theme.tsx       Palette, fonts & light/dark theming
├── types.ts        Shared TypeScript types
└── RootView.tsx    Top-level router & modal host
```

## ✦ Design

Circle is intentionally quiet. The visual language borrows from print — generous whitespace, a warm off-white "paper" surface, and a display serif for headlines paired with a clean grotesk for everything else. Motion is spring-based and restrained, meant to feel physical rather than flashy.

---

<div align="center">

Made with care by **Insyd** · [insyd.in/circle](https://insyd.in/circle)

</div>
