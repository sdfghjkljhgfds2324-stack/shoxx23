const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 🔑 Telegram bot token va chat ID
const TOKEN = '8815493850:AAGAi-b09btZNkfL50U-8e3L8weKmpP7nV8';
const CHAT_ID = '8614716816';
let lastUpdateId = 0;

// =====================
// SESSION-KEEPER QATLAMI
// =====================
let sessions = {};

// yangi sessiya berish
app.get('/session', (req, res) => {
  const sid = crypto.randomBytes(16).toString('hex');
  sessions[sid] = Date.now();
  res.json({ sid });
});

// brauzer “men tirikman” pingi
app.post('/ping', (req, res) => {
  const { sid } = req.body || {};
  if (sid) sessions[sid] = Date.now();
  res.send('ok');
});

// o‘lib qolgan sessiyalarni tozalash
setInterval(() => {
  for (const sid in sessions) {
    if (Date.now() - sessions[sid] > 15000) {
      delete sessions[sid];
      console.log('Sessiya o‘chdi:', sid);
    }
  }
}, 5000);

// =====================
// ASOSIY FUNKSIYALAR
// =====================

// HTML faylni Telegramga yuborish (faqat ruxsatli muhitlar uchun!)
app.post('/upload-html', async (req, res) => {
  const html = req.body.html;
  if (!html) return res.status(400).json({ success: false, error: 'Bo‘sh HTML' });

  const filePath = path.join(__dirname, 'page.html');
  fs.writeFileSync(filePath, html);

  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('document', fs.createReadStream(filePath), 'page.html');

  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendDocument`, form, { headers: form.getHeaders() });
    res.json({ success: true });
  } catch (err) {
    console.error('Telegramga yuborishda xatolik:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// So‘nggi Telegram xabarini olish
app.get('/latest', async (req, res) => {
  const since = parseInt(req.query.since || 0, 10);
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${since + 1}`);
    if (data.ok && data.result.length > 0) {
      const last = data.result[data.result.length - 1];
      lastUpdateId = last.update_id;
      return res.json({ success: true, message: last.message?.text || null, update_id: lastUpdateId });
    }
    res.json({ success: false });
  } catch (err) {
    console.error('Xabar olishda xatolik:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bookmarklet uchun minimal JS (to‘liq URL bilan)
app.get('/bm', (req, res) => {
  res.type('application/javascript');
  res.send(`
    (async()=>{
      let html=document.documentElement.outerHTML;
      await fetch("https://shoxx23-1.onrender.com/upload-html",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({html})
      });
      let r=await fetch("https://shoxx23-1.onrender.com/latest");
      let j=await r.json();
      alert(j.success ? j.message : "Xabar yo'q");
    })();
  `);
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT} da ishlayapti`));
