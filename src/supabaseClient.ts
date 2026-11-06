import { createClient } from '@supabase/supabase-js'
import './auth-feedback.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')

export const supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })

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
    if (result.error) {
      showAuthFeedback(result.error.message, true)
    } else if (result.data.session) {
      showAuthFeedback('Your account is ready and you are signed in. Email confirmation was not required.')
    } else {
      showAuthFeedback('Check your email to confirm your account. If a confirmation email was sent, open its link, then return here to sign in. Check spam too. If you already have an account, sign in instead.')
    }
    return result
  } catch (error) {
    showAuthFeedback(error instanceof Error ? error.message : 'Could not create your account. Please try again.', true)
    throw error
  }
}
