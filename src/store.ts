// Global app state — mirrors coterie-ios/Circle/Store/AppState.swift.
// Single Zustand store; all screens read/act through it.

import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { supabase } from './lib/supabase';
import { Service, FeedRow, ProfileRow } from './lib/service';
import { INTERESTS, PROMPTS, promptText, seedFor, slugify } from './data';
import {
  AppStage, MainTab, Member, UserProfile, Conversation, Invitation,
  emptyProfile, isValidBirthday, DAILY_LIKES,
} from './types';

export const ONBOARDING_STEPS = [
  'welcome', 'name', 'birthday', 'photos', 'about', 'city', 'work', 'prompt', 'interests', 'review',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type ActiveSheet = { type: 'profile' | 'chat' | 'edit'; id?: string } | null;

interface State {
  stage: AppStage;
  tab: MainTab;
  profile: UserProfile;
  onboardingStep: number;

  feed: Member[];
  feedLoading: boolean;
  passedIDs: string[];
  likedIDs: string[];
  likesRemaining: number;
  matchedMember: Member | null;
  pendingLike: Member | null;

  knownMembers: Record<string, Member>;
  memberPhotos: Record<string, string[]>;
  invitations: Invitation[];
  conversations: Record<string, Conversation>;
  conversationOrder: string[];
  matchIDs: Record<string, string>; // memberId -> matchId

  interestOptions: [string, string][]; // [slug, label]
  promptOptions: [string, string][]; // [id, question]

  notifications: boolean;
  paused: boolean;

  authBusy: boolean;
  authError: string | null;
  exploreTopics: string[];
  activeSheet: ActiveSheet;

  pendingPushToken: string | null;
  realtimeChannel: any;

  // Photo slots the user changed locally; uploaded on save. base64 by slot for
  // slots that hold a newly picked local image.
  dirtyPhotoSlots: number[];
  photoBase64: Record<number, string>;
}

interface Actions {
  bootstrap(): Promise<void>;
  enterSignedIn(): Promise<void>;
  // auth
  signInWithApple(idToken: string, nonce?: string): Promise<void>;
  signInWithGoogle(idToken: string): Promise<void>;
  sendEmailCode(email: string): Promise<boolean>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;
  // data loads
  loadVocabularies(): Promise<void>;
  loadSignedInData(): Promise<void>;
  refreshFeed(): Promise<void>;
  refreshLikes(): Promise<void>;
  refreshLikers(): Promise<void>;
  refreshConversations(): Promise<void>;
  startRealtime(): void;
  // onboarding + profile
  patchProfile(patch: Partial<UserProfile>): void;
  setPhoto(index: number, uri: string, base64: string): void;
  removePhoto(index: number): void;
  toggleInterest(label: string): void;
  setPrompt(index: number, promptId: string, answer: string): void;
  canAdvance(step: OnboardingStep): boolean;
  nextStep(): void;
  prevStep(): void;
  completeOnboarding(): Promise<void>;
  saveProfileEdits(): Promise<void>;
  // explore
  passMember(id: string): void;
  beginLike(id: string): void;
  cancelLike(): void;
  confirmLike(note: string): void;
  likeMember(id: string, note?: string): void;
  messageMatch(): void;
  dismissMatch(): void;
  resetDeck(): void;
  toggleTopic(t: string): void;
  clearTopics(): void;
  // sheets + chat
  openProfile(id: string): void;
  openChat(id: string): void;
  closeSheet(): void;
  send(text: string, id: string): void;
  // account
  setNotifications(v: boolean): void;
  logout(): void;
  deleteAccount(): void;
  // push
  syncPushRegistration(): Promise<void>;
  registerPushToken(token: string): void;
}

export type Store = State & Actions;

// ---- helpers (pure) --------------------------------------------------------

function memberFromRow(
  id: string, name: string, birthdate: string | null,
  city: string | null, work: string | null, bio: string,
): Member {
  let age = 0;
  if (birthdate && birthdate.length >= 10) {
    const y = parseInt(birthdate.slice(0, 4), 10);
    if (y) age = new Date().getFullYear() - y;
  }
  return {
    id, name, age, city: city ?? '', role: work ?? '',
    portrait: seedFor(id), bio, why: '', prompts: [], interests: [],
  };
}

function displayTime(iso: string | null): string {
  if (!iso) return 'now';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const useStore = create<Store>((set, get) => ({
  // ---- initial state ----
  stage: 'loading',
  tab: 'today',
  profile: emptyProfile(),
  onboardingStep: 0,
  feed: [],
  feedLoading: false,
  passedIDs: [],
  likedIDs: [],
  likesRemaining: DAILY_LIKES,
  matchedMember: null,
  pendingLike: null,
  knownMembers: {},
  memberPhotos: {},
  invitations: [],
  conversations: {},
  conversationOrder: [],
  matchIDs: {},
  interestOptions: INTERESTS.map((l) => [slugify(l), l]),
  promptOptions: PROMPTS.map((p) => [p.id, p.q]),
  notifications: true,
  paused: false,
  authBusy: false,
  authError: null,
  exploreTopics: [],
  activeSheet: null,
  pendingPushToken: null,
  realtimeChannel: null,
  dirtyPhotoSlots: [],
  photoBase64: {},

  // ---- bootstrap / routing ----
  async bootstrap() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session && new Date(session.expires_at! * 1000) > new Date()) {
      await get().enterSignedIn();
    } else {
      set({ stage: 'auth' });
    }
  },

  async enterSignedIn() {
    await get().loadVocabularies();
    const row = await Service.fetchOwnProfile();
    if (row && row.deleted_at) {
      try { await Service.reactivateAccount(); } catch {}
    }
    if (row && row.onboarding_complete) {
      applyProfileRow(set, get, row);
      await loadOwnExtras(set, get);
      set({ stage: 'app', tab: 'today' });
      await get().loadSignedInData();
      get().registerPushToken(get().pendingPushToken ?? '');
      get().syncPushRegistration();
    } else {
      if (row) applyProfileRow(set, get, row);
      set({ onboardingStep: 0, stage: 'onboarding' });
    }
  },

  // ---- auth ----
  async signInWithApple(idToken, nonce) {
    set({ authBusy: true, authError: null });
    try { await Service.signInWithApple(idToken, nonce); await get().enterSignedIn(); }
    catch (e: any) { set({ authError: friendlyAuthError(e) }); }
    finally { set({ authBusy: false }); }
  },
  async signInWithGoogle(idToken) {
    set({ authBusy: true, authError: null });
    try { await Service.signInWithGoogle(idToken); await get().enterSignedIn(); }
    catch (e: any) { set({ authError: friendlyAuthError(e) }); }
    finally { set({ authBusy: false }); }
  },
  async sendEmailCode(email) {
    set({ authBusy: true, authError: null });
    try { await Service.sendEmailOTP(email); return true; }
    catch (e: any) {
      // Re-requesting a code for the same email while the previous one is still
      // within Supabase's send cooldown throws a rate-limit error — but that
      // earlier code is still valid. Advance to the code step instead of erroring.
      if (isSendCooldown(e)) return true;
      const m = friendlyAuthError(e); if (m) set({ authError: m }); return false;
    }
    finally { set({ authBusy: false }); }
  },
  async verifyEmailCode(email, code) {
    set({ authBusy: true, authError: null });
    try { await Service.verifyEmailOTP(email, code); await get().enterSignedIn(); return true; }
    catch (e: any) { const m = friendlyAuthError(e); if (m) set({ authError: m }); return false; }
    finally { set({ authBusy: false }); }
  },

  // ---- data loads ----
  async loadVocabularies() {
    try {
      const [interests, prompts] = await Promise.all([Service.fetchInterests(), Service.fetchPrompts()]);
      if (interests.length) set({ interestOptions: interests.map((i) => [i.slug, i.label]) });
      if (prompts.length) set({ promptOptions: prompts.map((p) => [p.id, p.question]) });
    } catch {}
  },
  async loadSignedInData() {
    await Promise.all([get().refreshFeed(), get().refreshLikes(), get().refreshLikers(), get().refreshConversations()]);
    get().startRealtime();
  },
  async refreshFeed() {
    set({ feedLoading: true });
    const topics = get().exploreTopics;
    const slugs = topics.length ? topics.map(slugify) : null;
    try {
      const rows = await Service.discoveryFeed(slugs, 20);
      const members = await Promise.all(rows.map((r) => materialize(set, get, r)));
      set({ feed: members });
    } catch {}
    set({ feedLoading: false });
  },
  async refreshLikes() { try { set({ likesRemaining: await Service.likesRemaining() }); } catch {} },
  async refreshLikers() {
    try {
      const rows = await Service.likers();
      const invites: Invitation[] = [];
      for (const row of rows) {
        if (!get().knownMembers[row.id]) {
          const p = await Service.fetchProfile(row.id);
          if (p) await materializeProfile(set, get, p);
        }
        const m = get().knownMembers[row.id];
        const shared = m ? get_sharedInterests(get, m) : [];
        const note = shared.length === 0 ? 'Liked your profile.'
          : shared.length === 1 ? `You both like ${shared[0]}.`
          : `You both like ${shared.slice(0, 2).join(' & ')}.`;
        invites.push({ id: row.id, note, time: '' });
      }
      set({ invitations: invites });
    } catch {}
  },
  async refreshConversations() {
    try {
      const matches = await Service.fetchMatches();
      const uid = await Service.currentUserId();
      const convos: Record<string, Conversation> = {};
      const order: string[] = [];
      const matchIDs: Record<string, string> = {};
      for (const match of matches) {
        const otherId = match.user_a === uid ? match.user_b : match.user_a;
        if (!get().knownMembers[otherId]) {
          const p = await Service.fetchProfile(otherId);
          if (p) await materializeProfile(set, get, p);
        }
        matchIDs[otherId] = match.id;
        const msgs = await Service.fetchMessages(match.id);
        convos[otherId] = {
          id: otherId,
          preview: msgs.length ? msgs[msgs.length - 1].body : '',
          time: displayTime(msgs.length ? msgs[msgs.length - 1].created_at : match.created_at),
          unread: false,
          messages: msgs.map((m) => ({ id: m.id, text: m.body, fromMe: m.sender_id === uid, at: m.created_at })),
        };
        order.push(otherId);
      }
      set({ conversations: convos, conversationOrder: order, matchIDs });
    } catch {}
  },
  startRealtime() {
    if (get().realtimeChannel) return;
    const channel = supabase
      .channel('messages-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const row: any = payload.new;
        const uid = await Service.currentUserId();
        if (row.sender_id === uid) return;
        // find which conversation (by match id)
        const entry = Object.entries(get().matchIDs).find(([, mid]) => mid === row.match_id);
        if (!entry) { get().refreshConversations(); return; }
        const memberId = entry[0];
        const convos = { ...get().conversations };
        const c = convos[memberId];
        if (c) {
          c.messages = [...c.messages, { id: row.id, text: row.body, fromMe: false, at: row.created_at }];
          c.preview = row.body; c.time = 'now';
          convos[memberId] = { ...c };
          const order = [memberId, ...get().conversationOrder.filter((x) => x !== memberId)];
          set({ conversations: convos, conversationOrder: order });
        }
      })
      .subscribe();
    set({ realtimeChannel: channel });
  },

  // ---- onboarding + profile ----
  patchProfile(patch) { set({ profile: { ...get().profile, ...patch } }); },
  setPhoto(index, uri, base64) {
    const photos = [...get().profile.photos];
    photos[index] = uri;
    const dirty = get().dirtyPhotoSlots.includes(index)
      ? get().dirtyPhotoSlots : [...get().dirtyPhotoSlots, index];
    set({
      profile: { ...get().profile, photos },
      photoBase64: { ...get().photoBase64, [index]: base64 },
      dirtyPhotoSlots: dirty,
    });
  },
  removePhoto(index) {
    const photos = [...get().profile.photos];
    photos[index] = null;
    const { [index]: _dropped, ...restBase64 } = get().photoBase64;
    const dirty = get().dirtyPhotoSlots.includes(index)
      ? get().dirtyPhotoSlots : [...get().dirtyPhotoSlots, index];
    set({
      profile: { ...get().profile, photos },
      photoBase64: restBase64,
      dirtyPhotoSlots: dirty,
    });
  },
  toggleInterest(label) {
    const p = get().profile;
    const has = p.interests.includes(label);
    set({ profile: { ...p, interests: has ? p.interests.filter((x) => x !== label) : [...p.interests, label] } });
  },
  setPrompt(index, promptId, answer) {
    const p = get().profile;
    const prompts = [...p.prompts];
    prompts[index] = { id: prompts[index]?.id ?? String(index), promptId, answer };
    set({ profile: { ...p, prompts } });
  },
  canAdvance(step) {
    const p = get().profile;
    switch (step) {
      case 'name': return p.name.trim().length > 0;
      case 'birthday': return isValidBirthday(p);
      case 'photos': return p.photos.filter((x) => x != null).length >= 2;
      case 'about': return p.pronouns.length > 0;
      case 'city': return p.city.trim().length > 0;
      case 'work': return p.work.trim().length > 0;
      case 'prompt': return p.prompts.some((r) => r.answer.trim().length > 0);
      case 'interests': return p.interests.length >= 3;
      default: return true;
    }
  },
  nextStep() {
    const i = get().onboardingStep;
    if (i >= ONBOARDING_STEPS.length - 1) { get().completeOnboarding(); return; }
    set({ onboardingStep: i + 1 });
  },
  prevStep() { set({ onboardingStep: Math.max(0, get().onboardingStep - 1) }); },
  async completeOnboarding() {
    set({ stage: 'app', tab: 'today' });
    await pushProfile(set, get, true);
    await get().loadSignedInData();
    get().registerPushToken(get().pendingPushToken ?? '');
    get().syncPushRegistration();
  },
  async saveProfileEdits() { await pushProfile(set, get, true); get().closeSheet(); },

  // ---- explore ----
  passMember(id) {
    set({ passedIDs: [...get().passedIDs, id] });
    const uuid = id;
    Service.actOnProfile(uuid, 'pass').catch(() => {});
  },
  beginLike(id) {
    if (get().likesRemaining <= 0 || get().likedIDs.includes(id)) return;
    const m = get().knownMembers[id];
    if (m) set({ pendingLike: m });
  },
  cancelLike() { set({ pendingLike: null }); },
  confirmLike(note) {
    const m = get().pendingLike;
    if (!m) return;
    set({ pendingLike: null });
    get().likeMember(m.id, note.trim());
  },
  likeMember(id, note = '') {
    if (get().likesRemaining <= 0 || get().likedIDs.includes(id)) return;
    set({ likedIDs: [...get().likedIDs, id], likesRemaining: get().likesRemaining - 1 });
    const greeting = note.length ? note : null;
    Service.actOnProfile(id, 'like', greeting).then(async (result) => {
      set({ likesRemaining: result.likes_remaining });
      if (result.matched) {
        await get().refreshConversations();
        const m = get().knownMembers[id];
        if (m) set({ matchedMember: m });
      }
    }).catch(() => {});
  },
  messageMatch() {
    const id = get().matchedMember?.id;
    set({ matchedMember: null });
    if (id) set({ activeSheet: { type: 'chat', id } });
  },
  dismissMatch() { set({ matchedMember: null }); },
  resetDeck() { set({ passedIDs: [] }); get().refreshFeed(); },
  toggleTopic(t) {
    const has = get().exploreTopics.includes(t);
    set({ exploreTopics: has ? get().exploreTopics.filter((x) => x !== t) : [...get().exploreTopics, t] });
    get().refreshFeed();
  },
  clearTopics() { set({ exploreTopics: [] }); get().refreshFeed(); },

  // ---- sheets + chat ----
  openProfile(id) { set({ activeSheet: { type: 'profile', id } }); },
  openChat(id) { set({ activeSheet: { type: 'chat', id } }); },
  closeSheet() { set({ activeSheet: null }); },
  send(text, id) {
    const matchId = get().matchIDs[id];
    if (!matchId || !text.trim()) return;
    const convos = { ...get().conversations };
    const c = convos[id] ?? { id, preview: '', time: 'now', unread: false, messages: [] };
    const optimistic = { id: `local-${Date.now()}`, text, fromMe: true, at: new Date().toISOString() };
    c.messages = [...c.messages, optimistic]; c.preview = text; c.time = 'now';
    convos[id] = { ...c };
    const order = [id, ...get().conversationOrder.filter((x) => x !== id)];
    set({ conversations: convos, conversationOrder: order });
    Service.sendMessage(matchId, text).catch(() => {});
  },

  // ---- account ----
  setNotifications(v) {
    set({ notifications: v });
    if (v) get().syncPushRegistration();
  },
  logout() {
    const token = get().pendingPushToken;
    get().realtimeChannel?.unsubscribe?.();
    (async () => { if (token) await Service.removeDeviceToken(token); await Service.signOut(); })();
    set({
      stage: 'auth', profile: emptyProfile(), onboardingStep: 0, feed: [], knownMembers: {},
      memberPhotos: {}, passedIDs: [], likedIDs: [], invitations: [], conversations: {},
      conversationOrder: [], matchIDs: {}, exploreTopics: [], activeSheet: null, tab: 'today',
      matchedMember: null, pendingLike: null, realtimeChannel: null,
    });
  },
  deleteAccount() {
    (async () => {
      try { await Service.deleteAllOwnPhotos(); await Service.deactivateAccount(); } catch {}
      get().logout();
    })();
  },

  // ---- push ----
  async syncPushRegistration() {
    if (!get().notifications) return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = (await Notifications.getDevicePushTokenAsync()).data as string;
        get().registerPushToken(token);
      }
    } catch {}
  },
  registerPushToken(token) {
    if (!token) return;
    set({ pendingPushToken: token });
    Service.registerDeviceToken(token).catch(() => {});
  },
}));

