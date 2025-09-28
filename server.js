// server.js
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');

// Настройка: установите путь до serviceAccountKey.json или задайте GOOGLE_APPLICATION_CREDENTIALS
// const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  // если используете env переменную GOOGLE_APPLICATION_CREDENTIALS, admin использует её автоматически
  // иначе можно явно пробросить:
  // credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://<YOUR_DATABASE_NAME>.firebaseio.com'
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL // задайте в окружении
});

const db = admin.database();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // если нужен статичный фронтенд

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { userId, password, terminalId, amount } = req.body;
    if (!userId || !password || !terminalId || (typeof amount === 'undefined')) {
      return res.status(400).json({ success:false, error: 'Недостаточно параметров' });
    }

    // Ищем пользователя по полю userId (в структуре users/<uid>/userId)
    const usersRef = db.ref('users');
    const q = usersRef.orderByChild('userId').equalTo(userId);
    const snap = await q.get();

    if (!snap.exists()) {
      return res.status(404).json({ success:false, error: 'Пользователь не найден' });
    }
    const childSnap = Object.values(snap.val())[0]; // берем первый совпадающий объект
    // Но нам нужен ключ (uid)
    const firstKey = Object.keys(snap.val())[0];
    const storedPassword = childSnap.password; // предполагаем, что поле называется password
    if (typeof storedPassword === 'undefined') {
      return res.status(400).json({ success:false, error: 'У пользователя нет поля password (нужен для примера)' });
    }
    if (storedPassword !== password) {
      return res.status(401).json({ success:false, error: 'Неверный пароль' });
    }

    // Записываем в terminals/<terminalId>
    const termRef = db.ref(`terminals/${terminalId}`);
    const payload = {
      mobile: "on",
      username: userId,
      amount: Number(amount),
      ts: Date.now()
    };

    await termRef.update(payload);
    return res.json({ success:true });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success:false, error: err.message || 'server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on', PORT));
