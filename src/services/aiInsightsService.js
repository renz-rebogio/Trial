const API_URL = 'http://localhost:8000';

export async function getAIInsights(transactions, feature) {
    try {
        // Send transactions AS-IS without any modification
        // Your AI model has already processed and categorized them correctly
        const response = await fetch(`${API_URL}/api/insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transactions: transactions,
                feature,
                // Add days parameter for weekly_report feature
                ...(feature === "weekly_report" && { days: 28 })
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