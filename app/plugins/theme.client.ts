export default defineNuxtPlugin(() => {
  const { initDom } = useTheme();
  initDom();
});
