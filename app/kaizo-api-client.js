/**
 * Kaizo App API client — csak az /app éles felülethez.
 */
import { getUser, logout } from 'https://esm.sh/@netlify/identity@2.0.0';

const ORG_KEY = 'kaizo_org_id';
const LOGIN = '/app/login.html';

export async function ensureLoggedIn(loginPath = LOGIN) {
  const user = await getUser().catch(() => null);
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = `${loginPath}?next=${next}`;
    return null;
  }
  return user;
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const orgId = localStorage.getItem(ORG_KEY);
  if (orgId) headers['X-Org-Id'] = orgId;

  const res = await fetch(path, { ...options, headers, credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function bootstrapOrg(defaultName) {
  const me = await api('/api/v1/me');
  if (me.organizations?.length) {
    localStorage.setItem(ORG_KEY, me.organizations[0].id);
    return me;
  }
  const name = defaultName || (me.user?.email ? `${me.user.email.split('@')[0]} cég` : 'Kaizo trial');
  const created = await api('/api/v1/orgs', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  localStorage.setItem(ORG_KEY, created.organization.id);
  return { ...me, organizations: [created.organization] };
}

export async function signOut() {
  await logout();
  localStorage.removeItem(ORG_KEY);
  location.href = LOGIN;
}

window.KaizoApi = { ensureLoggedIn, api, bootstrapOrg, signOut, getUser };
