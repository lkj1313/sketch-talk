import { useMutation } from '@tanstack/react-query'

import { signup } from '../api/signup'

export function useSignup() {
  return useMutation({ mutationFn: signup })
}
