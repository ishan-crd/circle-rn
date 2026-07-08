// Backend gateway — mirrors coterie-ios/Circle/Store/SupabaseService.swift.
// All Supabase access goes through here.

import { decode } from 'base64-arraybuffer';
import { randomUUID } from 'expo-crypto';
import { supabase } from './supabase';

// ---- Row types (mirror the DB schema) --------------------------------------

export interface ProfileRow {
  id: string;
  name: string;
  birthdate: string | null;
  pronouns: string | null;
  city: string | null;
  work: string | null;
  bio: string;
  onboarding_complete: boolean;
  paused: boolean;
  notifications: boolean;
  deleted_at?: string | null;
}

export interface InterestRow { slug: string; label: string; sort_order: number; }
export interface PromptRow { id: string; question: string; sort_order: number; }
export interface FeedRow {
  id: string; name: string; birthdate: string | null; pronouns: string | null;
  city: string | null; work: string | null; bio: string; shared_count: number;
}
export interface ActResult { matched: boolean; match_id: string | null; likes_remaining: number; }
export interface LikerRow { id: string; name: string; city: string | null; work: string | null; liked_at: string; }
export interface MatchRow { id: string; user_a: string; user_b: string; created_at: string; }
export interface MessageRow { id: string; match_id: string; sender_id: string; body: string; created_at: string; }
export interface ProfilePhotoRow { profile_id: string; position: number; storage_path: string; }

// ---- Auth ------------------------------------------------------------------

