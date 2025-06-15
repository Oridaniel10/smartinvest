import os
import requests
from typing import List, Dict

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

def format_currency(value):
    return f"${value:,.2f}"

def get_stock_quote(symbol: str) -> Dict:
    """Fetches a stock quote from Finnhub."""
    try:
        r = requests.get(f"{FINNHUB_BASE_URL}/quote", params={"symbol": symbol, "token": FINNHUB_API_KEY})
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching quote for {symbol}: {e}")
        return {} # Return empty dict on failure

def calculate_portfolio_stats(raw_data: Dict) -> Dict:
    """
    Calculates live portfolio statistics based on raw user data.
    This function is a Python port of the frontend's calculatePortfolioStats.
    """
    portfolio = raw_data.get("portfolio", [])
    transactions = raw_data.get("transactions", [])
    
    total_portfolio_value = 0
    invested_amount = 0
    
    enhanced_portfolio = []
    for stock in portfolio:
        quote = get_stock_quote(stock.get("symbol"))
        live_price = quote.get("c", stock.get("avg_price", 0))
        current_value = stock.get("quantity", 0) * live_price
        total_invested = stock.get("total_cost", 0)
        
        total_portfolio_value += current_value
        invested_amount += total_invested
        
        enhanced_portfolio.append({
            **stock,
            "current_price": live_price,
            "current_value": current_value,
            "total_invested": total_invested,
            "unrealized_pl": current_value - total_invested,
        })

    net_contributions = sum(t.get("amount", 0) for t in transactions if t.get("type") in ["deposit", "liquidation"])
    total_commissions = sum(t.get("commission", 0) for t in transactions if t.get("type") in ["buy", "sell"])

    total_equity = raw_data.get("balance", 0) + total_portfolio_value
    total_pl = total_equity - net_contributions
    unrealized_pl = total_portfolio_value - invested_amount
    realized_pl = total_pl - unrealized_pl
    
    overall_pl_percentage = (total_pl / net_contributions) * 100 if net_contributions > 0 else 0

    return {
        **raw_data,
        "portfolio": enhanced_portfolio,
        "invested_amount": invested_amount,
        "total_portfolio_value": total_portfolio_value,
        "total_equity": total_equity,
        "realized_pl": realized_pl,
        "unrealized_pl": unrealized_pl,
        "total_commissions": total_commissions,
        "net_contributions": net_contributions,
        "overall_pl": total_pl,
        "overall_pl_percentage": overall_pl_percentage
    }


def generate_profile_as_text(profile_data: Dict) -> str:
    """
    Generates a text summary of the user's profile for AI context.
    This is a Python port of the frontend's generateProfileAsText.
    """
    if not profile_data:
        return ""

    summary = f"User Profile Summary for {profile_data.get('name', 'N/A')}:\n\n"

    # Financial Overview
    summary += "--- Financial Overview ---\n"
    summary += f"Total Equity: {format_currency(profile_data.get('total_equity', 0))}\n"
    summary += f"Portfolio Value: {format_currency(profile_data.get('total_portfolio_value', 0))}\n"
    summary += f"Cash Balance: {format_currency(profile_data.get('balance', 0))}\n"
    summary += f"Unrealized P/L: {format_currency(profile_data.get('unrealized_pl', 0))}\n"
    summary += f"Realized P/L: {format_currency(profile_data.get('realized_pl', 0))}\n"
    summary += f"Total Commissions Paid: {format_currency(profile_data.get('total_commissions', 0))}\n\n"
    
    # Holdings
    summary += "--- Current Holdings ---\n"
    portfolio = profile_data.get("portfolio", [])
    if portfolio:
        for stock in portfolio:
            summary += (f"{stock.get('symbol')}: {stock.get('quantity', 0):.2f} shares, "
                        f"Current Value: {format_currency(stock.get('current_value', 0))}, "
                        f"Unrealized P/L: {format_currency(stock.get('unrealized_pl', 0))}\n")
    else:
        summary += "No holdings in the portfolio.\n"
    summary += "\n"

    # Transaction History (last 5 for brevity)
    summary += "--- Full Transaction History ---\n"
    transactions = profile_data.get("transactions", [])
    if transactions:
        for t in transactions:
            summary += (f"{t.get('type', '').upper()} {t.get('symbol', '')}: "
                        f"{t.get('quantity', 0):.2f} shares at {format_currency(t.get('price', 0))}\n")
    else:
        summary += "No transaction history.\n"
    
    return summary 