// ---- selectors (used by components) ---------------------------------------

export function exploreCandidates(s: Store): Member[] {
  return s.feed.filter((m) => !s.passedIDs.includes(m.id) && !s.likedIDs.includes(m.id));
}
export function sharedInterests(s: Store, m: Member): string[] {
  return m.interests.filter((i) => s.profile.interests.includes(i));
}
export function memberOf(s: Store, id: string): Member | undefined { return s.knownMembers[id]; }
export function promptQuestion(s: Store, id: string): string {
  return s.promptOptions.find(([pid]) => pid === id)?.[1] ?? promptText(id) ?? '';
}
export function interestLabels(s: Store): string[] { return s.interestOptions.map(([, l]) => l); }
export function myTopics(s: Store): string[] { return s.profile.interests; }

function get_sharedInterests(get: () => Store, m: Member): string[] {
  return m.interests.filter((i) => get().profile.interests.includes(i));
}

// ---- internal impl helpers -------------------------------------------------

function applyProfileRow(set: any, get: () => Store, row: ProfileRow) {
  const p = { ...get().profile };
  p.name = row.name;
  p.pronouns = row.pronouns ?? '';
  p.city = row.city ?? '';
  p.work = row.work ?? '';
  p.bio = row.bio ?? '';
  if (row.birthdate && row.birthdate.length === 10) {
    const [y, m, d] = row.birthdate.split('-');
    p.dobY = y; p.dobM = m; p.dobD = d;
  }
  set({ profile: p, notifications: row.notifications, paused: row.paused });
}

