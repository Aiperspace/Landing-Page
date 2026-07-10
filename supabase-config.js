(function () {
  var SUPABASE_URL = "https://yhgixboluietgtuioknl.supabase.co";
  var ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ2l4Ym9sdWlldGd0dWlva25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzI1NDAsImV4cCI6MjA5MjQ0ODU0MH0.SEhDAm-9BwMFxB0aayelzi2t5CnZ4bgblO9yFYJ_7C4";

  var isLocal =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: ANON_KEY,
    siteUrl: isLocal ? "http://localhost:8080" : "https://www.aiper.space"
  };
})();
