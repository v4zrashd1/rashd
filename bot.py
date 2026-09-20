from telebot import TeleBot
import requests

BOT_TOKEN="8810855428:AAG1-lwvdqG9zcfBwk6KGVa_AwVSewhAYaY"
bot = TeleBot(BOT_TOKEN)

def get_song(query):
    url = f"https://api.piped.private.coffee/search?q={query}"
    try:
        data = requests.get(url).json()
        for item in data.get("items", []):
            if item.get("type") == "stream":
                aud = item.get("streamInfo", {}).get("audio", [])
                if aud: return aud[0].get("url")
    except Exception as e: print(f"Error: {e}")
    return None

@bot.message_handler(commands=['start'])
def start(m):
    bot.reply_to(m, "আমি বট। গানের নাম লিখো।")

@bot.message_handler(func=lambda m: m.text and not m.text.startswith('/'))
def song(m):
    bot.reply_to(m, "🎵 খুঁজছি...")
    url = get_song(m.text.strip())
    if url:
        try:
            bot.reply_to(m, "✅ পাইয়া গেছে! পঠানো হচ্ছে...")
            bot.send_audio(m.chat.id, url, title=m.text)
        except Exception as e: bot.reply_to(m, f"❌ Error: {e}")
    else: bot.reply_to(m, "❌ গান পাওয়া যায়নি।")

print("🤖 Bot running...")
bot.infinity_polling()
