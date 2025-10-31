import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtuomszkqhahvsgcukwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dW9tc3prcWhhaHZzZ2N1a3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTk0OTYsImV4cCI6MjA2MjQ3NTQ5Nn0.QYKnaO-1FuFF9c7u8olIU8Q-iN7hGfHbUH8s5Dv1MyQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);