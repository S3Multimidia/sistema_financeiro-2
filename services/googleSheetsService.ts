
export const GoogleSheetsService = {
  async sync(data: any) {
    const url = localStorage.getItem('google_sheets_url');
    if (!url) return;

    try {
      // Se for um script do Google, usamos no-cors por causa dos redirecionamentos
      const isGoogle = url.includes('script.google.com');

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Sempre no-cors para Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: data.transactions,
          appConfig: data.appConfig,
          categoriesMap: data.categoriesMap,
          timestamp: new Date().toISOString(),
          origin: 'FINANCEIRO_PRO_2026'
        })
      });

      return true;
    } catch (error) {
      console.error('Erro de sincronismo:', error);
      throw error;
    }
  },

  async load() {
    const url = localStorage.getItem('google_sheets_url');
    if (!url) return null;

    try {
      // Google Script precisaria de "echo" do JSONP se fosse pra ler direto no navegador sem CORS,
      // mas o Apps Script retorna redirecionamento 302 que o navegador segue.
      // Porém, com 'no-cors' não conseguimos ler o corpo da resposta.
      // O truque para ler dados do Google Apps Script é que o GET geralmente precisa seguir redirect.
      // Se tivermos CORS problem, o usuário terá que publicar como "Anyone, even anonymous".

      const response = await fetch(`${url}?action=read`);

      if (!response.ok) {
        throw new Error('Falha ao ler dados');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return null;
    }
  }
};