export const Service = {
  async currentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  },

  async signInWithApple(idToken: string, nonce?: string) {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken, nonce });
    if (error) throw error;
  },

  async signInWithGoogle(idToken: string) {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw error;
  },

  async sendEmailOTP(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
  },

  async verifyEmailOTP(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
  },

  async signOut() { await supabase.auth.signOut(); },

  // ---- Account deactivation ----
  async deactivateAccount() { const { error } = await supabase.rpc('deactivate_account'); if (error) throw error; },
  async reactivateAccount() { const { error } = await supabase.rpc('reactivate_account'); if (error) throw error; },

  // ---- Push tokens ----
  async registerDeviceToken(token: string) {
    const uid = await this.currentUserId();
    if (!uid) return;
    await supabase.from('device_tokens').upsert({ token, user_id: uid, platform: 'ios' }, { onConflict: 'token' });
  },
  async removeDeviceToken(token: string) {
    await supabase.from('device_tokens').delete().eq('token', token);
  },

  // ---- Vocabularies ----
  async fetchInterests(): Promise<InterestRow[]> {
    const { data, error } = await supabase.from('interests').select('*').order('sort_order');
    if (error) throw error;
    return data as InterestRow[];
  },
  async fetchPrompts(): Promise<PromptRow[]> {
    const { data, error } = await supabase.from('prompts').select('*').eq('active', true).order('sort_order');
    if (error) throw error;
    return data as PromptRow[];
  },

  // ---- Own profile ----
  async fetchOwnProfile(): Promise<ProfileRow | null> {
    const uid = await this.currentUserId();
    if (!uid) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).limit(1);
    return (data?.[0] as ProfileRow) ?? null;
  },
  async upsertOwnProfile(row: ProfileRow) {
    const { error } = await supabase.from('profiles').upsert(row);
    if (error) throw error;
  },
  async replaceOwnInterests(slugs: string[]) {
    const uid = await this.currentUserId();
    if (!uid) return;
    await supabase.from('profile_interests').delete().eq('profile_id', uid);
    if (slugs.length) {
      await supabase.from('profile_interests').insert(slugs.map((interest) => ({ profile_id: uid, interest })));
    }
  },
  async replaceOwnPrompts(prompts: { promptId: string; answer: string }[]) {
    const uid = await this.currentUserId();
    if (!uid) return;
    await supabase.from('profile_prompts').delete().eq('profile_id', uid);
    if (prompts.length) {
      await supabase.from('profile_prompts').insert(
        prompts.map((p, i) => ({ profile_id: uid, prompt_id: p.promptId, answer: p.answer, position: i })),
      );
    }
  },

  // ---- Photos (storage bucket "photos") ----
  async uploadPhoto(base64: string, position: number): Promise<string> {
    const uid = await this.currentUserId();
    if (!uid) throw new Error('not authenticated');
    const path = `${uid}/${randomUUID()}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, decode(base64), {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) throw error;
    await supabase.from('profile_photos').delete().eq('profile_id', uid).eq('position', position);
    await supabase.from('profile_photos').insert({ profile_id: uid, position, storage_path: path });
    return path;
  },
  async deletePhoto(position: number) {
    const uid = await this.currentUserId();
    if (!uid) return;
    const { data } = await supabase.from('profile_photos')
      .select('storage_path').eq('profile_id', uid).eq('position', position);
    const paths = ((data as { storage_path: string }[]) ?? []).map((r) => r.storage_path);
    if (paths.length) await supabase.storage.from('photos').remove(paths);
    await supabase.from('profile_photos').delete().eq('profile_id', uid).eq('position', position);
  },
  async deleteAllOwnPhotos() {
    const uid = await this.currentUserId();
    if (!uid) return;
    const { data } = await supabase.storage.from('photos').list(uid);
    const paths = (data ?? []).map((f) => `${uid}/${f.name}`);
    if (paths.length) await supabase.storage.from('photos').remove(paths);
  },
  async fetchPhotoRows(profileId: string): Promise<ProfilePhotoRow[]> {
    const { data } = await supabase.from('profile_photos').select('*').eq('profile_id', profileId).order('position');
    return (data as ProfilePhotoRow[]) ?? [];
  },
  photoPublicURL(path: string): string {
    return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
  },

  // ---- Other profiles ----
  async fetchProfile(id: string): Promise<ProfileRow | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).limit(1);
    return (data?.[0] as ProfileRow) ?? null;
  },
  async fetchInterestSlugs(id: string): Promise<string[]> {
    const { data } = await supabase.from('profile_interests').select('interest').eq('profile_id', id);
    return (data ?? []).map((r: any) => r.interest);
  },
  async fetchPromptRows(id: string): Promise<{ prompt_id: string; answer: string; position: number }[]> {
    const { data } = await supabase.from('profile_prompts').select('*').eq('profile_id', id).order('position');
    return (data as any) ?? [];
  },

  // ---- Discovery / likes ----
  async discoveryFeed(topics: string[] | null, limit = 20): Promise<FeedRow[]> {
    const { data, error } = await supabase.rpc('get_discovery_feed', { p_topics: topics, p_limit: limit });
    if (error) throw error;
    return (data as FeedRow[]) ?? [];
  },
  async actOnProfile(target: string, action: 'like' | 'pass', note?: string | null): Promise<ActResult> {
    const { data, error } = await supabase.rpc('act_on_profile', {
      p_target: target, p_action: action, p_note: note ?? null,
    });
    if (error) throw error;
    return data as ActResult;
  },
  async likesRemaining(): Promise<number> {
    const { data } = await supabase.rpc('likes_remaining');
    return (data as number) ?? 0;
  },
  async likers(): Promise<LikerRow[]> {
    const { data } = await supabase.rpc('get_likers');
    return (data as LikerRow[]) ?? [];
  },

  // ---- Matches / messages ----
  async fetchMatches(): Promise<MatchRow[]> {
    const { data } = await supabase.from('matches').select('*').order('created_at', { ascending: false });
    return (data as MatchRow[]) ?? [];
  },
  async fetchMessages(matchId: string): Promise<MessageRow[]> {
    const { data } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at');
    return (data as MessageRow[]) ?? [];
  },
  async sendMessage(matchId: string, body: string): Promise<MessageRow | null> {
    const uid = await this.currentUserId();
    if (!uid) return null;
    const { data } = await supabase.from('messages')
      .insert({ match_id: matchId, sender_id: uid, body }).select().limit(1);
    return (data?.[0] as MessageRow) ?? null;
  },
  async unmatch(otherId: string) {
    const { error } = await supabase.rpc('unmatch', { p_other: otherId });
    if (error) throw error;
  },
  async reportUser(reportedId: string, reason: string) {
    const uid = await this.currentUserId();
    if (!uid) return;
    await supabase.from('reports').insert({ reporter_id: uid, reported_id: reportedId, reason });
  },

  // ---- Rooms (group chats) ----
  async fetchMyRoomIds(): Promise<string[]> {
    const uid = await this.currentUserId();
    if (!uid) return [];
    const { data } = await supabase.from('room_members').select('room_id').eq('user_id', uid);
    return (data ?? []).map((r) => r.room_id as string);
  },
  async fetchRooms(ids: string[]): Promise<{ id: string; name: string; owner_id: string }[]> {
    if (!ids.length) return [];
    const { data } = await supabase.from('rooms').select('id, name, owner_id').in('id', ids);
    return (data as any[]) ?? [];
  },
  async fetchRoomMembers(ids: string[]): Promise<{ room_id: string; user_id: string; role: string; status: string; invited_by: string | null }[]> {
    if (!ids.length) return [];
    const { data } = await supabase.from('room_members')
      .select('room_id, user_id, role, status, invited_by').in('room_id', ids);
    return (data as any[]) ?? [];
  },
  async fetchProfileNames(ids: string[]): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const { data } = await supabase.from('profiles').select('id, name').in('id', ids);
    const out: Record<string, string> = {};
    for (const r of (data as any[]) ?? []) out[r.id] = r.name;
    return out;
  },
  async fetchRoomMessages(roomId: string): Promise<{ id: string; sender_id: string; body: string; created_at: string }[]> {
    const { data } = await supabase.from('room_messages')
      .select('id, sender_id, body, created_at').eq('room_id', roomId).order('created_at');
    return (data as any[]) ?? [];
  },
  async sendRoomMessage(roomId: string, body: string) {
    const uid = await this.currentUserId();
    if (!uid) return;
    await supabase.from('room_messages').insert({ room_id: roomId, sender_id: uid, body });
  },
  async createRoom(name: string, memberIds: string[]): Promise<string | null> {
    const { data, error } = await supabase.rpc('create_room', { p_name: name, p_members: memberIds });
    if (error) throw error;
    return data as string;
  },
  async respondRoomInvite(roomId: string, accept: boolean) {
    const { error } = await supabase.rpc('respond_room_invite', { p_room: roomId, p_accept: accept });
    if (error) throw error;
  },
  async inviteToRoom(roomId: string, userId: string) {
    const { error } = await supabase.rpc('invite_to_room', { p_room: roomId, p_user: userId });
    if (error) throw error;
  },
  async setRoomRole(roomId: string, userId: string, role: 'admin' | 'member') {
    const { error } = await supabase.rpc('set_room_role', { p_room: roomId, p_user: userId, p_role: role });
    if (error) throw error;
  },
  async removeRoomMember(roomId: string, userId: string) {
    const { error } = await supabase.rpc('remove_room_member', { p_room: roomId, p_user: userId });
    if (error) throw error;
  },
  async renameRoom(roomId: string, name: string) {
    const { error } = await supabase.rpc('rename_room', { p_room: roomId, p_name: name });
    if (error) throw error;
  },
  async leaveRoom(roomId: string) {
    const { error } = await supabase.rpc('leave_room', { p_room: roomId });
    if (error) throw error;
  },
  async deleteRoom(roomId: string) {
    const { error } = await supabase.rpc('delete_room', { p_room: roomId });
    if (error) throw error;
  },
};
