const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importe o pacote cors
const app = express();
const port = 3000;

// Middleware para permitir requisições de outras origens
app.use(cors());
// Middleware para processar JSON nas requisições
app.use(express.json());

const dbPath = path.join(__dirname, 'data', 'database.json');

const readDatabase = () => {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
};

const saveDatabase = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota para criar nova conta
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const db = readDatabase();
    if (db.users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Email já cadastrado.' });
    }
    const newUser = { id: Date.now(), name, email, password };
    db.users.push(newUser);
    saveDatabase(db);
    res.status(201).json({ message: 'Conta criada com sucesso!', user: newUser });
});

// Rota de login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDatabase();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        res.status(200).json({ message: 'Login bem-sucedido!', user });
    } else {
        res.status(401).json({ message: 'Credenciais inválidas.' });
    }
});

// --- ROTAS DE TAREFAS ---

// Rota para obter tarefas de um usuário
app.get('/api/tasks/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const db = readDatabase();
    const userTasks = db.tasks.filter(task => task.userId === userId);
    res.status(200).json(userTasks);
});

// Rota para criar nova tarefa
app.post('/api/tasks', (req, res) => {
    const { userId, title, description, dueDate } = req.body;
    const db = readDatabase();
    const newTask = {
        id: Date.now(),
        userId,
        title,
        description,
        dueDate,
        completed: false
    };
    db.tasks.push(newTask);
    saveDatabase(db);
    res.status(201).json({ message: 'Tarefa criada com sucesso!', task: newTask });
});

// Rota para alterar uma tarefa
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const { title, description, dueDate, completed } = req.body;
    const db = readDatabase();
    const taskIndex = db.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Tarefa não encontrada.' });
    }
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], title, description, dueDate, completed };
    saveDatabase(db);
    res.status(200).json({ message: 'Tarefa atualizada com sucesso!', task: db.tasks[taskIndex] });
});

// Rota para remover uma tarefa
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const db = readDatabase();
    const initialLength = db.tasks.length;
    db.tasks = db.tasks.filter(task => task.id !== taskId);
    if (db.tasks.length === initialLength) {
        return res.status(404).json({ message: 'Tarefa não encontrada.' });
    }
    saveDatabase(db);
    res.status(200).json({ message: 'Tarefa removida com sucesso!' });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});