/**
 * React Hook: useBoogasiAI
 * Location: src/hooks/useBoogasiAI.js
 * 
 * Easy integration of Boogasi AI into React components
 */

import { useState, useCallback } from 'react';

export const useBoogasiAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  /**
   * Analyze a bank statement with AI
   */
  const analyzeStatement = useCallback(async (parsedStatement) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedStatement,
          action: 'analyze'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get only insights from a statement
   */
  const getInsights = useCallback(async (parsedStatement) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedStatement,
          action: 'insights'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Insights generation failed');
      }

      return result.data.insights;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Compare parser vs AI performance
   */
  const compareParserVsAI = useCallback(async (parsedStatement) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedStatement,
          action: 'compare'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Comparison failed');
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Categorize transactions only
   */
  const categorizeTransactions = useCallback(async (parsedStatement) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedStatement,
          action: 'categorize'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Categorization failed');
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get AI model status
   */
  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/status');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Status check failed');
      }

      setAiStatus(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retrain the model
   */
  const retrainModel = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/train', {
        method: 'POST'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Training failed');
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    aiStatus,

    // Methods
    analyzeStatement,
    getInsights,
    compareParserVsAI,
    categorizeTransactions,
    checkStatus,
    retrainModel
  };
};

// Example usage in a component:
/*

import { useBoogasiAI } from '@/hooks/useBoogasiAI';

function BankStatementAnalyzer() {
  const { analyzeStatement, getInsights, loading, error } = useBoogasiAI();
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async (parsedStatement) => {
    try {
      const result = await analyzeStatement(parsedStatement);
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleGetInsights = async (parsedStatement) => {
    try {
      const insights = await getInsights(parsedStatement);
      console.log('AI Insights:', insights);
    } catch (err) {
      console.error('Insights failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>AI is analyzing...</p>}
      {error && <p>Error: {error}</p>}
      {analysis && (
        <div>
          <h3>AI Analysis Complete</h3>
          <p>Confidence: {analysis.confidence_score * 100}%</p>
          <p>Transactions: {analysis.transactions.length}</p>
        </div>
      )}
    </div>
  );
}

*/