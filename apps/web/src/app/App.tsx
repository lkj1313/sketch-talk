import { QueryProvider } from '@/app/providers/query-provider'
import { SessionProvider } from '@/app/providers/session-provider'
import { AppRouter } from '@/app/routes/router'
import { Toaster } from '@/shared/ui'

function App() {
  return (
    <QueryProvider>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
      <Toaster />
    </QueryProvider>
  )
}

export default App
