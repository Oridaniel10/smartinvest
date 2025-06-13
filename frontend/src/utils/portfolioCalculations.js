import { getStockQuote } from '../services/stockService';

export const calculatePortfolioStats = async (rawData) => {
  try {
    const portfolio = rawData.portfolio || [];
    const transactions = rawData.transactions || [];

    // 1. Fetch live prices and enhance the portfolio
    const quotePromises = portfolio.map(stock => getStockQuote(stock.symbol));
    const quotes = await Promise.all(quotePromises);

    let total_portfolio_value = 0;
    let invested_amount = 0;

    const enhanced_portfolio = portfolio.map((stock, index) => {
      const livePrice = quotes[index]?.c || stock.avg_price;
      const currentValue = stock.quantity * livePrice;
      const totalInvested = stock.total_cost || 0;
      
      total_portfolio_value += currentValue;
      invested_amount += totalInvested;

      return {
        ...stock,
        current_price: livePrice,
        current_value: currentValue,
        total_invested: totalInvested,
        unrealized_pl: currentValue - totalInvested,
      };
    });

    // 2. Calculate P&L stats
    const net_contributions = transactions
      .filter(t => t.type === 'deposit' || t.type === 'liquidation')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const total_commissions = transactions
      .filter(t => t.type === 'buy' || t.type === 'sell')
      .reduce((sum, t) => sum + (t.commission || 0), 0);

    const total_equity = rawData.balance + total_portfolio_value;
    const total_pl = total_equity - net_contributions;
    const unrealized_pl = total_portfolio_value - invested_amount;
    const realized_pl = total_pl - unrealized_pl;

    let overall_pl_percentage = 0;
    if (net_contributions > 0) {
      overall_pl_percentage = (total_pl / net_contributions) * 100;
    }

    return {
      ...rawData,
      portfolio: enhanced_portfolio,
      invested_amount,
      total_portfolio_value,
      total_equity,
      realized_pl,
      unrealized_pl,
      total_commissions,
      net_contributions,
      overall_pl: total_pl,
      overall_pl_percentage: overall_pl_percentage
    };
  } catch (error) {
    console.error('Error calculating portfolio stats:', error);
    throw error;
  }
}; 