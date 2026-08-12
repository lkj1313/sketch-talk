import { QueryProvider } from '@/app/providers/query-provider'
import { AppRouter } from '@/app/routes/router'
import { Toaster } from '@/shared/ui'

function App() {
  return (
    <QueryProvider>
      <AppRouter />
      <Toaster />
    </QueryProvider>
  )
}

export default App