async function loadOwnExtras(set: any, get: () => Store) {
  const uid = await Service.currentUserId();
  if (!uid) return;
  const [slugs, prompts, photos] = await Promise.all([
    Service.fetchInterestSlugs(uid), Service.fetchPromptRows(uid), Service.fetchPhotoRows(uid),
  ]);
  const labelFor = (slug: string) => get().interestOptions.find(([s]) => s === slug)?.[1] ?? slug;
  const p = { ...get().profile };
  p.interests = slugs.map(labelFor);
  p.prompts = prompts.map((r, i) => ({ id: String(i), promptId: r.prompt_id, answer: r.answer }));
  const urls = photos.map((ph) => Service.photoPublicURL(ph.storage_path));
  const slotPhotos = [...emptyProfile().photos];
  photos.forEach((ph, i) => { if (ph.position < 6) slotPhotos[ph.position] = urls[i]; });
  p.photos = slotPhotos;
  set({ profile: p });
}

async function materialize(set: any, get: () => Store, r: FeedRow): Promise<Member> {
  let m = memberFromRow(r.id, r.name, r.birthdate, r.city, r.work, r.bio);
  const [slugs, prompts, photos] = await Promise.all([
    Service.fetchInterestSlugs(r.id), Service.fetchPromptRows(r.id), Service.fetchPhotoRows(r.id),
  ]);
  const labelFor = (slug: string) => get().interestOptions.find(([s]) => s === slug)?.[1] ?? slug;
  m.interests = slugs.map(labelFor);
  m.prompts = prompts.map((pr, i) => ({ id: String(i), q: promptQuestion(get(), pr.prompt_id), a: pr.answer }));
  const urls = photos.map((ph) => Service.photoPublicURL(ph.storage_path));
  set({
    knownMembers: { ...get().knownMembers, [r.id]: m },
    memberPhotos: { ...get().memberPhotos, [r.id]: urls },
  });
  return m;
}

