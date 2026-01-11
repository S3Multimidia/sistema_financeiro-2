require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_padrao_s3m_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Retry logic for Swarm startup race conditions
const connectWithRetry = () => {
    console.log('⏳ Tentando conectar ao Banco de Dados...');
    pool.connect((err, client, release) => {
        if (err) {
            console.error('❌ Falha na conexão com BD. Retentando em 5 segundos...', err.message);
            setTimeout(connectWithRetry, 5000); // Retry after 5s
        } else {
            console.log('✅ Conectado ao Banco de Dados PostgreSQL');
            release();
            initDb(); // Only run migration after successful connection
        }
    });
};

// Init DB Schema (Simple Migration)
const initDb = async () => {
    try {
        // Users Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Transactions Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'appointment')),
        category VARCHAR(100),
        date DATE NOT NULL,
        year INTEGER,
        month INTEGER,
        day INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        installments_total INTEGER DEFAULT 1,
        installment_number INTEGER DEFAULT 1,
        original_id VARCHAR(100),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Check if admin exists, if not create
        const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'financeiro@s3m.com.br'");
        if (adminCheck.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('123456', salt);
            await pool.query(
                "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)",
                ['financeiro@s3m.com.br', hash, 'Admin S3M', 'admin']
            );
            console.log('👤 Usuário Admin criado: financeiro@s3m.com.br / 123456');
        }
    } catch (error) {
        console.error('Erro na migração do banco:', error);
    }
};

initDb();

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

        const user = result.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(401).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- TRANSACTIONS ROUTES ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        // For now returning all, later filter by user if needed
        const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        // Map DB formatting to Frontend expected format if needed, but names are matching mostly
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Bulk Migrate / Sync
app.post('/api/transactions/migrate', authenticateToken, async (req, res) => {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) return res.status(400).json({ error: 'Formato inválido' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Optional: Clear existing for this user or specific sync strategy?
        // For MVP migration: Insert ignore or Insert if not exists

        for (const t of transactions) {
            // Check existence logic or just insert
            await client.query(
                `INSERT INTO transactions 
                (description, amount, type, category, date, year, month, day, completed, installments_total, installment_number, user_id, original_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING`, // Assuming ID conflict handling is needed, but serial IDs might differ.
                // Better strategy: Use original_id to track client-side IDs
                [t.description, t.amount, t.type, t.category, t.date || `${t.year}-${t.month + 1}-${t.day}`, t.year, t.month, t.day, t.completed, t.totalInstallments, t.installmentNumber, req.user.id, t.id]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, count: transactions.length });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    const t = req.body;
    try {
        // Normally you extract fields to avoid SQL injection via columns, but using parameterized query
        const result = await pool.query(
            `INSERT INTO transactions 
      (description, amount, type, category, date, year, month, day, completed, installments_total, installment_number, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
            [t.description, t.amount, t.type, t.category, t.date, t.year, t.month, t.day, t.completed, t.totalInstallments, t.installmentNumber, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Delete Transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Dynamic query builder for updates could be better, but simple version:
    // For this MVP, we might need a better specific update query or comprehensive one.
    // Implementation pending for generic updates.
    res.json({ success: true, message: "Update not fully implemented in MVP yet" });
});

// --- PERFEX INTEGRATION PLACEHOLDER ---
app.get('/api/perfex/sync', authenticateToken, async (req, res) => {
    // Logic to fetch from Perfex API and sync local DB
    res.json({ message: "Perfex Sync Endpoint" });
});

// --- SERVE STATIC FRONTEND (PRODUCTION) ---
// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`⚡ Server running on port ${PORT}`);
});
