import { supabase } from './supabaseClient';
import { Transaction } from '../types';

// Helper to map DB snake_case to App camelCase
const mapToApp = (t: any): Transaction => ({
    id: t.id,
    day: t.day,
    month: t.month,
    year: t.year,
    category: t.category,
    subCategory: t.sub_category,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    acknowledged: t.acknowledged,
    completed: t.completed,
    isFixed: t.is_fixed,
    installmentId: t.installment_id,
    installmentNumber: t.installment_number,
    totalInstallments: t.total_installments,
    client_name: t.client_name,
    external_url: t.external_url
});

// Helper to map App camelCase to DB snake_case
const mapToDB = (t: Partial<Transaction>) => {
    const mapped: any = { ...t };
    if (t.subCategory !== undefined) mapped.sub_category = t.subCategory;
    if (t.isFixed !== undefined) mapped.is_fixed = t.isFixed;
    if (t.installmentId !== undefined) mapped.installment_id = t.installmentId;
    if (t.installmentNumber !== undefined) mapped.installment_number = t.installmentNumber;
    if (t.totalInstallments !== undefined) mapped.total_installments = t.totalInstallments;
    if (t.client_name !== undefined) mapped.client_name = t.client_name;
    if (t.external_url !== undefined) mapped.external_url = t.external_url;

    // Remove camelCase versions
    delete mapped.subCategory;
    delete mapped.isFixed;
    delete mapped.installmentId;
    delete mapped.installmentNumber;
    delete mapped.totalInstallments;
    // client_name and external_url are kept as is (snake_case matches or mapped above if needed, 
    // but here keys are already matching if we just pass them t through, 
    // actually t has 'client_name' (snake) in interface? 
    // interface typescript has client_name? yes transaction interface has client_name.
    // so no need to delete/remap if keys are same.

    return mapped;
};

export const SupabaseService = {
    // --- Transactions ---

    async fetchTransactions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .order('day', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapToApp);
    },

    async addTransaction(transaction: Omit<Transaction, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbData = mapToDB(transaction);
        const { data, error } = await supabase
            .from('transactions')
            .insert([{ ...dbData, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return mapToApp(data);
    },

    async updateTransaction(id: string, updates: Partial<Transaction>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbUpdates = mapToDB(updates);
        const { data, error } = await supabase
            .from('transactions')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return mapToApp(data);
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

    async deleteAllTransactions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id); // Safely delete only user's data

        if (error) throw error;
    },

    // --- Gemini / Settings ---

    async saveGeminiKey(key: string) {
        // Save to local storage for instant availability
        localStorage.setItem('gemini_api_key', key);

        // Save to Profile in DB for persistence across devices
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, gemini_api_key: key, updated_at: new Date().toISOString() });

            if (error) {
                console.error('Error saving key to DB provider', error);
                throw error;
            }
        }
    },

    async getGeminiKey(): Promise<string | null> {
        // 1. Try Local Storage first
        const localKey = localStorage.getItem('gemini_api_key');
        if (localKey) return localKey;

        // 2. Try DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('gemini_api_key')
                .eq('id', user.id)
                .single();

            if (data?.gemini_api_key) {
                localStorage.setItem('gemini_api_key', data.gemini_api_key);
                return data.gemini_api_key;
            }
        }
        return null;
    }
};
