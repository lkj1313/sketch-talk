import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'
import { toast } from '@/shared/ui'

import { useLogout } from './use-logout'

export function useLogoutButton() {
  const navigate = useNavigate()
  const clearSession = useSessionStore((state) => state.clearSession)
  const logoutMutation = useLogout()

  function finishLogout(): void {
    clearSession()
    void navigate('/login', { replace: true })
  }

  function handleLogout(): void {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        finishLogout()
        toast.add({
          title: '로그아웃되었습니다.',
          type: 'success',
        })
      },
      onError: () => {
        finishLogout()
        toast.add({
          title: '로그아웃 요청에 실패했습니다.',
          description: '현재 기기의 로그인 정보는 정리했습니다.',
          type: 'error',
        })
      },
    })
  }

  return {
    handleLogout,
    isPending: logoutMutation.isPending,
  }
}
