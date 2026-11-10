import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/700.css'
import 'katex/dist/katex.min.css'
import './i18n'
import './index.css'
import { router } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
