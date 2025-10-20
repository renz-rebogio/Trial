/**
 * Boogasi AI Service - Integrates the trained AI model into the system
 * Location: src/lib/ai/boogasiAiService.js
 * 
 * This service bridges the Python AI model with the Next.js frontend
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class BoogasiAiService {
  constructor() {
    this.modelPath = path.join(process.cwd(), 'ai_model');
    this.artifactsPath = path.join(this.modelPath, 'model_artifacts.json');
    this.labeledDataPath = path.join(process.cwd(), 'boogasi_ai_data', 'labeled');
  }

  /**
   * Load the trained model artifacts
   */
  async loadModelArtifacts() {
    try {
      const artifactsData = await fs.readFile(this.artifactsPath, 'utf-8');
      return JSON.parse(artifactsData);
    } catch (error) {
      console.error('Model artifacts not found. Training model first...');
      await this.trainModel();
      const artifactsData = await fs.readFile(this.artifactsPath, 'utf-8');
      return JSON.parse(artifactsData);
    }
  }

  /**
   * Train/retrain the AI model with labeled data
   */
  async trainModel() {
    try {
      const { stdout, stderr } = await execAsync(
        'python trainer.py',
        { cwd: this.modelPath }
      );
      
      console.log('Model training complete:', stdout);
      return { success: true, output: stdout };
    } catch (error) {
      console.error('Model training failed:', error);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  /**
   * Analyze a bank statement using the trained AI
   * @param {Object} parsedStatement - The parsed statement from the parser
   * @returns {Object} Enhanced statement with AI analysis
   */
  async analyzeStatement(parsedStatement) {
    try {
      // Load model artifacts to get learned patterns
      const artifacts = await this.loadModelArtifacts();
      
      // Apply AI enhancements
      const enhancedStatement = {
        ...parsedStatement,
        ai_enhanced: true,
        ai_version: artifacts.version,
        transactions: parsedStatement.transactions?.map(txn => 
          this.enhanceTransaction(txn, artifacts)
        ) || [],
        insights: this.generateInsights(parsedStatement),
        confidence_score: this.calculateConfidence(parsedStatement)
      };

      return enhancedStatement;
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Return original statement if AI fails
      return { ...parsedStatement, ai_enhanced: false, error: error.message };
    }
  }

  /**
   * Enhance a single transaction with AI categorization
   */
  enhanceTransaction(transaction, artifacts) {
    const description = transaction.description?.toUpperCase() || '';
    const amount = parseFloat(transaction.amount) || 0;

    // Auto-categorize based on learned patterns
    let category = this.categorizeTransaction(description, amount);
    
    // Calculate confidence score
    let confidence = this.getCategorizationConfidence(description, category);

    return {
      ...transaction,
      ai_category: category,
      category_confidence: confidence,
      original_category: transaction.category
    };
  }

  /**
   * Categorize transaction using rule-based AI
   */
  categorizeTransaction(description, amount) {
    const desc = description.toLowerCase();

    // Income patterns (positive amounts)
    if (amount > 0) {
      if (desc.includes('salary') || desc.includes('payroll') || 
          desc.includes('deposit') || desc.includes('income')) {
        return 'income';
      }
      if (desc.includes('transfer') || desc.includes('fund')) {
        return 'transfer_in';
      }
      if (desc.includes('refund') || desc.includes('return')) {
        return 'refund';
      }
    }

    // Expense patterns (negative amounts)
    if (amount < 0 || amount === 0) {
      // Cash & ATM
      if (desc.includes('atm') || desc.includes('withdrawal') || desc.includes('cash')) {
        return 'cash_withdrawal';
      }

      // Transfers
      if (desc.includes('transfer') || desc.includes('send') || 
          desc.includes('gcash') || desc.includes('paymaya')) {
        return 'transfer_out';
      }

      // Shopping & Groceries
      if (desc.includes('grocery') || desc.includes('supermarket') || 
          desc.includes('market') || desc.includes('sm ') || desc.includes('puregold')) {
        return 'groceries';
      }

      // Dining
      if (desc.includes('restaurant') || desc.includes('food') || desc.includes('cafe') ||
          desc.includes('jollibee') || desc.includes('mcdo') || desc.includes('kfc') ||
          desc.includes('mang inasal') || desc.includes('pizza') || desc.includes('starbucks')) {
        return 'dining';
      }

      // Utilities
      if (desc.includes('meralco') || desc.includes('pldt') || desc.includes('converge') ||
          desc.includes('water') || desc.includes('electric') || desc.includes('internet') ||
          desc.includes('utility')) {
        return 'utilities';
      }

      // Transportation
      if (desc.includes('gas') || desc.includes('petron') || desc.includes('shell') ||
          desc.includes('caltex') || desc.includes('fuel') || desc.includes('grab') ||
          desc.includes('uber') || desc.includes('taxi')) {
        return 'transportation';
      }

      // Bills & Payments
      if (desc.includes('payment') || desc.includes('bill') || desc.includes('bp ')) {
        return 'bill_payment';
      }

      // Shopping
      if (desc.includes('mall') || desc.includes('store') || desc.includes('shop')) {
        return 'shopping';
      }

      // Healthcare
      if (desc.includes('hospital') || desc.includes('pharmacy') || 
          desc.includes('clinic') || desc.includes('medical')) {
        return 'healthcare';
      }
    }

    return 'uncategorized';
  }

  /**
   * Calculate confidence score for categorization
   */
  getCategorizationConfidence(description, category) {
    // If uncategorized, low confidence
    if (category === 'uncategorized') return 0.3;

    // Check for exact keyword matches
    const desc = description.toLowerCase();
    const categoryKeywords = {
      'income': ['salary', 'payroll', 'income'],
      'groceries': ['grocery', 'supermarket'],
      'dining': ['jollibee', 'mcdo', 'restaurant'],
      'utilities': ['meralco', 'pldt', 'water'],
      'transportation': ['petron', 'shell', 'grab'],
      'cash_withdrawal': ['atm withdrawal'],
      'bill_payment': ['payment', 'bill']
    };

    const keywords = categoryKeywords[category] || [];
    const exactMatch = keywords.some(kw => desc.includes(kw));

    return exactMatch ? 0.9 : 0.6;
  }

  /**
   * Generate AI-powered insights from the statement
   */
  generateInsights(statement) {
    const insights = [];
    const transactions = statement.transactions || [];

    if (transactions.length === 0) {
      return insights;
    }

    // Calculate spending by category
    const categorySpending = {};
    const categoryCount = {};
    let totalSpending = 0;
    let totalIncome = 0;

    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount) || 0;
      const category = this.categorizeTransaction(
        txn.description?.toUpperCase() || '', 
        amount
      );

      if (amount < 0) {
        totalSpending += Math.abs(amount);
        categorySpending[category] = (categorySpending[category] || 0) + Math.abs(amount);
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      } else if (amount > 0) {
        totalIncome += amount;
      }
    });

    // Insight 1: Highest spending category
    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      const [category, amount] = topCategory;
      const percentage = ((amount / totalSpending) * 100).toFixed(1);
      insights.push({
        type: 'spending_pattern',
        category: 'high',
        message: `Highest spending: ${category.replace('_', ' ')} (₱${amount.toFixed(2)}, ${percentage}% of total)`,
        amount: amount,
        percentage: parseFloat(percentage)
      });
    }

    // Insight 2: Income vs Expenses
    const netChange = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? ((netChange / totalIncome) * 100).toFixed(1) : 0;
    
    insights.push({
      type: 'financial_health',
      category: netChange > 0 ? 'positive' : 'negative',
      message: `Net change: ₱${netChange.toFixed(2)} (${savingsRate}% savings rate)`,
      net_change: netChange,
      savings_rate: parseFloat(savingsRate)
    });

    // Insight 3: Transaction frequency
    const mostFrequent = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostFrequent) {
      const [category, count] = mostFrequent;
      insights.push({
        type: 'behavior_pattern',
        category: 'frequency',
        message: `Most frequent: ${category.replace('_', ' ')} (${count} transactions)`,
        transaction_count: count
      });
    }

    // Insight 4: Unusual transactions (flag high amounts)
    const amounts = transactions.map(t => Math.abs(parseFloat(t.amount) || 0));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const unusualThreshold = avgAmount * 3;

    const unusualTransactions = transactions.filter(t => 
      Math.abs(parseFloat(t.amount) || 0) > unusualThreshold
    );

    if (unusualTransactions.length > 0) {
      insights.push({
        type: 'alert',
        category: 'unusual',
        message: `${unusualTransactions.length} unusual transaction(s) detected (above ₱${unusualThreshold.toFixed(2)})`,
        transactions: unusualTransactions.map(t => ({
          description: t.description,
          amount: t.amount,
          date: t.date
        }))
      });
    }

    return insights;
  }

  /**
   * Calculate overall confidence score for the statement analysis
   */
  calculateConfidence(statement) {
    const transactions = statement.transactions || [];
    if (transactions.length === 0) return 0;

    const confidenceScores = transactions.map(txn => {
      const category = this.categorizeTransaction(
        txn.description?.toUpperCase() || '',
        parseFloat(txn.amount) || 0
      );
      return this.getCategorizationConfidence(
        txn.description?.toUpperCase() || '',
        category
      );
    });

    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Compare parser output vs AI enhancement
   */
  async compareParserVsAI(parsedStatement) {
    const aiEnhanced = await this.analyzeStatement(parsedStatement);
    
    const comparison = {
      parser: {
        transaction_count: parsedStatement.transactions?.length || 0,
        categorized: parsedStatement.transactions?.filter(t => t.category)?.length || 0
      },
      ai: {
        transaction_count: aiEnhanced.transactions?.length || 0,
        categorized: aiEnhanced.transactions?.filter(t => t.ai_category !== 'uncategorized')?.length || 0,
        confidence: aiEnhanced.confidence_score
      },
      improvements: []
    };

    // Calculate improvement percentage
    const parserAccuracy = (comparison.parser.categorized / comparison.parser.transaction_count) * 100;
    const aiAccuracy = (comparison.ai.categorized / comparison.ai.transaction_count) * 100;
    const improvement = aiAccuracy - parserAccuracy;

    comparison.improvements.push({
      metric: 'categorization_accuracy',
      parser: `${parserAccuracy.toFixed(1)}%`,
      ai: `${aiAccuracy.toFixed(1)}%`,
      improvement: `+${improvement.toFixed(1)}%`
    });

    return comparison;
  }

  /**
   * Get training status and model info
   */
  async getModelStatus() {
    try {
      const artifacts = await this.loadModelArtifacts();
      return {
        status: 'ready',
        version: artifacts.version,
        training_samples: artifacts.training_samples,
        created_at: artifacts.created_at,
        learned_categories: artifacts.learned_categories?.length || 0
      };
    } catch (error) {
      return {
        status: 'not_trained',
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const boogasiAI = new BoogasiAiService();

// Export class for testing
export default BoogasiAiService;