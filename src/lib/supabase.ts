// Connects to the SAME live Supabase project as the iOS app — shared DB, auth,
// RPCs, storage, realtime and edge functions.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zkoweftcxxnmytnezmcf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BynEdOOK5aRPlsTAjXwCGA_R3SD3ZoS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const GOOGLE_IOS_CLIENT_ID =
  '1076938664897-f9a3rgdt00clkpqmq217vg8v4hgl1fou.apps.googleusercontent.com';
