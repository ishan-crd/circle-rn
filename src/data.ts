// Reference vocabulary — mirrors CTData in coterie-ios/Circle/Models/Models.swift.
// Used as fallback when backend vocab hasn't loaded, and for static option lists.

import { PortraitSeed } from './types';

export const PRONOUNS = ['She / Her', 'He / Him', 'They / Them'];
export const SEEKING = ['Women', 'Men', 'Everyone'];

export const PROMPTS: { id: string; q: string }[] = [
  { id: 'sunday', q: 'A perfect Sunday is…' },
  { id: 'fall', q: 'I’ll fall for someone who…' },
  { id: 'win', q: 'The way to win me over…' },
  { id: 'alive', q: 'I feel most alive when…' },
  { id: 'view', q: 'An opinion I’ll defend…' },
  { id: 'dinner', q: 'My ideal dinner guest is…' },
  { id: 'travel', q: 'The trip that changed me…' },
  { id: 'weekend', q: 'You’ll usually find me on a weekend…' },
  { id: 'simple', q: 'The simplest thing that makes me happy…' },
  { id: 'learning', q: 'Lately I’ve been learning to…' },
  { id: 'laugh', q: 'I can’t stop laughing at…' },
  { id: 'brave', q: 'The bravest thing I’ve done…' },
  { id: 'song', q: 'The song I’ll never skip…' },
  { id: 'home', q: 'Home, to me, sounds like…' },
  { id: 'overrated', q: 'Something everyone loves that I find overrated…' },
  { id: 'ritual', q: 'A small ritual I never miss…' },
  { id: 'kindness', q: 'The kindest thing someone’s done for me…' },
  { id: 'greenflag', q: 'An instant green flag…' },
  { id: 'project', q: 'The project I can’t put down…' },
  { id: 'first', q: 'Our first adventure should be…' },
  { id: 'childhood', q: 'My childhood dream job was…' },
  { id: 'comfort', q: 'My comfort meal is…' },
];

export const INTERESTS = [
  'Hiking', 'Music', 'Content creation', 'Photography', 'Cooking', 'Gaming',
  'Running', 'Coffee', 'Art', 'Film', 'Books', 'Travel', 'Yoga', 'Cycling',
  'Design', 'Dancing', 'Climbing', 'Wine', 'Sailing', 'Surfing', 'Gardening', 'Vinyl',
];

export const PHOTO_POSITIONS: PortraitSeed[] = [
  { lx: 30, ly: 18 }, { lx: 70, ly: 22 }, { lx: 50, ly: 14 },
  { lx: 66, ly: 78 }, { lx: 34, ly: 70 }, { lx: 58, ly: 30 },
];

export function promptText(id: string): string | undefined {
  return PROMPTS.find((p) => p.id === id)?.q;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Deterministic portrait seed from an id (so placeholder gradients are stable).
export function seedFor(id: string): PortraitSeed {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { lx: 20 + (h % 60), ly: 14 + ((h >> 3) % 60) };
}
