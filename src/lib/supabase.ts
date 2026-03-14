import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wnkximddleuqiejbtiai.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3hpbWRkbGV1cWllamJ0aWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjg5NjAsImV4cCI6MjA4ODkwNDk2MH0.1OJOgkYme4c-JcIrMi9C8nt1ykoW1RoZsSEKrN9AUgM'

const USER_ID_KEY = 'baito_user_id'

export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export function setUserId(id: string) {
  localStorage.setItem(USER_ID_KEY, id)
}

// user_idをヘッダーに載せるカスタムfetch
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'x-user-id': getUserId(),
    },
  },
})

// user_idヘッダーを動的に更新するヘルパー
export function getSupabaseWithUser() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { 'x-user-id': getUserId() },
    },
  })
}
