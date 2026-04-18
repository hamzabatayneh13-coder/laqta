export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("laqta_token");
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("laqta_token");
  window.dispatchEvent(new Event("laqta:auth"));
  window.location.href = "/auth/login";
}
