import { supabase } from '../lib/supabase';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  color: string;
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export type SavingsGoalInsert = Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>;

export interface Achievement {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export const savingsGoalService = {
  async getAll(userId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching savings goals:', error);
      return [];
    }

    return data || [];
  },

  async getByStatus(userId: string, status: SavingsGoal['status']): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching savings goals by status:', error);
      return [];
    }

    return data || [];
  },

  async create(goal: SavingsGoalInsert): Promise<SavingsGoal | null> {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert(goal)
      .select()
      .single();

    if (error) {
      console.error('Error creating savings goal:', error);
      return null;
    }

    return data;
  },

  async update(id: string, updates: Partial<SavingsGoalInsert>): Promise<SavingsGoal | null> {
    const { data, error } = await supabase
      .from('savings_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating savings goal:', error);
      return null;
    }

    return data;
  },

  async addAmount(id: string, amount: number): Promise<SavingsGoal | null> {
    // Primeiro buscar o valor atual
    const { data: current, error: fetchError } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      console.error('Error fetching current amount:', fetchError);
      return null;
    }

    const newAmount = current.current_amount + amount;
    const newStatus = newAmount >= current.target_amount ? 'completed' : 'active';

    const { data, error } = await supabase
      .from('savings_goals')
      .update({
        current_amount: newAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error adding amount to goal:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting savings goal:', error);
      return false;
    }

    return true;
  },

  async getStats(userId: string): Promise<{ active: number; completed: number; achievements: number }> {
    const [activeRes, completedRes, achievementsRes] = await Promise.all([
      supabase
        .from('savings_goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('savings_goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('achievements')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      active: activeRes.count || 0,
      completed: completedRes.count || 0,
      achievements: achievementsRes.count || 0,
    };
  },

  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  },
};

// Ícones disponíveis para metas
export const GOAL_ICONS = [
  { name: 'airplane', label: 'Viagem' },
  { name: 'car', label: 'Carro' },
  { name: 'home', label: 'Casa' },
  { name: 'laptop', label: 'Eletrônicos' },
  { name: 'school', label: 'Educação' },
  { name: 'medkit', label: 'Emergência' },
  { name: 'gift', label: 'Presente' },
  { name: 'diamond', label: 'Luxo' },
  { name: 'wallet', label: 'Reserva' },
  { name: 'rocket', label: 'Projeto' },
  { name: 'heart', label: 'Saúde' },
  { name: 'trophy', label: 'Objetivo' },
];

// Cores disponíveis para metas
export const GOAL_COLORS = [
  '#FF6B6B', // Vermelho
  '#FF9F43', // Laranja
  '#FECA57', // Amarelo
  '#1DD1A1', // Verde
  '#54A0FF', // Azul
  '#5F27CD', // Roxo
  '#FF6B9D', // Rosa
  '#00D2D3', // Ciano
  '#A259FF', // Roxo claro (tema)
  '#31D158', // Verde (tema)
];