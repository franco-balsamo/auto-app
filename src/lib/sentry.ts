import * as Sentry from '@sentry/react-native';

// DSN pendiente de completar (ver README, sección Release). Sin DSN, Sentry
// no inicializa y las llamadas a trackEvent/captureException son no-ops —
// así el error tracking no bloquea el arranque de la app.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({ dsn, tracesSampleRate: 1.0 });
}

// Analytics mínimo para medir activación (ej. completar alta de vehículo)
// durante la beta cerrada — se apoya en breadcrumbs/mensajes de Sentry en
// vez de sumar otra dependencia solo para esto.
export function trackEvent(name: string) {
  if (!dsn) return;
  Sentry.addBreadcrumb({ category: 'analytics', message: name, level: 'info' });
  Sentry.captureMessage(`event:${name}`, 'info');
}
