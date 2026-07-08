// Report a member — a native reason picker that records the report for
// moderation. Reports are reviewed within 24 hours (Guideline 1.2).

import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { useStore } from '../store';

const REASONS = [
  'Inappropriate or explicit content',
  'Harassment or bullying',
  'Spam or scam',
  'Fake profile or impersonation',
  'Something else',
];

function finalize(memberId: string, reason: string) {
  useStore.getState().reportUser(memberId, reason);
  Alert.alert(
    'Thanks for reporting',
    'Our team reviews reports within 24 hours. You can also unmatch to stop hearing from this person.',
  );
}

export function reportMember(memberId: string, name: string) {
  const title = `Report ${name}`;
  const message = 'Why are you reporting? Reports are reviewed within 24 hours.';

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...REASONS, 'Cancel'],
        cancelButtonIndex: REASONS.length,
      },
      (index) => {
        if (index < REASONS.length) finalize(memberId, REASONS[index]);
      },
    );
  } else {
    Alert.alert(title, message, [
      ...REASONS.map((reason) => ({ text: reason, onPress: () => finalize(memberId, reason) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }
}
