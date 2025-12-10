import { supabase } from '../lib/supabase';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  institution?: string;
  type?: 'checking' | 'savings';
  balance?: number;
  created_at?: string;
  updated_at?: string;
}

export const accountService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Account[];
  },

  async create(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('accounts')
      .insert([account])
      .select()
      .single();

    if (error) throw error;
    return data as Account;
  },

  async update(id: string, updates: Partial<Account>) {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Account;
  },

  async delete(id: string) {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },
};

