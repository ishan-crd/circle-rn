// The doorway — mirrors AuthView.swift. Apple / Google / email OTP.

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CT, serif, grotesk, eyebrow } from '../theme';
import { Text, PillButton, LogoMark } from '../components/ui';
import { useStore } from '../store';
import { useKeyboardVisible } from '../lib/useKeyboard';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function Auth() {
  const insets = useSafeAreaInsets();
  const authError = useStore((s) => s.authError);
  const signInWithApple = useStore((s) => s.signInWithApple);
  const [emailSheet, setEmailSheet] = useState(false);

  async function onApple() {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (cred.identityToken) await signInWithApple(cred.identityToken);
    } catch {}
  }

  async function onGoogle() {
    // Supabase OAuth via an in-app browser session.
    const redirectTo = 'circlein://auth-callback';
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (data?.url) {
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type === 'success' && res.url) {
        const params = new URL(res.url).hash;
        // supabase-js parses the session from the URL fragment
        const p = new URLSearchParams(params.replace('#', ''));
        const access_token = p.get('access_token');
        const refresh_token = p.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          await useStore.getState().enterSignedIn();
        }
      }
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <LogoMark height={40} />
        <Text style={[serif(30), { color: CT.body, textAlign: 'center', marginTop: 18, maxWidth: 300 }]}>
          Find friends who share your world.
        </Text>
      </View>

      <View style={styles.buttons}>
        {Platform.OS === 'ios' && (
          <ProviderButton icon={<Ionicons name="logo-apple" size={19} color={CT.ink} />}
            label="Continue with Apple" onPress={onApple} />
        )}
        <ProviderButton icon={<Ionicons name="logo-google" size={17} color={CT.ink} />}
          label="Continue with Google" onPress={onGoogle} />
        <ProviderButton icon={<Ionicons name="mail" size={16} color={CT.ink} />}
          label="Continue with Email" onPress={() => setEmailSheet(true)} />

        {authError && <Text style={[grotesk(12), { color: CT.accent, textAlign: 'center', marginTop: 12 }]}>{authError}</Text>}
      </View>

      <Text style={[grotesk(11), { color: CT.faint, textAlign: 'center', paddingBottom: insets.bottom + 14 }]}>
        By continuing you agree to our terms.
      </Text>

      <Modal visible={emailSheet} transparent animationType="slide" onRequestClose={() => setEmailSheet(false)}>
        <EmailSheet onClose={() => setEmailSheet(false)} />
      </Modal>
    </View>
  );
}

function ProviderButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.provider}>
      <View style={styles.providerIcon}>{icon}</View>
      <Text style={[grotesk(15, 'medium'), { color: CT.ink }]}>{label}</Text>
      <View style={{ width: 20 }} />
    </Pressable>
  );
}

function EmailSheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const sendEmailCode = useStore((s) => s.sendEmailCode);
  const verifyEmailCode = useStore((s) => s.verifyEmailCode);
  const authBusy = useStore((s) => s.authBusy);
  const authError = useStore((s) => s.authError);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const validEmail = /\S+@\S+\.\S+/.test(cleanEmail);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: keyboardUp ? 12 : insets.bottom + 20 }]}>
        <View style={styles.sheetHead}>
          <Text style={serif(30)}>{sent ? 'Enter the code' : 'Your email'}</Text>
          <Pressable onPress={onClose} style={styles.close}>
            <Ionicons name="close" size={16} color={CT.muted} />
          </Pressable>
        </View>
        <Text style={[grotesk(14), { color: CT.bodyLight, marginTop: 10 }]}>
          {sent ? `We emailed a 6-digit code to ${cleanEmail}.` : 'We’ll email you a 6-digit code to sign in.'}
        </Text>

        {sent ? (
          <TextInput value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456" placeholderTextColor={CT.faint} keyboardType="number-pad"
            style={[serif(30), styles.field]} />
        ) : (
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com"
            placeholderTextColor={CT.faint} keyboardType="email-address" autoCapitalize="none"
            style={[serif(26), styles.field]} />
        )}

        {authError && <Text style={[grotesk(12), { color: CT.accent, marginTop: 12 }]}>{authError}</Text>}

        <View style={{ marginTop: 24 }}>
          <PillButton
            title={sent ? 'Verify' : 'Send Code'}
            loading={authBusy}
            enabled={sent ? code.length === 6 : validEmail}
            onPress={async () => {
              if (sent) { const ok = await verifyEmailCode(cleanEmail, code); if (ok) onClose(); }
              else { const ok = await sendEmailCode(cleanEmail); if (ok) setSent(true); }
            }}
          />
        </View>
        {sent && (
          <Pressable onPress={() => { setSent(false); setCode(''); }} style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={[grotesk(13), { color: CT.muted }]}>Use a different email</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CT.paper, paddingHorizontal: 30 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttons: { gap: 12 },
  provider: {
    height: 54, borderRadius: 999, borderWidth: 1, borderColor: CT.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  providerIcon: { width: 20, alignItems: 'center' },
  sheet: {
    backgroundColor: CT.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 26, paddingTop: 20, minHeight: 320,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: CT.fill, alignItems: 'center', justifyContent: 'center' },
  field: { color: CT.ink, marginTop: 30, borderBottomWidth: 1, borderBottomColor: CT.border, paddingBottom: 10 },
});
