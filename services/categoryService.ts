import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  created_at?: string;
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>;

export const categoryService = {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  },

  async getByType(userId: string, type: 'expense' | 'income'): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories by type:', error);
      return [];
    }

    return data || [];
  },

  async create(category: CategoryInsert): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }

    return data;
  },

  async update(id: string, updates: Partial<CategoryInsert>): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  },
};

// Ícones disponíveis para categorias
export const CATEGORY_ICONS = [
  { name: 'restaurant', label: 'Alimentação' },
  { name: 'car', label: 'Transporte' },
  { name: 'cart', label: 'Compras' },
  { name: 'heart', label: 'Saúde' },
  { name: 'school', label: 'Educação' },
  { name: 'home', label: 'Moradia' },
  { name: 'game-controller', label: 'Lazer' },
  { name: 'cash', label: 'Salário' },
  { name: 'trending-up', label: 'Investimentos' },
  { name: 'laptop', label: 'Freelance' },
  { name: 'gift', label: 'Presente' },
  { name: 'airplane', label: 'Viagem' },
  { name: 'paw', label: 'Pet' },
  { name: 'fitness', label: 'Academia' },
  { name: 'musical-notes', label: 'Entretenimento' },
  { name: 'logo-usd', label: 'Outros' },
];

// Cores disponíveis para categorias
export const CATEGORY_COLORS = [
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