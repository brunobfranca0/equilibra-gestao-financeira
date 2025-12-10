import { supabase } from '../lib/supabase';

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  last4?: string;
  credit_limit?: number;
  due_day?: number;
  closing_day?: number;
  created_at?: string;
  updated_at?: string;
}

export const cardService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as CreditCard[];
  },

  async create(card: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('credit_cards')
      .insert([card])
      .select()
      .single();

    if (error) throw error;
    return data as CreditCard;
  },

  async update(id: string, updates: Partial<CreditCard>) {
    const { data, error } = await supabase
      .from('credit_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CreditCard;
  },

  async delete(id: string) {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) throw error;
  },
};

