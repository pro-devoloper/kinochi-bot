const http = require('http');

// Render va Cron-job uchun soxta server
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const { Telegraf } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf('7337793362:AAGyAfMT1eYRuXrcyuQMfliYEnCbyze6Cv0');
const ADMIN_ID = 5298159692; 
const DB_FILE = './kinolar.json';

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));

function getDatabase() { return JSON.parse(fs.readFileSync(DB_FILE)); }
function saveDatabase(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// --- ADMIN QISMI ---
bot.on('video', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const fileId = ctx.message.video.file_id;
        const caption = ctx.message.caption; // Masalan: "101 / Sumerki / O'zbekcha"

        if (caption && caption.includes('/')) {
            const qismlar = caption.split('/'); // Satrni "/" belgisi orqali bo'lamiz
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
            ctx.reply("⚠️ *Xato format!*\n\nKinoni quyidagicha yuboring:\n`Kod / Nomi / Tili`\n\nMasalan: `101 / Sumerki / O'zbekcha`", { parse_mode: 'Markdown' });
        }
    }
});

// --- FOYDALANUVCHI QISMI ---
bot.on('text', async (ctx) => {
    const kod = ctx.message.text.trim();
    const db = getDatabase();
    const kino = db[kod];

    if (kino) {
        try {
            await ctx.replyWithVideo(kino.fileId, {
                caption: `🎬 *Nomi:* ${kino.nomi}\n🌐 *Tili:* ${kino.til}\n🆔 *Kodi:* ${kod}`,
                parse_mode: 'Markdown'
            });
        } catch (err) {
            ctx.reply("❌ Videoni yuborishda xatolik.");
        }
    } else if (ctx.from.id !== ADMIN_ID) {
        ctx.reply("😔 Bunday kodli kino topilmadi.");
    }
});

bot.launch().then(() => console.log("Bot yangilandi!"));

