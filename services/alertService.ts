import { supabase } from '../lib/supabase';

export interface SpendingAlert {
  id: string;
  user_id: string;
  monthly_limit: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export const alertService = {
  async get(userId: string): Promise<SpendingAlert | null> {
    const { data, error } = await supabase
      .from('spending_alerts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null;
      }
      throw error;
    }
    return data;
  },

  async create(alert: Omit<SpendingAlert, 'id' | 'created_at' | 'updated_at'>): Promise<SpendingAlert> {
    const { data, error } = await supabase
      .from('spending_alerts')
      .insert([alert])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<SpendingAlert>): Promise<SpendingAlert> {
    const { data, error } = await supabase
      .from('spending_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsert(userId: string, alert: Partial<SpendingAlert>): Promise<SpendingAlert> {
    const existing = await this.get(userId);
    
    if (existing) {
      return this.update(existing.id, alert);
    } else {
      return this.create({
        user_id: userId,
        monthly_limit: alert.monthly_limit || 0,
        enabled: alert.enabled ?? true,
      });
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('spending_alerts').delete().eq('id', id);
    if (error) throw error;
  },
};

