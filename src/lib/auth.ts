import { supabase, type Profile } from './supabase';

export async function signUp(email: string, password: string, fullName: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Kayıt başarısız');

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      role: 'end_user',
      full_name: fullName,
      phone: phone || null,
    });

  if (profileError) throw profileError;

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: Partial<Profile>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
}
