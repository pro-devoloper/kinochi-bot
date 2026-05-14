const http = require('http');
const { Telegraf } = require('telegraf');
const fs = require('fs');

// --- 1. RENDER UCHUN SERVER ---
// Cron-job.org orqali botni "uyg'oq" saqlash uchun
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new Telegraf('7337793362:AAGyAfMT1eYRuXrcyuQMfliYEnCbyze6Cv0');
const ADMIN_ID = 5298159692; 
const DB_FILE = './kinolar.json';

// Bazani tekshirish
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));

function getDatabase() { return JSON.parse(fs.readFileSync(DB_FILE)); }
function saveDatabase(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// --- 2. START BUYRUG'I ---
bot.start((ctx) => {
    ctx.reply("👋 Assalomu alaykum! Kino ko'rish uchun kino kodini kiriting.\n\nMasalan: 101");
});

// --- 3. ADMIN QISMI (VIDEO QABUL QILISH) ---
bot.on('video', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const fileId = ctx.message.video.file_id;
        const caption = ctx.message.caption; 

        if (caption && caption.includes('/')) {
            const qismlar = caption.split('/');
            const kod = qismlar[0].trim();
            const nomi = qismlar[1] ? qismlar[1].trim() : "Nomsiz";
            const til = qismlar[2] ? qismlar[2].trim() : "Noma'lum";

            if (!isNaN(kod)) {
                const db = getDatabase();
                db[kod] = { fileId, nomi, til };
                saveDatabase(db);
                ctx.reply(`✅ *Kino saqlandi!*\n\n🔢 Kod: ${kod}\n🎬 Nomi: ${nomi}\n🌐 Tili: ${til}`, { parse_mode: 'Markdown' });
            }
        } else {
            ctx.reply("⚠️ *Xato format!*\n\nKinoni quyidagicha yuboring:\n`Kod / Nomi / Tili`", { parse_mode: 'Markdown' });
        }
    }
});

// --- 4. FOYDALANUVCHI QISMI (KINO QIDIRISH) ---
bot.on('text', async (ctx) => {
    const kod = ctx.message.text.trim();
    
    // Agar foydalanuvchi buyruq yozsa (masalan /start), pastdagi kod ishlamasligi uchun
    if (kod.startsWith('/')) return;

    const db = getDatabase();
    const kino = db[kod];

    if (kino) {
        try {
            await ctx.replyWithVideo(kino.fileId, {
                caption: `🎬 *Nomi:* ${kino.nomi}\n🌐 *Tili:* ${kino.til}\n🆔 *Kodi:* ${kod}`,
                parse_mode: 'Markdown'
            });
        } catch (err) {
            ctx.reply("❌ Videoni yuborishda xatolik yuz berdi.");
            console.error(err);
        }
    } else {
        // Endi bot hamma uchun (admin uchun ham) "topilmadi" xabarini beradi
        ctx.reply("😔 Afsuski, bu kod bilan kino topilmadi. Qaytadan urinib ko'ring.");
    }
});

// Botni ishga tushirish
bot.launch().then(() => console.log("Bot Render rejimida ishga tushdi!"));

// Xavfsiz to'xtatish (Render uchun muhim)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
