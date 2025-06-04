const express = require("express");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

const FILE_PATH = path.join(__dirname, "todos.json");

// Middleware
app.use(express.json());
app.use(morgan("dev")); // Logger for all HTTP requests

// Ensure the file exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, "[]");
}

// Utility functions
function loadTodos() {
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

function saveTodos(todos) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(todos, null, 2));
}

function findTodoById(id) {
  const todos = loadTodos();
  return todos.find(todo => todo.id === id);
}

// Routes

// GET /todos
app.get("/todos", (req, res) => {
  const todos = loadTodos();
  res.status(200).json({ count: todos.length, todos });
});

// GET /todos/:id
app.get("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todo = findTodoById(id);

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.status(200).json(todo);
});

// POST /todos
app.post("/todos", (req, res) => {
  const { title, description, completed = false } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const todos = loadTodos();
  const newTodo = {
    id: Date.now(),
    title,
    description,
    completed: Boolean(completed),
    createdAt: new Date().toISOString()
  };

  todos.push(newTodo);
  saveTodos(todos);

  res.status(201).json({ message: "Todo created", todo: newTodo });
});

// PUT /todos/:id
app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todos = loadTodos();
  const index = todos.findIndex(todo => todo.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }

  const updatedFields = req.body;
  todos[index] = {
    ...todos[index],
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  saveTodos(todos);
  res.status(200).json({ message: "Todo updated", todo: todos[index] });
});

// DELETE /todos/:id
app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todos = loadTodos();
  const index = todos.findIndex(todo => todo.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }

  const deleted = todos.splice(index, 1);
  saveTodos(todos);
  res.status(200).json({ message: "Todo deleted", deletedTodo: deleted[0] });
});

// Fallback route
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
