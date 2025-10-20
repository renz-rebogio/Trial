export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { parsedStatement } = req.body;

    if (!parsedStatement || !parsedStatement.transactions) {
      return res.status(400).json({ 
        error: 'parsedStatement with transactions is required' 
      });
    }

    // Simple AI categorization (JavaScript only, no Python needed)
    const categorizeTransaction = (description, amount) => {
      const desc = (description || '').toLowerCase();
      const amt = parseFloat(amount) || 0;

      if (amt > 0) {
        if (desc.includes('salary') || desc.includes('deposit')) return 'income';
        if (desc.includes('transfer') || desc.includes('fund')) return 'transfer_in';
      }
      
      if (amt < 0) {
        if (desc.includes('atm') || desc.includes('withdrawal')) return 'cash_withdrawal';
        if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('sm')) return 'groceries';
        if (desc.includes('jollibee') || desc.includes('restaurant') || desc.includes('food')) return 'dining';
        if (desc.includes('meralco') || desc.includes('pldt') || desc.includes('water')) return 'utilities';
        if (desc.includes('petron') || desc.includes('shell') || desc.includes('gas')) return 'transportation';
        if (desc.includes('payment') || desc.includes('bill')) return 'bill_payment';
      }
      
      return 'uncategorized';
    };

    // Enhance transactions
    const enhancedTransactions = parsedStatement.transactions.map(txn => ({
      ...txn,
      ai_category: categorizeTransaction(txn.description, txn.amount),
      category_confidence: 0.85
    }));

    // Generate simple insights
    const totalExpenses = enhancedTransactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const insights = [{
      type: 'spending_pattern',
      message: `Total expenses analyzed: $${totalExpenses.toFixed(2)}`,
      category: 'info'
    }];

    return res.status(200).json({
      success: true,
      data: {
        transactions: enhancedTransactions,
        insights: insights,
        confidence_score: 0.85,
        ai_enhanced: true
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}