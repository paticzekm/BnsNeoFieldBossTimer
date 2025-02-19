import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = ''; // paste supabase url here
const SUPABASE_ANON_KEY = ''; // paste supabase anon key here

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
