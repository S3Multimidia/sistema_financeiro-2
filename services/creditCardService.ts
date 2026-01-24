import { CardTransaction, CreditCard, Transaction } from '../types';

export const CreditCardService = {

    // Create installment transactions based on a purchase
    generateInstallments: (
        card: CreditCard,
        description: string,
        amount: number,
        installments: number,
        purchaseDate: Date,
        category: string
    ): CardTransaction[] => {
        const transactions: CardTransaction[] = [];
        const installmentValue = amount / installments;

        let currentMonth = purchaseDate.getMonth();
        let currentYear = purchaseDate.getFullYear();

        // Logic: If purchase is AFTER closing day, it goes to NEXT month's invoice
        if (purchaseDate.getDate() >= card.closingDay) {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        for (let i = 1; i <= installments; i++) {
            transactions.push({
                id: Math.random().toString(36).substr(2, 9),
                cardId: card.id,
                description: description,
                amount: installmentValue,
                month: currentMonth,
                year: currentYear,
                installmentNumber: i,
                totalInstallments: installments,
                category: category,
                originalDate: purchaseDate.toISOString()
            });

            // Advance month
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        return transactions;
    },

    // Calculate total for a specific invoice (Card + Month + Year)
    calculateInvoiceTotal: (
        transactions: CardTransaction[],
        cardId: string,
        month: number,
        year: number
    ): number => {
        return transactions
            .filter(t => t.cardId === cardId && t.month === month && t.year === year)
            .reduce((acc, t) => acc + t.amount, 0);
    },

    // Sync Logic: Ensure Main Transaction List has the Invoice Entry
    syncInvoiceToTransactions: (
        mainTransactions: Transaction[],
        cardTransactions: CardTransaction[],
        cards: CreditCard[]
    ): Transaction[] => {
        let updatedTransactions = [...mainTransactions];

        // For each card, check current and future months (e.g., next 12 months)
        const today = new Date();

        cards.forEach(card => {
            // Iterate next 12 months looking for invoices to sync
            for (let i = 0; i < 12; i++) {
                let targetMonth = today.getMonth() + i;
                let targetYear = today.getFullYear();

                if (targetMonth > 11) {
                    targetYear += Math.floor(targetMonth / 12);
                    targetMonth = targetMonth % 12;
                }

                const total = CreditCardService.calculateInvoiceTotal(cardTransactions, card.id, targetMonth, targetYear);

                // Find existing invoice transaction
                const invoiceIndex = updatedTransactions.findIndex(t =>
                    t.isCreditCardBill &&
                    t.relatedCardId === card.id &&
                    t.month === targetMonth &&
                    t.year === targetYear
                );

                if (total > 0) {
                    if (invoiceIndex >= 0) {
                        // Update existing
                        if (updatedTransactions[invoiceIndex].amount !== total) {
                            updatedTransactions[invoiceIndex] = {
                                ...updatedTransactions[invoiceIndex],
                                amount: total
                            };
                        }
                    } else {
                        // Create new
                        updatedTransactions.push({
                            id: Math.random().toString(36).substr(2, 9),
                            description: `Fatura ${card.name}`,
                            amount: total,
                            type: 'expense',
                            category: 'CARTÃO DE CRÉDITO',
                            day: card.dueDay,
                            month: targetMonth, // 0-11
                            year: targetYear,
                            isCreditCardBill: true,
                            relatedCardId: card.id,
                            completed: false // Default to open
                        });
                    }
                } else {
                    // If total is 0 but transaction exists, delete it (invoice cleared or empty)
                    if (invoiceIndex >= 0 && !updatedTransactions[invoiceIndex].completed) {
                        updatedTransactions.splice(invoiceIndex, 1);
                    }
                }
            }
        });

        // CLEANUP GHOST INVOICES (Deleted Cards)
        // Remove active card IDs
        const activeCardIds = new Set(cards.map(c => c.id));
        updatedTransactions = updatedTransactions.filter(t => {
            if (t.isCreditCardBill && t.relatedCardId) {
                // Keep only if card still exists
                return activeCardIds.has(t.relatedCardId);
            }
            return true;
        });

        return updatedTransactions;
    }
};
