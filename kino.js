const http = require('http');
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// --- 1. RENDER UCHUN SERVER ---
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new Telegraf('7337793362:AAGyAfMT1eYRuXrcyuQMfliYEnCbyze6Cv0');
const ADMIN_ID = 5298159692; 

// --- SOZLAMALAR ---
const TG_CHANNEL = '@darkcinema1'; // Telegram kanal username (@ bilan)
const INSTA_URL = 'https://www.instagram.com/darkecinema'; // Instagram profil linki
const DB_FILE = './kinolar.json';
const USERS_FILE = './users.json';

// Fayllarni tekshirish
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

function getDatabase() { return JSON.parse(fs.readFileSync(DB_FILE)); }
function saveDatabase(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
function getUsers() { return JSON.parse(fs.readFileSync(USERS_FILE)); }
function saveUsers(data) { fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2)); }

// --- OBUNANI TEKSHIRISH (Faqat Telegram uchun) ---
async function checkSubscription(ctx) {
    try {
        const member = await ctx.telegram.getChatMember(TG_CHANNEL, ctx.from.id);
        const allowed = ['creator', 'administrator', 'member'];
        return allowed.includes(member.status);
    } catch (error) {
        console.error("Kanal tekshirishda xato:", error);
        return false;
    }
}

// Reklama tugmalari
function getSubscriptionButtons() {
    return Markup.inlineKeyboard([
        [Markup.button.url('Telegram Kanalimiz 📢', `https://t.me/${TG_CHANNEL.replace('@', '')}`)],
        [Markup.button.url('Instagram Sahifamiz 📸', INSTA_URL)],
        [Markup.button.callback('✅ Tekshirish', 'check_sub')]
    ]);
}

// --- 2. START BUYRUG'I ---
bot.start(async (ctx) => {
    const users = getUsers();
    if (!users.includes(ctx.from.id)) {
        users.push(ctx.from.id);
        saveUsers(users);
    }

    const isSubscribed = await checkSubscription(ctx);
    if (isSubscribed) {
        ctx.reply("👋 Assalomu alaykum! Kino ko'rish uchun kino kodini kiriting ✍️.");
    } else {
        ctx.reply("❌ Botdan foydalanish uchun quyidagi sahifalarimizga a'zo bo'lishingiz kerak:", getSubscriptionButtons());
    }
});

// Tekshirish tugmasi bosilganda
bot.action('check_sub', async (ctx) => {
    const isSubscribed = await checkSubscription(ctx);
    if (isSubscribed) {
        await ctx.deleteMessage();
        ctx.reply("✅ Rahmat! Endi kino kodini yuborishingiz mumkin.");
    } else {
        await ctx.answerCbQuery("⚠️ Telegram kanalimizga hali a'zo emassiz!", { show_alert: true });
    }
});

// --- 3. ADMIN QISMI ---
bot.command('t1mple', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const users = getUsers();
        const kinolar = Object.keys(getDatabase()).length;
        ctx.replyWithHTML(`<b>📊 Statistika:</b>\n👤 Foydalanuvchilar: ${users.length}\n🎬 Kinolar: ${kinolar}`);
    }
});

bot.on('video', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const fileId = ctx.message.video.file_id;
        const caption = ctx.message.caption; 
        if (caption && caption.includes('/')) {
            const [kod, nomi, til] = caption.split('/').map(s => s.trim());
            const db = getDatabase();
            db[kod] = { fileId, nomi: nomi || "Nomsiz", til: til || "O'zbek" };
            saveDatabase(db);
            ctx.reply(`✅ Saqlandi: ${kod}`);
        }
    }
});

// --- 4. FOYDALANUVCHI QIDIRUVI ---
bot.on('text', async (ctx) => {
    const kod = ctx.message.text.trim();
    if (kod.startsWith('/')) return;

    const isSubscribed = await checkSubscription(ctx);
    if (!isSubscribed) {
        return ctx.reply("⚠️ Avval kanalga a'zo bo'ling:", getSubscriptionButtons());
    }

    const db = getDatabase();
    const kino = db[kod];

    if (kino) {
        await ctx.replyWithVideo(kino.fileId, {
            caption: `🎬 *Nomi:* ${kino.nomi}\n🌐 *Tili:* ${kino.til}\n🆔 *Kodi:* ${kod}`,
            parse_mode: 'Markdown'
        });
    } else {
        ctx.reply("😔 Bu kod bilan kino topilmadi.");
    }
});

bot.launch();
