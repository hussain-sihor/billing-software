// Thin fetch wrapper around the Express + MongoDB backend. Ported from the
// original public/index.html — same error handling and messages so behavior
// is identical. In dev, Vite proxies /api to the backend; in production
// Express serves both the client and the API from the same origin.
const API = '/api';

async function api(path, opts) {
  let res;
  try {
    res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    /* no body */
  }
  if (!res.ok) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body;
}

export const apiGet = (path) => api(path);
export const apiPost = (path, data) =>
  api(path, { method: 'POST', body: JSON.stringify(data) });
export const apiPut = (path, data) =>
  api(path, { method: 'PUT', body: JSON.stringify(data) });
export const apiDelete = (path) => api(path, { method: 'DELETE' });

export default api;
