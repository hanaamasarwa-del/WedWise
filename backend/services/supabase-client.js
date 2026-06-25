const { createClient } = require("@supabase/supabase-js");

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file."
    );
  }

  // Use service role key on the backend to bypass RLS
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || key;
  _client = createClient(url, serviceKey);
  return _client;
}

// Proxy: any property access (e.g. supabase.from(...)) lazily initialises the client.
// This allows the server to start without Supabase credentials; only DB calls will fail.
module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
