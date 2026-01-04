
import { API_CONFIG } from '../constants';
import { Transaction } from '../types';

interface PerfexInvoice {
  id: string;
  number: string;
  date: string;
  total: string;
  status: string;
}

interface PerfexExpense {
  expenseid: string;
  category_name?: string;
  amount: string;
  date: string;
  expense_name: string;
  note: string;
}

export const PerfexService = {
  /**
   * Realiza a requisição usando um Proxy transparente e estratégia de fallback.
   * Alguns Perfex usam plural, outros singular. Tentamos resolver o 404 assim.
   */
  async requestSmart(resource: string): Promise<any> {
    const domain = "https://admin.s3m.com.br";
    const token = API_CONFIG.TOKEN;
    
    // Lista de URLs para tentar (plural e singular)
    const endpointsToTry = [
      `${domain}/api/${resource}s`,
      `${domain}/api/${resource}`
    ];
    
    let lastError = null;

    for (const endpoint of endpointsToTry) {
      // O cors-anywhere ou corsproxy.io às vezes são bloqueados. Tentamos o sh-proxy.
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(endpoint)}`;

      try {
        console.log(`📡 Tentando Perfex: ${endpoint}`);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            // Alguns WAF bloqueiam se não houver um User-Agent "real" vindo do proxy
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) continue;

        const wrapper = await response.json();
        // O AllOrigins retorna o conteúdo dentro de wrapper.contents como string
        if (!wrapper.contents) continue;
        
        const data = JSON.parse(wrapper.contents);
        
        // Se a API retornar erro de permissão interno
        if (data && data.status === false) {
           console.warn(`Perfex recusou acesso em ${endpoint}: ${data.message}`);
           continue; 
        }

        return data;

      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error(`Não foi possível acessar ${resource} no Perfex.`);
  },

  async getInvoices(): Promise<Transaction[]> {
    try {
      const data = await this.requestSmart('invoice');
      if (!data) return [];
      
      const items: PerfexInvoice[] = Array.isArray(data) ? data : (data.data || []);

      return items.map(item => {
        const date = new Date(item.date);
        return {
          id: `perfex-inv-${item.id}`,
          day: isNaN(date.getDate()) ? 1 : date.getDate(),
          month: isNaN(date.getMonth()) ? 0 : date.getMonth(),
          year: isNaN(date.getFullYear()) ? 2026 : date.getFullYear(),
          category: 'VENDAS/FATURAS',
          description: `FATURA #${item.number || item.id} (PERFEX)`.toUpperCase(),
          amount: parseFloat(item.total) || 0,
          type: 'income' as const
        };
      });
    } catch (e) {
      console.warn("Aviso: Falha ao buscar Invoices.");
      return [];
    }
  },

  async getExpenses(): Promise<Transaction[]> {
    try {
      const data = await this.requestSmart('expense');
      if (!data) return [];

      const items: PerfexExpense[] = Array.isArray(data) ? data : (data.data || []);

      return items.map(item => {
        const date = new Date(item.date);
        return {
          id: `perfex-exp-${item.expenseid}`,
          day: isNaN(date.getDate()) ? 1 : date.getDate(),
          month: isNaN(date.getMonth()) ? 0 : date.getMonth(),
          year: isNaN(date.getFullYear()) ? 2026 : date.getFullYear(),
          category: (item.category_name || 'DESPESA CRM').toUpperCase(),
          description: (item.expense_name || item.note || 'LANÇAMENTO CRM').toUpperCase(),
          amount: parseFloat(item.amount) || 0,
          type: 'expense' as const
        };
      });
    } catch (e) {
      console.warn("Aviso: Falha ao buscar Expenses.");
      return [];
    }
  },

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const results = await Promise.allSettled([
        this.getInvoices(),
        this.getExpenses()
      ]);
      
      const transactions: Transaction[] = [];
      results.forEach(res => {
        if (res.status === 'fulfilled') {
          transactions.push(...res.value);
        }
      });
      
      return transactions;
    } catch {
      return [];
    }
  }
};
