export default defineNuxtRouteMiddleware(async () => {
  const client = useRpcClient();
  const { clear, read } = useAuthToken();
  const token = read();

  if (!token) {
    return navigateTo("/login");
  }

  try {
    await client.auth.verify();
  } catch {
    clear();
    return navigateTo("/login");
  }
});
