export function isUserLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

export function loginUser() {
  localStorage.setItem('isLoggedIn', 'true');
}

export function logoutUser() {
  localStorage.removeItem('isLoggedIn');
}

export function setOperator(name) {
  localStorage.setItem('current_operator', name);
}

export function getOperator() {
  return localStorage.getItem('current_operator') || 'system';
}
