// Top-level router — mirrors RootView.swift. Switches on `stage`, hosts the
// match / like overlays and the chat / profile / edit sheets.

import React from 'react';
import { View, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from './theme';
import { useStore } from './store';
import { Auth } from './screens/Auth';
import { Onboarding } from './screens/Onboarding';
import { MainTabs } from './screens/MainTabs';
import { MatchMoment } from './screens/MatchMoment';
import { LikeComposer } from './screens/LikeComposer';
import { Chat } from './screens/Chat';
import { ProfileDetail } from './screens/ProfileDetail';
import { EditProfile } from './screens/EditProfile';
import { RoomChat } from './screens/RoomChat';
import { RoomSettings } from './screens/RoomSettings';
import { CreateRoom } from './screens/CreateRoom';
import { BannerHost } from './components/BannerHost';

export function RootView() {
  const C = useTheme();
  const stage = useStore((s) => s.stage);
  const matched = useStore((s) => s.matchedMember);
  const sheet = useStore((s) => s.activeSheet);
  const closeSheet = useStore((s) => s.closeSheet);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      {stage === 'loading' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </View>
      )}
      {stage === 'auth' && <Auth />}
      {stage === 'onboarding' && <Onboarding />}
      {stage === 'app' && <MainTabs />}

      {/* Like composer bottom sheet (controls its own visibility) */}
      <LikeComposer />

      {/* Match celebration overlay */}
      {matched && <MatchMoment member={matched} />}

      {/* Full-screen sheets */}
      <Modal
        visible={!!sheet}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeSheet}
      >
        <View style={{ flex: 1, backgroundColor: C.paper }}>
          {sheet?.type === 'chat' && sheet.id && <Chat memberId={sheet.id} />}
          {sheet?.type === 'profile' && sheet.id && <ProfileDetail memberId={sheet.id} />}
          {sheet?.type === 'edit' && <EditProfile />}
          {sheet?.type === 'room' && sheet.id && <RoomChat roomId={sheet.id} />}
          {sheet?.type === 'roomSettings' && sheet.id && <RoomSettings roomId={sheet.id} />}
          {sheet?.type === 'createRoom' && <CreateRoom />}
          {/* Banner over the sheet (e.g. a like arrives while you're in a chat/room) */}
          {(sheet?.type === 'chat' || sheet?.type === 'room') && <BannerHost />}
        </View>
      </Modal>

      {/* Banner over the tab screens */}
      {!sheet && stage === 'app' && <BannerHost />}
    </View>
  );
}
