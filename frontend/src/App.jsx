import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState('');
  // Auto-detect category based on keywords in the note
  function guessCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('restaurant') || lower.includes('food')) {
      return 'Food';
    }
    if (lower.includes('uber') || lower.includes('ola') || lower.includes('petrol') || lower.includes('travel') || lower.includes('bus') || lower.includes('train')) {
      return 'Travel';
    }
    if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('shopping')) {
      return 'Shopping';
    }
    if (lower.includes('electricity') || lower.includes('rent') || lower.includes('bill') || lower.includes('recharge')) {
      return 'Bills';
    }
    return 'Other';
  }

  // Fetch all expenses when the app first loads
  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const res = await fetch(`${API_URL}/expenses`);
    const data = await res.json();
    setExpenses(data);
  }

  async function handleAddExpense(e) {
    e.preventDefault();

    if (!amount || !date) {
      alert('Please enter amount and date');
      return;
    }

    const newExpense = {
      amount: Number(amount),
      category,
      note,
      date
    };

    await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense)
    });

    // Reset the form
    setAmount('');
    setNote('');
    setCategory('Other');
    setDate('');

    // Refresh the list
    fetchExpenses();
  }

  async function handleDelete(id) {
    await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  // Group expenses by category for the pie chart
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map((cat) => ({
    name: cat,
    value: categoryTotals[cat]
  }));

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];
  // Compute a simple month-over-month insight
  function getInsight() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonthDate = new Date(thisYear, thisMonth - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const thisMonthTotals = {};
    const lastMonthTotals = {};

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        thisMonthTotals[exp.category] = (thisMonthTotals[exp.category] || 0) + exp.amount;
      }
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        lastMonthTotals[exp.category] = (lastMonthTotals[exp.category] || 0) + exp.amount;
      }
    });

    let biggestChange = null;

    Object.keys(thisMonthTotals).forEach((cat) => {
      const thisAmt = thisMonthTotals[cat];
      const lastAmt = lastMonthTotals[cat] || 0;

      if (lastAmt > 0) {
        const percentChange = ((thisAmt - lastAmt) / lastAmt) * 100;
        if (!biggestChange || Math.abs(percentChange) > Math.abs(biggestChange.percentChange)) {
          biggestChange = { category: cat, percentChange };
        }
      }
    });

    if (!biggestChange) {
      return "Not enough data yet to compare with last month. Keep adding expenses!";
    }

    const direction = biggestChange.percentChange > 0 ? 'up' : 'down';
    const percent = Math.abs(Math.round(biggestChange.percentChange));

    return `Your ${biggestChange.category} spending is ${direction} ${percent}% compared to last month.`;
  }

  return (
    <div className="app">
      <h1>💰 Expense Tracker</h1>

      <form onSubmit={handleAddExpense} className="expense-form">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Note (e.g. Swiggy order)"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setCategory(guessCategory(e.target.value));
          }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Food</option>
          <option>Travel</option>
          <option>Shopping</option>
          <option>Bills</option>
          <option>Other</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit">Add Expense</button>
      </form>

      <h2>Total Spent: ₹{total}</h2>
      {expenses.length > 0 && (
        <p className="insight">📊 {getInsight()}</p>
      )}
      {chartData.length > 0 && (
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <ul className="expense-list">
        {expenses.map((exp) => (
          <li key={exp.id}>
            <span className="category-tag">{exp.category}</span>
            <span>{exp.note}</span>
            <span>₹{exp.amount}</span>
            <span>{exp.date}</span>
            <button onClick={() => handleDelete(exp.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;