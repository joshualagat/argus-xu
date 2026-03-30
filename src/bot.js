import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { extractFinancialData } from './geminiManager.js';
import { ensureUserTab, appendOrders, syncGlobalLeaderboard } from './sheetsManager.js';

// Initialize full local Desktop Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, c => {
    console.log(`\n========================================`);
    console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log(`Bot is now monitoring for screenshots locally.`);
    console.log(`========================================\n`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    // Trigger if message contains an image
    if (message.attachments.size > 0) {
        const imageAttachment = message.attachments.find(att => att.contentType && att.contentType.startsWith('image/'));
        
        if (imageAttachment) {
            try {
                // Acknowledge the user instantly locally
                await message.react('👀');

                const response = await fetch(imageAttachment.url);
                const arrayBuffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                let reportText = "";

                // Gemini extracts the full JSON
                const parsedData = await extractFinancialData(imageBuffer, imageAttachment.contentType);
                const orders = parsedData?.orders || [];
                const username = parsedData?.tradingViewUsername;

                if (!username) {
                    await message.reply("⚠️ Could not detect a strict TradingView Username in the image. Please make sure it's clearly visible near 'paper trading'.");
                    return;
                }
                
                if (orders.length === 0) {
                    await message.reply("No recognizable position data could be parsed from the image.");
                    return;
                }

                reportText += `Analyzed ${orders.length} potential position(s) in screenshot.\n`;

                try {
                    // Check Sheets Metadata and push non-duplicate arrays locally
                    await ensureUserTab(username);
                    const timestampMs = message.createdTimestamp;
                    const result = await appendOrders(username, orders, timestampMs);
                    
                    // The Ultimate Refresh - Sweep all tabs and securely update the Global Leaderboard API
                    await syncGlobalLeaderboard();

                    if (result.success) {
                        reportText += `\n✅ **Success**: ${result.count} new trades securely synced!`;
                        if (result.ignored > 0) {
                             reportText += `\n*Ignored ${result.ignored} duplicate(s) successfully.*`;
                        }
                    } else {
                        reportText += `⚠️ **Rejected**: ${result.reason}`;
                    }
                    
                    await message.reply(reportText);
                } catch (sheetsError) {
                    console.error('Google Sheets Error:', sheetsError);
                    await message.reply('❌ Failed to update Google Sheets. Please verify the credentials and spreadsheet access.');
                }

            } catch (error) {
                console.error('Error processing image:', error);
                await message.reply('❌ An error occurred during image parsing with Google Gemini API.');
            }
        }
    }
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.warn("\n=== WARNING ===");
    console.warn("DISCORD_BOT_TOKEN is not defined in your environment.");
    console.warn("Please add DISCORD_BOT_TOKEN=<your token> to your .env file.");
    console.warn("===============\n");
} else {
    // Initiate persistent WebSocket connection
    client.login(token);
}
