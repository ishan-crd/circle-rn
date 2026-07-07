// Top-level router — mirrors RootView.swift. Switches on `stage`, hosts the
// match / like overlays and the chat / profile / edit sheets.

import React from 'react';
import { View, Modal, ActivityIndicator } from 'react-native';
import { CT } from './theme';
import { useStore } from './store';
import { Auth } from './screens/Auth';
import { Onboarding } from './screens/Onboarding';
import { MainTabs } from './screens/MainTabs';
import { MatchMoment } from './screens/MatchMoment';
import { LikeComposer } from './screens/LikeComposer';
import { Chat } from './screens/Chat';
import { ProfileDetail } from './screens/ProfileDetail';
import { EditProfile } from './screens/EditProfile';

export function RootView() {
  const stage = useStore((s) => s.stage);
  const matched = useStore((s) => s.matchedMember);
  const pendingLike = useStore((s) => s.pendingLike);
  const sheet = useStore((s) => s.activeSheet);
  const closeSheet = useStore((s) => s.closeSheet);

  return (
    <View style={{ flex: 1, backgroundColor: CT.paper }}>
      {stage === 'loading' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CT.accent} />
        </View>
      )}
      {stage === 'auth' && <Auth />}
      {stage === 'onboarding' && <Onboarding />}
      {stage === 'app' && <MainTabs />}

      {/* Like composer overlay */}
      {pendingLike && <LikeComposer member={pendingLike} />}

      {/* Match celebration overlay */}
      {matched && <MatchMoment member={matched} />}

      {/* Full-screen sheets */}
      <Modal
        visible={!!sheet}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeSheet}
      >
        <View style={{ flex: 1, backgroundColor: CT.paper }}>
          {sheet?.type === 'chat' && sheet.id && <Chat memberId={sheet.id} />}
          {sheet?.type === 'profile' && sheet.id && <ProfileDetail memberId={sheet.id} />}
          {sheet?.type === 'edit' && <EditProfile />}
        </View>
      </Modal>
    </View>
  );
}
