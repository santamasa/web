import './wdyr'
import 'lib/polyfills'

import * as Sentry from '@sentry/react'
import { App } from 'App'
import { AppProviders } from 'AppProviders'
import { getConfig } from 'config'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { renderConsoleArt } from 'lib/consoleArt'
import { reportWebVitals } from 'lib/reportWebVitals'

import * as serviceWorkerRegistration from './serviceWorkerRegistration'
// Remove this condition to test sentry locally
// if (window.location.hostname !== 'localhost') {
const VALID_ENVS = [
  'localhost',
  'develop',
  'release',
  'app',
  'private',
  'yeet',
  'beard',
  'juice',
  'wood',
  'gome',
] as const

const environment = (() => {
  if (window.location.hostname.includes('app')) return 'production'

  if (VALID_ENVS.some(env => window.location.hostname.includes(env)))
    return window.location.hostname.split('.')[0]
})()
Sentry.init({
  environment,
  dsn: getConfig().REACT_APP_SENTRY_DSN_URL,
  attachStacktrace: true,
  integrations: [
    // Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      stickySession: true,
      networkDetailAllowUrls: [/.*/],
    }),
    Sentry.httpClientIntegration({
      failedRequestStatusCodes: [
        [400, 428],
        // i.e no 429s
        [430, 599],
      ],

      failedRequestTargets: [/^(?!.*\.?alchemy\.com).*$/],
    }),
    Sentry.browserApiErrorsIntegration(),
    Sentry.breadcrumbsIntegration(),
    Sentry.globalHandlersIntegration(),
    Sentry.httpContextIntegration(),
  ],
  beforeSend(event, hint) {
    // Drop closed ws errors to avoid spew
    if (
      (hint.originalException as Error | undefined)?.message ===
      'failed to reconnect, connection closed'
    )
      return null
    // https://github.com/getsentry/sentry-javascript/issues/8353 / https://forum.sentry.io/t/turn-off-event-grouping/10916/3
    event.fingerprint = [(Math.random() * 1000000).toString()]
    return event
  },
  enableTracing: true,
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ['localhost'],
  replaysSessionSampleRate: window.location.hostname !== 'localhost' ? 1 : 0.1,
  replaysOnErrorSampleRate: 1.0,
})
// }

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

rootElement.setAttribute('vaul-drawer-wrapper', '')
rootElement.classList.add('app-height')

root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)

serviceWorkerRegistration.register()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(vitals => console.debug({ vitals }, 'Web Vitals'))

// Because ASCII Art
renderConsoleArt()
