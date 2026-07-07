// Domain models — mirror coterie-ios/Circle/Models/Models.swift.

export type AppStage = 'loading' | 'auth' | 'onboarding' | 'app';
export type MainTab = 'today' | 'gallery' | 'invites' | 'messages' | 'profile';
export type Appearance = 'system' | 'light' | 'dark';

export interface PortraitSeed {
  lx: number;
  ly: number;
}

export interface PromptAnswer {
  id: string;
  q: string;
  a: string;
}

export interface Member {
  id: string;
  name: string;
  age: number;
  city: string;
  role: string;
  portrait: PortraitSeed;
  bio: string;
  why: string;
  prompts: PromptAnswer[];
  interests: string[];
}

export interface PromptResponse {
  id: string;
  promptId: string;
  answer: string;
}

export interface UserProfile {
  name: string;
  dobM: string;
  dobD: string;
  dobY: string;
  photos: (string | null)[]; // local URIs or remote URLs; 6 slots
  pronouns: string;
  city: string;
  work: string;
  bio: string;
  prompts: PromptResponse[];
  interests: string[];
}

export const emptyProfile = (): UserProfile => ({
  name: '',
  dobM: '',
  dobD: '',
  dobY: '',
  photos: [null, null, null, null, null, null],
  pronouns: '',
  city: '',
  work: '',
  bio: '',
  prompts: [],
  interests: [],
});

export const MIN_AGE = 13;
export const MAX_AGE = 120;
export const MAX_PROMPTS = 3;
export const DAILY_LIKES = 5;

export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  at: string;
}

export interface Conversation {
  id: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
}

export interface Invitation {
  id: string;
  note: string;
  time: string;
}

// Age from a UserProfile's day/month/year, or null if invalid.
export function ageFrom(p: UserProfile): number | null {
  if (p.dobY.length !== 4) return null;
  const y = parseInt(p.dobY, 10);
  const m = parseInt(p.dobM, 10);
  const d = parseInt(p.dobD, 10);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const birth = new Date(y, m - 1, d);
  if (birth.getFullYear() !== y || birth.getMonth() !== m - 1 || birth.getDate() !== d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const hadBirthday = now.getMonth() > m - 1 || (now.getMonth() === m - 1 && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}

export function birthdayIssue(p: UserProfile): string | null {
  // Stay quiet until the user has finished typing the 4-digit year, so the
  // error doesn't flash while a valid date is still being entered.
  if (p.dobY.length < 4) return null;
  const age = ageFrom(p);
  if (age === null) return 'Enter a valid date.';
  if (age < MIN_AGE) return `You must be at least ${MIN_AGE}.`;
  if (age > MAX_AGE) return 'Enter a valid birth year.';
  return null;
}

export function isValidBirthday(p: UserProfile): boolean {
  const age = ageFrom(p);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}
