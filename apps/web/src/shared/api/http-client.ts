import axios from 'axios'

import { env } from '@/shared/config'

const httpClientConfig = {
  baseURL: env.apiUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
}

export const httpClient = axios.create(httpClientConfig)
export const refreshClient = axios.create(httpClientConfig)
