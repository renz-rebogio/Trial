const API_URL = 'http://localhost:8000';  // Update with your FastAPI URL

function normalizeTransaction(tx) {
    // Convert amount to number if it's a string
    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
    
    // Infer type based on amount
    const type = amount < 0 ? 'expense' : 'income';
    
    // Infer category based on description
    let category = 'other';
    const desc = tx.description?.toLowerCase() || '';
    if (desc.includes('transfer')) category = 'transfer';
    if (desc.includes('withdrawal') || desc.includes('atm')) category = 'withdrawal';
    
    return {
        date: tx.date || '',
        description: tx.description || '',
        amount: Math.abs(amount), // AI insights expects positive amounts
        type,
        category
    };
}

export async function getAIInsights(transactions, feature) {
    try {
        // Normalize transactions before sending
        const normalizedTransactions = transactions.map(normalizeTransaction);

        const response = await fetch(`${API_URL}/api/insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transactions: normalizedTransactions,
                feature,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get insights');
        }

        return await response.json();
    } catch (error) {
        console.error('AI Insights API Error:', error);
        if (error.message) {
            throw new Error(error.message);
        }
        throw error;
    }
}