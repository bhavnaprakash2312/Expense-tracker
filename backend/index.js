const express = require('express');
const cors = require('cors');
const { JSONFilePreset } = require('lowdb/node');

async function main() {
  const app = express();
  const PORT = 3001;

  app.use(cors());
  app.use(express.json());

  // Set up our "database" - a simple JSON file to store expenses
  const defaultData = { expenses: [] };
  const db = await JSONFilePreset('db.json', defaultData);

  // Route 1: Get all expenses
  app.get('/expenses', async (req, res) => {
    await db.read();
    res.json(db.data.expenses);
  });

  // Route 2: Add a new expense
  app.post('/expenses', async (req, res) => {
    const { amount, category, note, date } = req.body;
    const newExpense = {
      id: Date.now(),
      amount,
      category,
      note,
      date
    };
    db.data.expenses.push(newExpense);
    await db.write();
    res.status(201).json(newExpense);
  });

  // Route 3: Delete an expense
  app.delete('/expenses/:id', async (req, res) => {
    const id = Number(req.params.id);
    db.data.expenses = db.data.expenses.filter(exp => exp.id !== id);
    await db.write();
    res.status(204).send();
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main();