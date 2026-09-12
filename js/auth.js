export async function isUserLoggedIn() {
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export function loginUser() {
  return true;
}

export async function logoutUser() {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  sessionStorage.removeItem('current_operator');
}

export function setOperator(name) {
  sessionStorage.setItem('current_operator', name);
}

export function getOperator() {
  return sessionStorage.getItem('current_operator') || 'system';
}
