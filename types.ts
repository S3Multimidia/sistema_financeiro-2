
export type TransactionType = 'income' | 'expense' | 'appointment';

export interface Transaction {
  id: string;
  day: number;
  month: number;
  year: number;
  category: string;
  subCategory?: string; // Novo campo opcional
  description: string;
  amount: number;
  type: TransactionType;
  acknowledged?: boolean;
  completed?: boolean;

  isFixed?: boolean;
  installmentId?: string;
  installmentNumber?: number;
  totalInstallments?: number;

  external_url?: string;
  client_name?: string;
  perfex_status?: string;
}

export interface MonthSummary {
  previousBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  endOfMonthBalance: number;
}

// Estrutura de categorias com subcategorias iniciais
export const INITIAL_CATEGORIES_MAP: Record<string, string[]> = {
  'RÁDIO INDOOR': ['Mensalidade', 'Instalação', 'Manutenção'],
  'VINHETAS': ['Comercial', 'Institucional', 'Pontes'],
  'HOSPEDAGEM': ['Site', 'Streaming', 'E-mail'],
  'SERVIÇOS': ['Contabilidade', 'Internet', 'Energia'],
  'PESSOAL': ['Saúde', 'Lazer', 'Educação'],
  'CASA': ['Aluguel', 'Supermercado', 'Manutenção'],
  'ALIMENTAÇÃO': ['Restaurante', 'Padaria Oliveira', 'Café'],
  'SALÁRIO/COMISSÃO': ['Vendas A', 'Vendas B'],
  'IMPOSTOS/MEI': ['DAS', 'IRPF'],
  'POUPANÇA': ['Reserva Emergência', 'Investimentos', 'Aposentadoria'],
  'OUTROS': []
};
