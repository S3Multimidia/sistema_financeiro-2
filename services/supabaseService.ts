import { supabase } from './supabaseClient';
import { Transaction } from '../types';

export const SupabaseService = {
    // --- Transactions ---

    async fetchTransactions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;

        // Convert DB fields to App types if needed (e.g., date formats)
        return data as Transaction[];
    },

    async addTransaction(transaction: Omit<Transaction, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('transactions')
            .insert([{ ...transaction, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as Transaction;
    },

    async updateTransaction(id: string, updates: Partial<Transaction>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data as Transaction;
    },

    async deleteTransaction(id: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    // --- Gemini / Settings ---

    async saveGeminiKey(key: string) {
        // Option A: Save to local storage (Simple, User Preference)
        localStorage.setItem('gemini_api_key', key);

        // Option B: Save to Profile in DB (Sync across devices)
        /*
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, gemini_api_key: key });
          if (error) console.error('Error saving key to DB provider', error);
        }
        */
    },

    getGeminiKey(): string | null {
        return localStorage.getItem('gemini_api_key');
    }
};