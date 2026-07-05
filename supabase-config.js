(function () {
  var LOCAL_SUPABASE_URL = "http://localhost:54321";
  var LOCAL_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.EI1WVCfiidUaxjo7fHSYVESsagtTQYHcwFTOHhacZ8k";

  // Set these when you deploy the auth stack (Render/VPS). Same anon key as in .env.example.
  var PROD_SUPABASE_URL = "";
  var PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.EI1WVCfiidUaxjo7fHSYVESsagtTQYHcwFTOHhacZ8k";
  var PROD_SITE_URL = "https://www.aiper.space";

  var isLocal =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  window.SUPABASE_CONFIG = {
    url: isLocal ? LOCAL_SUPABASE_URL : PROD_SUPABASE_URL,
    anonKey: isLocal ? LOCAL_ANON_KEY : PROD_ANON_KEY,
    siteUrl: isLocal ? "http://localhost:8080" : PROD_SITE_URL
  };
})();
