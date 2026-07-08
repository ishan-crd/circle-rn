// Push notification wiring. Tokens are Expo push tokens (Expo delivers to APNs
// via the project's EAS credentials). This module controls how notifications
// present in the foreground and where a tap takes the user.

import * as Notifications from 'expo-notifications';
import { useStore } from '../store';

// handleNotification only runs for notifications received while the app is in
// the FOREGROUND — suppress the banner/sound there so pushes only pop up when
// the user is outside the app. (Background notifications are shown by the OS and
// aren't affected by this.) Live in-app updates come through the realtime
// subscription + unread dots instead.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

type PushData = {
  type?: 'message' | 'match' | 'like';
  matchId?: string;
  memberId?: string;
};

/** Route to the relevant screen when a notification is tapped. */
async function route(data: PushData | undefined) {
  if (!data) return;
  const s = useStore.getState();
  if (s.stage !== 'app') return; // ignore until signed in + loaded

  if (data.type === 'like') {
    useStore.setState({ tab: 'invites' });
    s.refreshLikers().catch(() => {});
    return;
  }

  if (data.type === 'message' || data.type === 'match') {
    useStore.setState({ tab: 'messages' });
    // Make sure the conversation exists, then open the chat.
    if (!s.matchIDs[data.memberId ?? '']) await s.refreshConversations().catch(() => {});
    if (data.memberId && useStore.getState().knownMembers[data.memberId]) {
      useStore.getState().openChat(data.memberId);
    }
  }
}

/** Register foreground + tap listeners. Returns a cleanup function. */
export function setupNotifications(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    route(response.notification.request.content.data as PushData);
  });
  // Cold start: app launched by tapping a notification.
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) route(response.notification.request.content.data as PushData);
  });
  return () => sub.remove();
}
