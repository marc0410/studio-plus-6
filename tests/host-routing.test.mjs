import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHostRoute } from '../lib/host-routing.ts';

test('les hôtes des espaces réécrivent la racine vers leur route actuelle', () => {
  assert.deepEqual(resolveHostRoute('app', '/'), { type: 'rewrite', pathname: '/espace' });
  assert.deepEqual(resolveHostRoute('team', '/'), { type: 'rewrite', pathname: '/equipe' });
  assert.deepEqual(resolveHostRoute('admin', '/'), { type: 'rewrite', pathname: '/gestion' });
});

test('les routes visibles client sont mappées vers les routes internes', () => {
  assert.deepEqual(resolveHostRoute('app', '/parametres'), { type: 'rewrite', pathname: '/espace/parametres' });
  assert.deepEqual(resolveHostRoute('app', '/projets/p-123'), { type: 'rewrite', pathname: '/espace/projets/p-123' });
});

test('les routes équipe et gestion sont isolées par hôte', () => {
  assert.deepEqual(resolveHostRoute('team', '/seances/booking-1'), { type: 'rewrite', pathname: '/equipe/seances/booking-1' });
  assert.deepEqual(resolveHostRoute('admin', '/reservations'), { type: 'rewrite', pathname: '/gestion/reservations' });
  assert.deepEqual(resolveHostRoute('admin', '/projets/project-1'), { type: 'rewrite', pathname: '/gestion/projets/project-1' });
});

test('les chemins internes historiques redirigent vers le domaine propriétaire', () => {
  assert.deepEqual(resolveHostRoute('www', '/equipe/seances'), { type: 'redirect', space: 'team', pathname: '/seances' });
  assert.deepEqual(resolveHostRoute('app', '/gestion/reservations'), { type: 'redirect', space: 'admin', pathname: '/reservations' });
});

test('les flux auth sont limités aux espaces prévus et l’API reste same-origin', () => {
  assert.deepEqual(resolveHostRoute('team', '/auth/accept-invite'), { type: 'pass' });
  assert.deepEqual(resolveHostRoute('app', '/auth/accept-invite'), { type: 'not-found' });
  assert.deepEqual(resolveHostRoute('team', '/inscription'), { type: 'not-found' });
  assert.deepEqual(resolveHostRoute('app', '/api/auth/login'), { type: 'pass' });
});

test('les routes inconnues ne sont pas implicitement exposées', () => {
  assert.deepEqual(resolveHostRoute('www', '/gestion-donnees'), { type: 'not-found' });
  assert.deepEqual(resolveHostRoute('admin', '/seances'), { type: 'not-found' });
});
