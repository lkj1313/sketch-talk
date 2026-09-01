import { Button } from '@/shared/ui'

import { useLogoutButton } from '../model/use-logout-button'

export function LogoutButton() {
  const { handleLogout, isPending } = useLogoutButton()

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={handleLogout}
    >
      {isPending ? '로그아웃 중...' : '로그아웃'}
    </Button>
  )
}
