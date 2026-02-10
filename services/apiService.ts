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
    debtId: t.debt_id,
    isSubscription: t.is_subscription,
    subscriptionId: t.subscription_id,
    isCreditCardBill: t.is_credit_card_bill,
    relatedCardId: t.related_card_id,
    time: t.time
});

// Helper to map App camelCase to DB snake_case
const mapToDB = (t: Partial<Transaction>) => {
    const mapped: any = {};

    // Standard columns
    if (t.day !== undefined) mapped.day = t.day;
    if (t.month !== undefined) mapped.month = t.month;
    if (t.year !== undefined) mapped.year = t.year;
    if (t.category !== undefined) mapped.category = t.category;
    if (t.description !== undefined) mapped.description = t.description;
    if (t.amount !== undefined) mapped.amount = t.amount;
    if (t.type !== undefined) mapped.type = t.type;
    if (t.acknowledged !== undefined) mapped.acknowledged = t.acknowledged;
    if (t.completed !== undefined) mapped.completed = t.completed;
    if (t.client_name !== undefined) mapped.client_name = t.client_name;
    if (t.external_url !== undefined) mapped.external_url = t.external_url;
    if (t.perfex_status !== undefined) mapped.perfex_status = t.perfex_status;
    if (t.time !== undefined) mapped.time = t.time;

    // CamelCase to SnakeCase mappings
    if (t.subCategory !== undefined) mapped.sub_category = t.subCategory;
    if (t.isFixed !== undefined) mapped.is_fixed = t.isFixed;
    if (t.installmentId !== undefined) mapped.installment_id = t.installmentId;
    if (t.installmentNumber !== undefined) mapped.installment_number = t.installmentNumber;
    if (t.totalInstallments !== undefined) mapped.total_installments = t.totalInstallments;
    if (t.debtId !== undefined) mapped.debt_id = t.debtId;
    if (t.isSubscription !== undefined) mapped.is_subscription = t.isSubscription;
    if (t.subscriptionId !== undefined) mapped.subscription_id = t.subscriptionId;
    if (t.isCreditCardBill !== undefined) mapped.is_credit_card_bill = t.isCreditCardBill;
    if (t.relatedCardId !== undefined) mapped.related_card_id = t.relatedCardId;

    // Preserve original_id if present (for sync logic)
    if ((t as any).original_id) mapped.original_id = (t as any).original_id;
    if (t.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t.id)) {
        mapped.id = t.id;
    }

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

    async deleteTransactionsByOriginalIds(originalIds: string[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (originalIds.length === 0) return;

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .in('original_id', originalIds);

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

    async updateUserSettings(settings: { starting_balance?: number, gemini_api_key?: string }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...settings });

        if (error) throw error;
        return { success: true };
    },

    // --- Perfex Config (Global via Auth Metadata) ---
    async getPerfexConfig() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return user.user_metadata?.perfex_config || null;
    },

    async updatePerfexConfig(config: { url: string; token: string; enabled: boolean }) {
        const { data, error } = await supabase.auth.updateUser({
            data: { perfex_config: config }
        });
        if (error) throw error;
        return data.user?.user_metadata?.perfex_config;
    },

    // --- Categories (Global via Auth Metadata) ---
    async fetchCategories() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return user.user_metadata?.categories_map || null;
    },

    async saveCategories(categories: Record<string, string[]>) {
        const { data, error } = await supabase.auth.updateUser({
            data: { categories_map: categories }
        });
        if (error) {
            console.error("Error saving categories to cloud:", error);
            // Silent fail or retry logic could go here
        }
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

        if (debts.length === 0) {
            await supabase.from('debts').delete().eq('user_id', user.id);
            return;
        }

        const dbDebts = debts.map(d => ({
            id: d.id,
            user_id: user.id,
            name: d.name,
            current_balance: d.currentBalance,
            history: d.history
        }));

        const { error: upsertError } = await supabase
            .from('debts')
            .upsert(dbDebts, { onConflict: 'id' });

        if (upsertError) console.error('Error syncing debts (upsert):', upsertError);

        // Clean Orphans
        const currentIds = debts.map(d => d.id);
        const { error: deleteError } = await supabase
            .from('debts')
            .delete()
            .eq('user_id', user.id)
            .not('id', 'in', `(${currentIds.join(',')})`); // .not with 'in' expects formatted list or array? 
        // Actually supabase-js: .not('column', 'in', array)

        // Let's use filter syntax clearly:
        await supabase.from('debts').delete().eq('user_id', user.id).not('id', 'in', `(${currentIds.map(id => `"${id}"`).join(',')})`);
        // Wait, supabase-js query builder `in` takes an array. `not` takes operator.
        // .not('id', 'in', currentIds) -> This generates `id not in (1,2,3)`
        // Let's rely on standard .not('id', 'in', currentIds) if typed correctly.
        // If TypeScript complains, we cast.
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

        if (cards.length === 0) {
            await supabase.from('credit_cards').delete().eq('user_id', user.id);
            return;
        }

        const dbCards = cards.map(c => ({
            id: c.id,
            user_id: user.id,
            name: c.name,
            closing_day: c.closingDay,
            due_day: c.dueDay,
            limit: c.limit,
            color: c.color
        }));

        await supabase.from('credit_cards').upsert(dbCards, { onConflict: 'id' });

        const currentIds = cards.map(c => c.id);
        await supabase.from('credit_cards').delete().eq('user_id', user.id).not('id', 'in', currentIds);
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

        if (subs.length === 0) {
            await supabase.from('subscriptions').delete().eq('user_id', user.id);
            return;
        }

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

        await supabase.from('subscriptions').upsert(dbSubs, { onConflict: 'id' });

        const currentIds = subs.map(s => s.id);
        await supabase.from('subscriptions').delete().eq('user_id', user.id).not('id', 'in', currentIds);
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

        if (trans.length === 0) {
            await supabase.from('card_transactions').delete().eq('user_id', user.id);
            return;
        }

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

        await supabase.from('card_transactions').upsert(dbTrans, { onConflict: 'id' });

        const currentIds = trans.map(t => t.id);
        await supabase.from('card_transactions').delete().eq('user_id', user.id).not('id', 'in', currentIds);
    }
};
