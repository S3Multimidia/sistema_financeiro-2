import { Subscription, Transaction } from '../types';

export const SubscriptionService = {
    // Sync Logic: Ensure transactions exist for next 12 months
    syncSubscriptions: (
        currentTransactions: Transaction[],
        subscriptions: Subscription[]
    ): Transaction[] => {
        let updatedTransactions = [...currentTransactions];
        const today = new Date();
        const monthsToForecast = 12;

        subscriptions.forEach(sub => {
            if (!sub.active) return;

            for (let i = 0; i < monthsToForecast; i++) {
                let targetMonth = today.getMonth() + i;
                let targetYear = today.getFullYear();

                if (targetMonth > 11) {
                    targetYear += Math.floor(targetMonth / 12);
                    targetMonth = targetMonth % 12;
                }

                // Check if transaction already exists for this subscription in this month/year
                const exists = updatedTransactions.some(t =>
                    t.isSubscription &&
                    t.subscriptionId === sub.id &&
                    t.month === targetMonth &&
                    t.year === targetYear
                );

                if (!exists) {
                    updatedTransactions.push({
                        id: Math.random().toString(36).substr(2, 9),
                        description: sub.name,
                        amount: sub.amount,
                        type: 'expense', // Subscriptions are generally expenses
                        category: sub.category,
                        day: sub.day,
                        month: targetMonth,
                        year: targetYear,
                        completed: false,
                        isSubscription: true,
                        subscriptionId: sub.id,
                        isFixed: true, // Mark as fixed expense
                        installmentNumber: 1, // Treat as single installment per month
                        totalInstallments: 1
                    });
                }
            }
        });

        return updatedTransactions;
    }
};
