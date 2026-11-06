import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://swqrxssxuyfhtktxumuh.supabase.co'
const supabasePublishableKey = 'sb_publishable_R8JNzTnG0c4mhgOu4FOUPQ_GRZOfup5'

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
