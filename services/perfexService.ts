import api from './api';
import { ApiService } from './apiService';

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



  async getClients(config: PerfexConfig) {
    let baseUrl = config.url.trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // Helper to fetch from a specific endpoint
    const fetchFromEndpoint = async (endpoint: string) => {
      let fullUrl = baseUrl;
      if (!fullUrl.endsWith(endpoint)) fullUrl += endpoint;

      try {
        console.log(`Tentando buscar clientes em: ${fullUrl}`);
        const response = await api.post('/perfex/proxy', {
          targetUrl: fullUrl,
          token: config.token,
          method: 'GET'
        });
        return response.data;
      } catch (error) {
        console.warn(`Falha ao buscar em ${endpoint}:`, error);
        return null;
      }
    };

    // Try '/customers' first (Standard for many modules)
    let data = await fetchFromEndpoint('/customers');

    // If failed or empty, try '/clients' (Alternative)
    if (!data || (Array.isArray(data) && data.length === 0) || (data.data && Array.isArray(data.data) && data.data.length === 0)) {
      console.log("Endpoint '/customers' não retornou dados. Tentando '/clients'...");
      const dataClients = await fetchFromEndpoint('/clients');
      if (dataClients) data = dataClients;
    }

    return data || [];
  },

  mapInvoiceToTransaction(invoice: any, config: PerfexConfig, clientMap: Record<string, string> = {}) {
    // Map Perfex Invoice to App Transaction
    // Status mapping (approximate based on standard Perfex):
    // 1: Unpaid
    // 2: Paid
    // 3: Partial
    // 4: Overdue
    // 6: Draft
    const STATUS_MAP: Record<string, string> = {
      '1': 'Em Aberto',
      '2': 'Paga',
      '3': 'Parcial',
      '4': 'Atrasada',
      '5': 'Cancelada',
      '6': 'Rascunho'
    };
    const perfexStatus = STATUS_MAP[String(invoice.status)] || 'Desconhecido';

    const isPaid = invoice.status === '2'; // Strictly Paid

    // Better client name capture
    // Priority: Company from Invoice Object > Mapped Name from Client List > Fallback ID > Default
    let clientName = invoice.client?.company || invoice.company;

    // Convert IDs to strings for reliable lookup
    const invClientId = String(invoice.clientid || '');

    if (!clientName && invClientId && clientMap[invClientId]) {
      clientName = clientMap[invClientId];
    }

    if (!clientName) {
      // Log for debugging if name is still missing but we have an ID
      if (invClientId) console.warn(`Cliente não encontrado no mapa para ID: ${invClientId}`);
      clientName = invClientId ? `Cliente #${invClientId}` : 'Cliente Perfex';
    }

    // Construct public invoice link
    const baseUrl = config.url.replace('/api', '').replace('/invoices', '');
    const externalUrl = (invoice.id && invoice.hash) ? `${baseUrl}/invoice/${invoice.id}/${invoice.hash}` : undefined;

    return {
      id: `perfex_inv_${invoice.id}`, // Frontend uses this temporarily
      original_id: `perfex_inv_${invoice.id}`, // CRITICAL for SQL Upsert (on conflict constraint)
      description: `Fatura Perfex #${invoice.number} - ${clientName}`,
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
      client_name: clientName,
      external_url: externalUrl,
      perfex_status: perfexStatus
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

    if (progressCallback) progressCallback(`Baixado com sucesso! Buscando nomes de clientes...`);

    // Fetch Clients to map names
    let clientMap: Record<string, string> = {};
    try {
      const clientsData = await this.getClients(config);
      const clients = Array.isArray(clientsData) ? clientsData : (clientsData.data || []);

      console.log(`Clientes encontrados: ${clients.length}`); // Debug log

      if (Array.isArray(clients)) {
        clients.forEach((c: any) => {
          // Determine ID and Company fields (Handle variations)
          const id = c.userid || c.id || c.client_id;
          const name = c.company || c.name || c.client_name;

          if (id && name) {
            clientMap[String(id)] = name;
          }
        });
        if (progressCallback) progressCallback(`Mapeamento de clientes concluído (${Object.keys(clientMap).length} nomes).`);
      }
    } catch (e) {
      console.warn('Não foi possível buscar a lista de clientes para mapeamento de nomes:', e);
    }

    if (progressCallback) progressCallback(`Processando faturas...`);

    // Filter: Current Month onwards (including future)
    // User requested "Current Month" but also "Next Month" sync naturally.
    // Logic: Date >= First Day of Current Month
    const now = new Date();
    // Start of current month (e.g., 2024-01-01)
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filteredInvoices = invoices.filter((inv: any) => {
      if (!inv.date) return false;
      // Parse inv.date carefully (YYYY-MM-DD)
      const [year, month, day] = inv.date.split('-');
      const invoiceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Return if invoice date is equal or greater than start of current month
      return invoiceDate >= startOfCurrentMonth;
    });

    if (progressCallback) progressCallback(`Filtrado: ${filteredInvoices.length} faturas (Mês Atual + Futuro).`);

    const transactions = filteredInvoices.map((inv: any) => {
      const mapped = this.mapInvoiceToTransaction(inv, config, clientMap);

      // If recurring > 0, append info to description
      if (inv.recurring && inv.recurring != '0') {
        mapped.description += ' (Recorrente)';
      }

      return mapped;
    });

    if (progressCallback) progressCallback('Enviando para o Banco de Dados (em lotes)...');

    // Batch processing to avoid 413 Payload Too Large
    const BATCH_SIZE = 50;
    let processed = 0;

    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);
      if (progressCallback) progressCallback(`Sincronizando lote ${Math.ceil((i + 1) / BATCH_SIZE)} de ${Math.ceil(transactions.length / BATCH_SIZE)}...`);

      // await api.post('/transactions/migrate', { transactions: batch });
      // Now using Supabase direct sync via ApiService
      await ApiService.syncLocalDataToCloud(batch);
      processed += batch.length;
    }

    if (progressCallback) progressCallback('Sincronização concluída com sucesso!');
    return processed;
  }
};
