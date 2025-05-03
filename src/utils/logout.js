export function handleLogout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userEmail");
  window.location.href = "/";
}
