
export const GoogleSheetsService = {
  async sync(data: any) {
    const url = localStorage.getItem('google_sheets_url');
    if (!url) return;

    try {
      // Se for um script do Google, usamos no-cors por causa dos redirecionamentos
      const isGoogle = url.includes('script.google.com');
      
      const response = await fetch(url, {
        method: 'POST',
        mode: isGoogle ? 'no-cors' : 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: data.transactions,
          timestamp: new Date().toISOString(),
          origin: 'FINANCEIRO_PRO_2026'
        })
      });

      // No modo no-cors não conseguimos ler o status, assumimos sucesso se não houver exceção
      if (isGoogle) return true;
      
      return response.ok;
    } catch (error) {
      console.error('Erro de sincronismo:', error);
      throw error;
    }
  }
};
