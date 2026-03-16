import { createClient } from '@supabase/supabase-js' // @supabase-client ではなく @supabase-js が一般的

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const USER_ID_KEY = 'baito_user_id'
// User ID を取得・生成する関数
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

// クライアントの初期化（一度だけ宣言する）
// global headers に載せることで、すべてのリクエストに自動で x-user-id が付与されます
// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   global: {
//     headers: {
//       'x-user-id': getUserId(),
//     },
//   },
// })

/**
 * もしユーザーIDが途中で変わる可能性があるなら（setUserId後など）、
 * 常に最新のヘッダーを持つクライアントを返す関数
 */
export function getSupabaseWithUser() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { 'x-user-id': getUserId() },
    },
  })
}