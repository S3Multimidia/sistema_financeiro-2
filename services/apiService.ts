import api from './api';
import { Transaction } from '../types';

// Helper to map DB snake_case to App camelCase
// Mantemos a mesma lógica pois o banco Postgres usa snake_case
// Helper to map DB snake_case to App camelCase
// Mantemos a mesma lógica pois o banco Postgres usa snake_case
const mapToApp = (t: any): Transaction => ({
    id: t.id ? t.id.toString() : Math.random().toString(), // Ensure ID is string
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
    // client_name/external_url matches DB column names, so no change needed, 
    // but good to map explicitly if we want to support camelCase input for snake_case db
    if (t.client_name !== undefined) mapped.client_name = t.client_name;
    if (t.external_url !== undefined) mapped.external_url = t.external_url;
    if (t.perfex_status !== undefined) mapped.perfex_status = t.perfex_status;

    return mapped;
};

export const ApiService = {
    // --- Transactions ---

    async fetchTransactions() {
        const response = await api.get('/transactions');
        return (response.data || []).map(mapToApp);
    },

    async addTransaction(transaction: Omit<Transaction, 'id'>) {
        // O Backend espera campos snake_case ou lida com eles. Como definimos colunas snake_case no INSERT lá, 
        // e o mapToDB converte para snake_case, vamos enviar o objeto mapeado.
        const dbData = mapToDB(transaction);
        const response = await api.post('/transactions', dbData);
        return mapToApp(response.data);
    },

    async updateTransaction(id: string, updates: Partial<Transaction>) {
        const dbUpdates = mapToDB(updates);
        const response = await api.put(`/transactions/${id}`, dbUpdates);
        return mapToApp(response.data);
    },

    async deleteTransaction(id: string) {
        await api.delete(`/transactions/${id}`);
    },

    async clearAllTransactions() {
        // Since we don't have a direct /transactions/all DELETE endpoint in the backend code I saw,
        // we might need to implement it or use a loop.
        // Wait, I saw `app.post('/api/transactions/migrate')`.
        // I'll assume we can add a delete all endpoint or just iterate. 
        // BUT better: I can add `app.delete('/api/transactions/all')` if I could edit backend easily and redeploy.
        // However, the backend file `server/index.js` acts on `d:\Sistema Financeiro\server\index.js`.
        // I CAN edit `server/index.js`!
        // So I will first edit the backend to include a logical clear all route, OR just use the loop here.
        // Backend edit is cleaner.
        // But for now, to avoid restarting server issues if user is running it separately (though I can restart it?),
        // I'll check if I can just implement it in backend.
        // For now, let's just make a call to a new endpoint I'll add: DELETE /api/transactions/reset
        await api.delete('/transactions/reset');
    },

    async syncLocalDataToCloud(transactions: Transaction[]) {
        const response = await api.post('/transactions/migrate', { transactions });
        return response.data;
    },

    // --- Auth (Opicional aqui, mas útil) ---
    async login(email: string, pass: string) {
        const response = await api.post('/auth/login', { email, password: pass });
        if (response.data.token) {
            localStorage.setItem('s3m_auth_token', response.data.token);
            // Cache user data including balance
            if (response.data.user) {
                localStorage.setItem('s3m_user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        }
        throw new Error('Falha no login');
    },

    async logout() {
        localStorage.removeItem('s3m_auth_token');
        localStorage.removeItem('s3m_user_data');
    },

    async getUser() {
        const token = localStorage.getItem('s3m_auth_token');
        if (!token) return null;

        // Return cached user if available for fast load
        const cached = localStorage.getItem('s3m_user_data');
        if (cached) return JSON.parse(cached);

        return { email: 'financeiro@s3m.com.br' };
    },

    async updateUserSettings(settings: { starting_balance?: number }) {
        const response = await api.put('/users/me', settings);
        // Update local cache
        const cached = localStorage.getItem('s3m_user_data');
        if (cached) {
            const user = JSON.parse(cached);
            if (settings.starting_balance !== undefined) user.starting_balance = settings.starting_balance;
            localStorage.setItem('s3m_user_data', JSON.stringify(user));
        }
        return response.data;
    }
};
