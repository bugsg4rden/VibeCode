const CONFIG = {
  // Set to empty string to use direct Supabase auth (no backend needed)
  API_URL: '',
  
  // Get these from your Supabase project: Settings > API
  // Create a free project at https://supabase.com
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE'
};

// Check if Supabase is configured
const SUPABASE_CONFIGURED = CONFIG.SUPABASE_URL && 
                            CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
                            CONFIG.SUPABASE_ANON_KEY && 
                            CONFIG.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';
