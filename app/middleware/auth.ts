export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;

  const token = localStorage.getItem("auth_token");
  if (!token) {
    return navigateTo("/login");
  }

  try {
    await client.auth.verify();
  } catch {
    localStorage.removeItem("auth_token");
    return navigateTo("/login");
  }
});
