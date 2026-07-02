const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const verifyToken = require('./middleware/verifyToken');
const requireAdmin = require('./middleware/requireAdmin');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'STUDENT' } = req.body;

    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, role]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1 AND refresh_token = $2',
      [decoded.userId, refreshToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid or revoked refresh token' });
    }

    const user = userResult.rows[0];
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Token expired or invalid' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await db.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [refreshToken]);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/tickets', verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const newTicket = await db.query(
      'INSERT INTO tickets (student_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, title, description]
    );
    res.status(201).json(newTicket.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/tickets', verifyToken, async (req, res) => {
  try {
    const tickets = await db.query(
      'SELECT * FROM tickets WHERE student_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(tickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/tickets', verifyToken, requireAdmin, async (req, res) => {
  try {
    const allTickets = await db.query('SELECT * FROM tickets ORDER BY created_at DESC');
    res.json(allTickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/tickets/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedTicket = await db.query(
      'UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (updatedTicket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(updatedTicket.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));