import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qtqvnutcalmmqmmbwueu.supabase.co";
const supabaseAnonKey = "sb_publishable_wNxWHuOyc0riOo4VXmsbGQ_jxPZi03s";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);