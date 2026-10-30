const { createAdminClient } = require("@supabase/server/core");

// Server-seitiger Client mit vollem Zugriff (bypass RLS).
// Liest SUPABASE_URL + SUPABASE_SECRET_KEY automatisch aus process.env.
const supabase = createAdminClient();

module.exports = supabase;
