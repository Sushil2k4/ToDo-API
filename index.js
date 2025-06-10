const express = require("express");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, "todos.json");

// Middleware
app.use(express.json());
app.use(morgan("dev"));

// Initialize data file if missing
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

// Utility: Load todo
function loadTodos() {
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch (err) {
    return [];
  }
}

// Utility: Save todos
function saveTodos(todos) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(todos, null, 2));
}

// Utility: Find todo by ID
function findTodoById(id) {
  const todos = loadTodos();
  return todos.find((todo) => todo.id === id);
}

// GET all todos
app.get("/todos", (req, res) => {
  const todos = loadTodos();
  res.status(200).json({ count: todos.length, todos });
});

// GET specific todo
app.get("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const todo = findTodoById(id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });

  res.status(200).json(todo);
});

// POST new todo
app.post("/todos", (req, res) => {
  const { title, description, completed = false } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const todos = loadTodos();
  const newTodo = {
    id: Date.now(),
    title: title.trim(),
    description: description.trim(),
    completed: Boolean(completed),
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  todos.push(newTodo);
  saveTodos(todos);
  res.status(201).json({ message: "Todo created", todo: newTodo });
});

// PUT update todo
app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const todos = loadTodos();
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) return res.status(404).json({ error: "Todo not found" });

  const { title, description, completed } = req.body;
  if (!title && !description && completed === undefined) {
    return res.status(400).json({ error: "No valid fields provided to update" });
  }

  if (title !== undefined) todos[index].title = title.trim();
  if (description !== undefined) todos[index].description = description.trim();
  if (completed !== undefined) todos[index].completed = Boolean(completed);
  todos[index].updatedAt = new Date().toISOString();

  saveTodos(todos);
  res.status(200).json({ message: "Todo updated", todo: todos[index] });
});

// DELETE todo
app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const todos = loadTodos();
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) return res.status(404).json({ error: "Todo not found" });

  const [deleted] = todos.splice(index, 1);
  saveTodos(todos);
  res.status(200).json({ message: "Todo deleted", deletedTodo: deleted });
});

// 404 Fallback route
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
