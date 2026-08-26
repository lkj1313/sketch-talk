import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { useSessionStore } from '@/entities/session'
import { httpClient } from '@/shared/api'

import { refreshSession } from './refresh-session'

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const REFRESH_EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/refresh',
] as const

let refreshPromise: Promise<string> | null = null

function isRefreshExcludedRequest(url: string | undefined): boolean {
  const path = url?.split('?')[0]

  return REFRESH_EXCLUDED_PATHS.some((excludedPath) =>
    path?.endsWith(excludedPath),
  )
}

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then(({ accessToken }) => {
        useSessionStore.getState().setAccessToken(accessToken)

        return accessToken
      })
      .catch((error: unknown) => {
        useSessionStore.getState().clearSession()

        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export function setupAuthInterceptors(): () => void {
  const requestInterceptorId = httpClient.interceptors.request.use((config) => {
    const accessToken = useSessionStore.getState().accessToken

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })

  const responseInterceptorId = httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryRequestConfig | undefined

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        isRefreshExcludedRequest(originalRequest.url)
      ) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const accessToken = await refreshAccessToken()

        originalRequest.headers.set(
          'Authorization',
          `Bearer ${accessToken}`,
        )

        return await httpClient(originalRequest)
      } catch (refreshError: unknown) {
        return Promise.reject(refreshError)
      }
    },
  )

  return () => {
    httpClient.interceptors.request.eject(requestInterceptorId)
    httpClient.interceptors.response.eject(responseInterceptorId)
  }
}
