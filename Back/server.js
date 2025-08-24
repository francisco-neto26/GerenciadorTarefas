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

/*const readDatabase = () => {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
};*/

const readDatabase = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler database:', error.message);
        throw error;
    }
};

const saveDatabase = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota para criar nova conta
app.post('/api/novo-usuario', (req, res) => {
    const { nome, email, senha } = req.body;
    const db = readDatabase();
    if (db.usuarios.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Email já cadastrado.' });
    }
    const novoUsuario = { id: Date.now(), nome, email, senha };
    db.usuarios.push(novoUsuario);
    saveDatabase(db);
    res.status(201).json({ message: 'Conta criada com sucesso!', usuario: novoUsuario });
});

// Rota de login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const db = readDatabase();
    const usuario = db.usuarios.find(u => u.email === email && u.senha === senha);
    if (usuario) {
        res.status(200).json({ message: 'Login bem-sucedido!', usuario });
    } else {
        res.status(401).json({ message: 'Credenciais inválidas.' });
    }
});

// --- ROTAS DE TAREFAS ---

app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!' });
});

// Rota para obter tarefas de um usuário
app.get('/api/tarefas/:usuarioId', (req, res) => {
    const usuarioId = parseInt(req.params.usuarioId);
    console.log(usuarioId);
    const db = readDatabase();
    const usuarioTarefas = db.tarefas.filter(tarefas => tarefas.usuarioId === usuarioId);
    res.status(200).json(usuarioTarefas);
});

// Rota para criar nova tarefa
app.post('/api/tarefas', (req, res) => {
    const { usuarioId, titulo, descricao, dataVencimento } = req.body;
    const db = readDatabase();
    const novaTarefa = {
        id: Date.now(),
        usuarioId,
        titulo,
        descricao,
        dataVencimento,
        finalizada: false
    };
    db.tarefas.push(novaTarefa);
    saveDatabase(db);
    res.status(201).json({ message: 'Tarefa criada com sucesso!', tarefas: novaTarefa });
});

// Rota para alterar uma tarefa
app.put('/api/tarefas/:id', (req, res) => {
    const tarefasId = parseInt(req.params.id);
    const { titulo, descricao, dataVencimento, finalizada } = req.body;
    const db = readDatabase();
    const tarefasIndex = db.tarefas.findIndex(tarefas => tarefas.id === tarefasId);
    if (tarefasIndex === -1) {
        return res.status(404).json({ message: 'Tarefa não encontrada.' });
    }
    db.tarefas[tarefasIndex] = { ...db.tarefas[tarefasIndex], titulo, descricao, dataVencimento, finalizada };
    saveDatabase(db);
    res.status(200).json({ message: 'Tarefa atualizada com sucesso!', Tarefa: db.tarefas[tarefasIndex] });
});

// Rota para remover uma tarefa
app.delete('/api/tarefas/:id', (req, res) => {
    const tarefasId = parseInt(req.params.id);
    const db = readDatabase();
    const contadorTarefas = db.tarefas.length;
    db.tarefas = db.tarefas.filter(tarefas => tarefas.id !== tarefasId);
    if (db.tarefas.length === contadorTarefas) {
        return res.status(404).json({ message: 'Tarefa não encontrada.' });
    }
    saveDatabase(db);
    res.status(200).json({ message: 'Tarefa removida com sucesso!' });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});