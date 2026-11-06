import { createClient } from '@supabase/supabase-js'
import './auth-feedback.css'

// Public browser configuration for this app; never use a secret or service-role key here.
const url = 'https://swqrxssxuyfhtktxumuh.supabase.co'
const key = 'sb_publishable_R8JNzTnG0c4mhgOu4FOUPQ_GRZOfup5'
export const supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })

function showAuthFeedback(message: string, failure = false) {
  let panel = document.getElementById('auth-feedback')
  if (!panel) {
    panel = document.createElement('section')
    panel.id = 'auth-feedback'
    panel.setAttribute('role', 'status')
    panel.setAttribute('aria-live', 'polite')
    document.body.appendChild(panel)
  }
  panel.dataset.error = String(failure)
  panel.replaceChildren()
  const text = document.createElement('p')
  text.textContent = message
  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = 'Dismiss'
  close.onclick = () => panel?.remove()
  panel.append(text, close)
}

const originalSignUp = supabase.auth.signUp.bind(supabase.auth)
supabase.auth.signUp = async (...args: Parameters<typeof originalSignUp>) => {
  showAuthFeedback('Creating your account… Please wait.')
  try {
    const result = await originalSignUp(...args)
    if (result.error) showAuthFeedback(result.error.message, true)
    else if (result.data.session) showAuthFeedback('Your account is ready and you are signed in. Email confirmation was not required.')
    else showAuthFeedback('Check your email to confirm your account, including spam. If a confirmation email was sent, open its link and return here to sign in. If you already have an account, sign in instead.')
    return result
  } catch (error) {
    showAuthFeedback(error instanceof Error ? error.message : 'Could not create your account. Please try again.', true)
    throw error
  }
}

const originalSignIn = supabase.auth.signInWithPassword.bind(supabase.auth)
supabase.auth.signInWithPassword = async (...args: Parameters<typeof originalSignIn>) => {
  showAuthFeedback('Signing in… Please wait.')
  try {
    const result = await originalSignIn(...args)
    if (result.error) showAuthFeedback(result.error.message, true)
    else showAuthFeedback('Signed in successfully.')
    return result
  } catch (error) {
    showAuthFeedback(error instanceof Error ? error.message : 'Could not sign in. Please try again.', true)
    throw error
  }
}
