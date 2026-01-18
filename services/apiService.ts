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
    external_url: t.external_url,
    perfex_status: t.perfex_status
});

// Helper to map App camelCase to DB snake_case
const mapToDB = (t: Partial<Transaction>) => {
    const mapped: any = { ...t };
    if (t.subCategory !== undefined) mapped.sub_category = t.subCategory;
    if (t.isFixed !== undefined) mapped.is_fixed = t.isFixed;
    if (t.installmentId !== undefined) mapped.installment_id = t.installmentId;
    if (t.installmentNumber !== undefined) mapped.installment_number = t.installmentNumber;
    if (t.totalInstallments !== undefined) mapped.total_installments = t.totalInstallments;
    // client_name/external_url/perfex_status match DB columns

    // Clean up frontend-only props
    delete mapped.subCategory;
    delete mapped.isFixed;
    delete mapped.installmentId;
    delete mapped.installmentNumber;
    delete mapped.totalInstallments;

    return mapped;
};

export const ApiService = {
    // --- Transactions ---

    async fetchTransactions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .order('day', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapToApp);
    },

    async addTransaction(transaction: Omit<Transaction, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Handle temporary ID if passed (remove custom ID generation from frontend usually, let DB generate UUID)
        const dbData = mapToDB(transaction);

        const { data, error } = await supabase
            .from('transactions')
            .insert([{ ...dbData, user_id: user.id }]) // Supabase RLS handles user_id securily if policy allows, but good to be explicit
            .select()
            .single();

        if (error) throw error;
        return mapToApp(data);
    },

    async updateTransaction(id: string, updates: Partial<Transaction>) {
        const dbUpdates = mapToDB(updates);
        const { data, error } = await supabase
            .from('transactions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapToApp(data);
    },

    async deleteTransaction(id: string) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async clearAllTransactions() {
        // Caution: Deletes ALL user transactions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id);
        // Note: RLS Usually prevents deleting others, but explicit filter is safer

        if (error) throw error;
    },

    async syncLocalDataToCloud(transactions: Transaction[]) {
        // Bulk Insert/Upsert logic
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbTransactions = transactions.map(t => ({
            ...mapToDB(t),
            user_id: user.id
            // If we have 'id' (UUID) we keep it, if not (legacy number), we might let DB generate NEW or map existing.
            // For migration, we usually rely on 'original_id' for dedup.
        }));

        const { data, error } = await supabase
            .from('transactions')
            .upsert(dbTransactions, { onConflict: 'original_id', ignoreDuplicates: false }) // Use original_id for sync logic
            .select();

        if (error) throw error;
        return data;
    },

    // --- Auth ---
    async login(email: string, pass: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) throw error;
        return {
            user: data.user,
            token: data.session?.access_token
        };
    },

    async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem('s3m_user_data');
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Fetch additional profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('starting_balance, gemini_api_key')
            .eq('id', user.id)
            .single();

        return {
            ...user,
            starting_balance: profile?.starting_balance || 0,
            gemini_api_key: profile?.gemini_api_key
        };
    },

    async updateUserSettings(settings: { starting_balance?: number }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...settings });

        if (error) throw error;
        return { success: true };
    }
};