async function materializeProfile(set: any, get: () => Store, p: ProfileRow) {
  await materialize(set, get, {
    id: p.id, name: p.name, birthdate: p.birthdate, pronouns: p.pronouns,
    city: p.city, work: p.work, bio: p.bio, shared_count: 0,
  });
}

async function pushProfile(set: any, get: () => Store, markComplete: boolean) {
  const uid = await Service.currentUserId();
  if (!uid) return;
  const p = get().profile;
  const birthdate = p.dobY.length === 4 && p.dobM && p.dobD
    ? `${p.dobY}-${p.dobM.padStart(2, '0')}-${p.dobD.padStart(2, '0')}` : null;
  const row: ProfileRow = {
    id: uid, name: p.name,
    birthdate,
    pronouns: p.pronouns || null,
    city: p.city || null,
    work: p.work || null,
    bio: p.bio.trim(),
    onboarding_complete: markComplete,
    paused: get().paused,
    notifications: get().notifications,
    deleted_at: null,
  };
  try {
    await Service.upsertOwnProfile(row);
    await Service.replaceOwnInterests(p.interests.map(slugify));
    await Service.replaceOwnPrompts(p.prompts.filter((r) => r.answer.trim()).map((r) => ({ promptId: r.promptId, answer: r.answer })));
    // Upload/delete only the slots the user changed since the last save.
    const base64 = get().photoBase64;
    for (const slot of [...get().dirtyPhotoSlots].sort((a, b) => a - b)) {
      const data = base64[slot];
      if (data) await Service.uploadPhoto(data, slot);
      else await Service.deletePhoto(slot);
    }
    set({ dirtyPhotoSlots: [], photoBase64: {} });
  } catch {}
}

/** True when Supabase refused a resend because a code was just sent (still valid). */
function isSendCooldown(error: any): boolean {
  const text = (error?.message ?? String(error)).toLowerCase();
  const code = String(error?.code ?? '').toLowerCase();
  if (error?.status === 429) return true;
  if (code.includes('rate_limit') || code.includes('over_email_send')) return true;
  return text.includes('security purposes') || (text.includes('seconds') && text.includes('request'));
}

function friendlyAuthError(error: any): string | null {
  const text = (error?.message ?? String(error)).toLowerCase();
  if (text.includes('cancel')) return null;
  if (text.includes('network') || text.includes('offline')) return 'You appear to be offline. Check your connection and try again.';
  if (text.includes('invalid') || text.includes('expired') || text.includes('otp')) return 'That code is invalid or has expired. Request a new one.';
  if (text.includes('security purposes') || text.includes('seconds')) return 'Please wait a moment before requesting another code.';
  if (text.includes('rate limit') || text.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  return 'Something went wrong. Please try again.';
}
