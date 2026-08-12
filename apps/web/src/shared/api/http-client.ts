import axios from 'axios'

import { env } from '@/shared/config'

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})
