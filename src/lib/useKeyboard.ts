// Tracks keyboard visibility so screens can collapse the bottom safe-area
// padding while the keyboard is up — otherwise a KeyboardAvoidingView stacks
// the keyboard height *and* the home-indicator inset, floating footers too high.

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return visible;
}
