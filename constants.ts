
import { Transaction, INITIAL_CATEGORIES_MAP } from './types';

export const INITIAL_PREVIOUS_BALANCE = 0.00;
export const APP_VERSION = '2.6';

/**
 * CONFIGURAÇÃO DA API PERFEX
 * O serviço PerfexService.ts agora gerencia a descoberta automática da URL.
 * Basta garantir que o TOKEN abaixo seja um Token de API válido gerado no módulo de API do seu Perfex.
 */
export const API_CONFIG = {
  BASE_URL: 'https://admin.s3m.com.br/api',
  TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibjhuIiwibmFtZSI6Im44biIsIkFQSV9USU1FIjoxNzQ3MDgwMjUyfQ.pZ4ZhUTHMyo6VwJSs3Y6133kcXwk4UcV9DbvcIAfoPY'
};

export const GOOGLE_CLIENT_ID = '18162038234-q0jinnn1ucu3he5jtmt3gm2tll3dnoe2.apps.googleusercontent.com';
export const ALLOWED_EMAILS = ['s3multimidia@gmail.com'];
export const AUTO_CONFIG_URL = 'https://script.google.com/macros/s/AKfycbxmCwcga2wGRSFCmKoJkTl5yf-IiGcQboXUgcMhf9cl-qpimyoPR_YqDXnnCnZnkkxb4g/exec';

export const DEFAULT_CATEGORIES = Object.keys(INITIAL_CATEGORIES_MAP);

export const INITIAL_TRANSACTIONS: Transaction[] = [];
