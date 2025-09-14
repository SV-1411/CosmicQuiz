import { supabase } from './supabase'

// Admin credentials (hardcoded as requested)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

// Hash password (simple implementation for demo)
const hashPassword = (password) => {
  return btoa(password) // Base64 encoding for demo purposes
}

// Verify password
const verifyPassword = (password, hash) => {
  return btoa(password) === hash
}

// Admin authentication
export const adminLogin = (username, password) => {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem('admin_session', 'true')
    return { success: true, user: { username: 'admin', role: 'admin' } }
  }
  return { success: false, error: 'Invalid credentials' }
}

export const adminLogout = () => {
  localStorage.removeItem('admin_session')
}

export const isAdminLoggedIn = () => {
  return localStorage.getItem('admin_session') === 'true'
}

// Participant authentication
export const participantRegister = async (email, username, fullName, password) => {
  try {
    // Pre-check for existing email to provide a clear message
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingByEmail) {
      return { success: false, error: 'Email already registered. Please login instead.' }
    }

    // Pre-check for existing username
    const { data: existingByUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingByUsername) {
      return { success: false, error: 'Username already taken. Please choose another.' }
    }

    const passwordHash = hashPassword(password)
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          username,
          full_name: fullName,
          password_hash: passwordHash
        }
      ])
      .select()

    if (error) {
      // Handle duplicate key violation explicitly
      if (error.code === '23505') {
        if (error.message?.includes('users_email_key')) {
          return { success: false, error: 'Email already registered. Please login instead.' }
        }
        if (error.message?.includes('users_username_key')) {
          return { success: false, error: 'Username already taken. Please choose another.' }
        }
      }
      return { success: false, error: error.message }
    }

    const user = Array.isArray(data) ? data[0] : data

    // Persist session like login
    localStorage.setItem('user_session', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name
    }))

    return { success: true, user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const participantLogin = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'User not found' }
    }

    if (!verifyPassword(password, data.password_hash)) {
      return { success: false, error: 'Invalid password' }
    }

    // Store user session
    localStorage.setItem('user_session', JSON.stringify({
      id: data.id,
      email: data.email,
      username: data.username,
      fullName: data.full_name
    }))

    return { success: true, user: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const participantLogout = () => {
  localStorage.removeItem('user_session')
}

export const getCurrentUser = () => {
  const session = localStorage.getItem('user_session')
  return session ? JSON.parse(session) : null
}

export const isUserLoggedIn = () => {
  return getCurrentUser() !== null
}
