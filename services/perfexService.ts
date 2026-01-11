import api from './api';

export interface PerfexConfig {
  url: string;
  token: string;
}

export const PerfexService = {
  async getInvoices(config: PerfexConfig) {
    // Ensure URL ends with /invoices if not present, or use the base API URL
    // User provided: https://admin.s3m.com.br/admin/api or https://admin.s3m.com.br/api
    // The endpoint for invoices is /invoices

    let targetUrl = config.url.trim();
    if (targetUrl.endsWith('/')) targetUrl = targetUrl.slice(0, -1);
    if (!targetUrl.endsWith('/invoices')) targetUrl += '/invoices';

    const response = await api.post('/perfex/proxy', {
      targetUrl: targetUrl,
      token: config.token,
      method: 'GET'
    });

    return response.data;
  },

  async testConnection(config: PerfexConfig) {
    try {
      await this.getInvoices(config);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  mapInvoiceToTransaction(invoice: any) {
    // Map Perfex Invoice to App Transaction
    // Status mapping (approximate based on standard Perfex):
    // 1: Unpaid
    // 2: Paid
    // 3: Partial
    // 4: Overdue
    // 6: Draft

    const isPaid = invoice.status === '2'; // Strictly Paid
    const isExpense = false; // Invoices are income

    return {
      description: `Fatura Perfex #${invoice.number} - ${invoice.client?.company || 'Cliente'}`,
      amount: parseFloat(invoice.total),
      type: 'income',
      category: 'Perfex CRM',
      date: invoice.date, // YYYY-MM-DD
      year: new Date(invoice.date).getFullYear(),
      month: new Date(invoice.date).getMonth(),
      day: new Date(invoice.date).getDate(),
      completed: isPaid,
      totalInstallments: 1,
      installmentNumber: 1,
      original_id: `perfex_inv_${invoice.id}` // Unique ID to prevent duplicates
    };
  },

  async syncInvoicesToSystem(config: PerfexConfig, progressCallback?: (msg: string) => void) {
    if (progressCallback) progressCallback('Conectando ao Perfex CRM...');

    const data = await this.getInvoices(config);

    let invoices = Array.isArray(data) ? data : data.data;
    if (!invoices && data.original) invoices = data.original;

    if (!Array.isArray(invoices)) {
      console.error('Formato inesperado do Perfex:', data);
      throw new Error('Formato de resposta inválido do Perfex CRM');
    }

    if (progressCallback) progressCallback(`Baixado com sucesso! Processando...`);

    // Filter for Current Month Only (User Request)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredInvoices = invoices.filter((inv: any) => {
      if (!inv.date) return false;
      const invDate = new Date(inv.date);
      // Fix timezone offset issues by treating string as local or UTC? 
      // inv.date is usually YYYY-MM-DD. new Date('2024-01-01') is UTC, which might be previous day in local.
      // Safer: split string.
      const [year, month] = inv.date.split('-');
      return parseInt(year) === currentYear && (parseInt(month) - 1) === currentMonth;
    });

    if (progressCallback) progressCallback(`Filtrado: ${filteredInvoices.length} faturas deste mês (de ${invoices.length} total).`);

    const transactions = filteredInvoices.map((inv: any) => this.mapInvoiceToTransaction(inv));

    if (progressCallback) progressCallback('Enviando para o Banco de Dados (em lotes)...');

    // Batch processing to avoid 413 Payload Too Large
    const BATCH_SIZE = 50;
    let processed = 0;

    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);
      if (progressCallback) progressCallback(`Sincronizando lote ${Math.ceil((i + 1) / BATCH_SIZE)} de ${Math.ceil(transactions.length / BATCH_SIZE)}...`);

      await api.post('/transactions/migrate', { transactions: batch });
      processed += batch.length;
    }

    if (progressCallback) progressCallback('Sincronização concluída com sucesso!');
    return processed;
  }
};
