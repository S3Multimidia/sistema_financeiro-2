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
    perfex_status: t.perfex_status,
    debtId: t.debt_id // Map DB snake_case to App camelCase
});

// Helper to map App camelCase to DB snake_case
const mapToDB = (t: Partial<Transaction>) => {
    const mapped: any = { ...t };
    if (t.subCategory !== undefined) mapped.sub_category = t.subCategory;
    if (t.isFixed !== undefined) mapped.is_fixed = t.isFixed;
    if (t.installmentId !== undefined) mapped.installment_id = t.installmentId;
    if (t.installmentNumber !== undefined) mapped.installment_number = t.installmentNumber;
    if (t.totalInstallments !== undefined) mapped.installments_total = t.totalInstallments;
    if (t.debtId !== undefined) mapped.debt_id = t.debtId;

    // client_name/external_url/perfex_status match DB columns
    // Ensure original_id is passed if present (critical for duplicate prevention)
    if ((t as any).original_id) mapped.original_id = (t as any).original_id;

    // Clean up frontend-only props
    delete mapped.subCategory;
    delete mapped.isFixed;
    delete mapped.installmentId;
    delete mapped.installmentNumber;
    delete mapped.totalInstallments;
    delete mapped.debtId; // Remove camelCase version

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

    async upsertInitialTransaction(transaction: Omit<Transaction, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Check for existing "Saldo Inicial" in this month/year for this user
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('description', 'Saldo Inicial')
            .eq('month', transaction.month)
            .eq('year', transaction.year)
            .single();

        const dbData = mapToDB(transaction);

        if (existing) {
            // Update
            const { data, error } = await supabase
                .from('transactions')
                .update(dbData)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return mapToApp(data);
        } else {
            // Insert
            const { data, error } = await supabase
                .from('transactions')
                .insert([{ ...dbData, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return mapToApp(data);
        }
    },

    async syncLocalDataToCloud(transactions: Transaction[]) {
        // Bulk Insert/Upsert logic
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbTransactions = transactions.map(t => {
            const mapped = {
                ...mapToDB(t),
                user_id: user.id
            };

            // Remove 'id' if it's not a valid UUID (e.g. Perfex string IDs)
            // Postgres uuid type is strict.
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (mapped.id && !uuidRegex.test(mapped.id)) {
                delete mapped.id;
            }
            return mapped;
        });

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
    },

    // --- Debts (Crediários) ---
    async fetchDebts() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('debts')
            .select('*');

        if (error) {
            console.error('Error fetching debts:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            currentBalance: Number(d.current_balance),
            history: d.history || []
        }));
    },

    async syncDebts(debts: any[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbDebts = debts.map(d => ({
            id: d.id,
            user_id: user.id,
            name: d.name,
            current_balance: d.currentBalance,
            history: d.history
        }));

        const { error } = await supabase
            .from('debts')
            .upsert(dbDebts, { onConflict: 'id' });

        if (error) console.error('Error syncing debts:', error);
    },

    // --- Cards ---
    async fetchCards() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase.from('credit_cards').select('*');
        if (error) { console.error('Error fetching cards', error); return []; }
        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            closingDay: c.closing_day,
            dueDay: c.due_day,
            limit: Number(c.limit),
            color: c.color
        }));
    },
    async syncCards(cards: any[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const dbCards = cards.map(c => ({
            id: c.id,
            user_id: user.id,
            name: c.name,
            closing_day: c.closingDay,
            due_day: c.dueDay,
            limit: c.limit, // "limit" column
            color: c.color
        }));
        const { error } = await supabase.from('credit_cards').upsert(dbCards, { onConflict: 'id' });
        if (error) console.error('Error syncing cards', error);
    },

    // --- Subscriptions ---
    async fetchSubscriptions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase.from('subscriptions').select('*');
        if (error) { console.error('Error fetching subscriptions', error); return []; }
        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            amount: Number(s.amount),
            day: s.day,
            category: s.category,
            active: s.active,
            lastGeneratedMonth: s.last_generated_month,
            lastGeneratedYear: s.last_generated_year
        }));
    },
    async syncSubscriptionsData(subs: any[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const dbSubs = subs.map(s => ({
            id: s.id,
            user_id: user.id,
            name: s.name,
            amount: s.amount,
            day: s.day,
            category: s.category,
            active: s.active,
            last_generated_month: s.lastGeneratedMonth,
            last_generated_year: s.lastGeneratedYear
        }));
        const { error } = await supabase.from('subscriptions').upsert(dbSubs, { onConflict: 'id' });
        if (error) console.error('Error syncing subscriptions', error);
    },

    // --- Card Transactions (Items inside invoice) ---
    async fetchCardTransactions() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase.from('card_transactions').select('*');
        if (error) { console.error('Error fetching card transactions', error); return []; }
        return data.map((t: any) => ({
            id: t.id,
            cardId: t.card_id,
            description: t.description,
            amount: Number(t.amount),
            month: t.month,
            year: t.year,
            installmentNumber: t.installment_number,
            totalInstallments: t.total_installments,
            category: t.category,
            originalDate: t.original_date
        }));
    },
    async syncCardTransactions(trans: any[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Upserting thousands of rows can be heavy. Ideally we only sync changes.
        // But for now, full sync ensures safety.
        const dbTrans = trans.map(t => ({
            id: t.id,
            user_id: user.id,
            card_id: t.cardId,
            description: t.description,
            amount: t.amount,
            month: t.month,
            year: t.year,
            installment_number: t.installmentNumber,
            total_installments: t.totalInstallments,
            category: t.category,
            original_date: t.originalDate
        }));
        const { error } = await supabase.from('card_transactions').upsert(dbTrans, { onConflict: 'id' });
        if (error) console.error('Error syncing card transactions', error);
    }
};
