import { verifyKey, InteractionResponseType, InteractionType } from 'discord-interactions';
import { extractFinancialData } from '../../../geminiManager.js';
import { ensureUserTab, appendOrders } from '../../../sheetsManager.js';

export async function POST(req) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

    // Verify cryptographic signature from Discord
    if (!signature || !timestamp || !verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY)) {
        return new Response('Invalid request signature', { status: 401 });
    }

    const command = JSON.parse(rawBody);

    // 1. Acknowledge server Ping checks from Discord
    if (command.type === InteractionType.PING) {
        return Response.json({ type: InteractionResponseType.PONG });
    }

    // 2. Handle /submit Command
    if (command.type === InteractionType.APPLICATION_COMMAND && command.data.name === 'submit') {

        // Define the background processing 
        const processBackground = async () => {
            const token = command.token;
            const appId = command.application_id;
            const username = command.member?.user?.username || command.user?.username || 'UnknownTrader';
            const timestampMs = Date.now();
            let reportText = "";

            // Helper to PATCH original deferred response
            const sendFollowup = async (contentStr) => {
                await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: contentStr })
                });
            };

            try {
                // Find image attachment in the interaction payload
                const attachments = command.data.resolved?.attachments;
                if (!attachments || Object.keys(attachments).length === 0) {
                    await sendFollowup("⚠️ Error: You must attach a screenshot containing financial data to use this command.");
                    return;
                }

                const attachmentKey = Object.keys(attachments)[0];
                const imageFile = attachments[attachmentKey];

                if (!imageFile.content_type || !imageFile.content_type.startsWith('image/')) {
                    await sendFollowup("⚠️ The provided file is not a valid image format.");
                    return;
                }

                // Download Image buffer securely
                const res = await fetch(imageFile.url);
                const arrayBuffer = await res.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                // Pass to our custom Gemini Extractor manager
                const orders = await extractFinancialData(imageBuffer, imageFile.content_type);

                if (!orders || orders.length === 0) {
                    await sendFollowup("No recognizable position data could be parsed from the image.");
                    return;
                }

                reportText += `Analyzed ${orders.length} potential position(s) in screenshot.\n`;

                // Sheets array synchronization hookups
                await ensureUserTab(username);
                const sheetsResult = await appendOrders(username, orders, timestampMs);

                // Dynamic Reporting Responses
                if (sheetsResult.success) {
                    reportText += `✅ **Success**: ${sheetsResult.count} new trades securely synced!`;
                    if (sheetsResult.ignored > 0) {
                        reportText += `\n*Ignored ${sheetsResult.ignored} duplicate(s) successfully.*`;
                    }
                } else {
                    reportText += `⚠️ **Rejected**: ${sheetsResult.reason}`;
                }

                // Push final update edit to the Discord Webhook callback
                await sendFollowup(reportText);

            } catch (err) {
                console.error("Bot Processing Error:", err);
                await sendFollowup("❌ An internal error occurred while processing your request to Gemini/Google APIs.");
            }
        };

        // Fire and forget background promise.
        // We do not 'await' this right here so Vercel can return the DEFERRED_CHANNEL_MESSAGE ping to Discord 
        // to beat the 3-second application limit.
        processBackground().catch(console.error);

        // Immediately respond to Discord with user-facing 'Bot is thinking...'
        return Response.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    }

    return new Response('Unknown command executed', { status: 400 });
}
