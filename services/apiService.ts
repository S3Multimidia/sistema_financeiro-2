import api from './api';
import { Transaction } from '../types';

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
    totalInstallments: t.total_installments
});

// Helper to map App camelCase to DB snake_case
const mapToDB = (t: Partial<Transaction>) => {
    const mapped: any = { ...t };
    if (t.subCategory !== undefined) mapped.sub_category = t.subCategory;
    if (t.isFixed !== undefined) mapped.is_fixed = t.isFixed;
    if (t.installmentId !== undefined) mapped.installment_id = t.installmentId;
    if (t.installmentNumber !== undefined) mapped.installment_number = t.installmentNumber;
    if (t.totalInstallments !== undefined) mapped.total_installments = t.totalInstallments;
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

    async syncLocalDataToCloud(transactions: Transaction[]) {
        const response = await api.post('/transactions/migrate', { transactions });
        return response.data;
    },

    // --- Auth (Opicional aqui, mas útil) ---
    async login(email: string, pass: string) {
        const response = await api.post('/auth/login', { email, password: pass });
        if (response.data.token) {
            localStorage.setItem('s3m_auth_token', response.data.token);
            return response.data;
        }
        throw new Error('Falha no login');
    },

    async logout() {
        localStorage.removeItem('s3m_auth_token');
    },

    async getUser() {
        const token = localStorage.getItem('s3m_auth_token');
        if (!token) return null;
        // Idealmente teríamos uma rota /me, mas por enquanto vamos confiar no token ou decodificar (se jwt-decode)
        // Vamos retornar um objeto mockado baseado no token guardado ou null se expirado
        // Para MVP, assumimos logado se tem token. Melhorar depois.
        return { email: 'financeiro@s3m.com.br' };
    }
};
