// server.js
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');

// Инициализация Firebase Admin:
// Задайте GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
// и FIREBASE_DATABASE_URL=https://your-db.firebaseio.com
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
const db = admin.database();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // если положите index.html в public/

// POST /auth { username, password } -> { success, userId }
app.post('/auth', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success:false, error:'Не указан username или password' });

    const usersRef = db.ref('users');
    const snap = await usersRef.orderByChild('username').equalTo(username).get();
    if (!snap.exists()) return res.status(404).json({ success:false, error:'Пользователь не найден' });

    // берем первый совпадающий
    const val = snap.val();
    const firstKey = Object.keys(val)[0];
    const userObj = val[firstKey];

    // ожидаем поле password в базе (для примера)
    const storedPassword = userObj.password;
    if (typeof storedPassword === 'undefined') return res.status(400).json({ success:false, error:'У пользователя нет пароля на сервере' });

    if (storedPassword !== password) return res.status(401).json({ success:false, error:'Неверный пароль' });

    const userId = userObj.userId || firstKey; // если у вас есть поле userId, берём его, иначе — ключ
    return res.json({ success:true, userId });
  } catch (err) {
    console.error('Auth error', err);
    return res.status(500).json({ success:false, error: err.message || 'server error' });
  }
});

// POST /confirm { terminalId, userId, username, amount } -> writes into terminals/<terminalId>
app.post('/confirm', async (req, res) => {
  try {
    const { terminalId, userId, username, amount } = req.body;
    if (!terminalId || !userId || !username || (typeof amount === 'undefined')) {
      return res.status(400).json({ success:false, error:'Недостаточно параметров' });
    }
    const termRef = db.ref(`terminals/${terminalId}`);
    const payload = { mobile: 'on', username, userId, amount: Number(amount), ts: Date.now() };
    await termRef.update(payload);
    return res.json({ success:true });
  } catch (err) {
    console.error('Confirm error', err);
    return res.status(500).json({ success:false, error: err.message || 'server error' });
  }
});

// (опция) GET /health
app.get('/health', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server listening on', PORT));
