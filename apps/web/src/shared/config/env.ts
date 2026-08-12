function getRequiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았습니다.`)
  }

  return value
}

export const env = {
  apiUrl: getRequiredEnv('VITE_API_URL', import.meta.env.VITE_API_URL),
  socketUrl: getRequiredEnv('VITE_SOCKET_URL', import.meta.env.VITE_SOCKET_URL),
} as const
