import 'dotenv/config';

const token = process.env.DISCORD_BOT_TOKEN;
const appId = process.env.DISCORD_APP_ID;

if (!token || !appId) {
    console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APP_ID in .env file.");
    process.exit(1);
}

const commandData = {
    name: 'submit',
    type: 1, // CHAT_INPUT
    description: 'Submit a screenshot for financial data extraction to Google Sheets',
    options: [
        {
            name: 'image',
            description: 'The TradingView or position screenshot to analyze',
            type: 11, // ATTACHMENT
            required: true
        }
    ]
};

async function registerCommand() {
    console.log(`Registering /submit command globally for App ID: ${appId}...`);
    
    // We must use Discord API v10
    const response = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commandData)
    });

    if (response.ok) {
        console.log("✅ Successfully registered the /submit command!");
        const data = await response.json();
        console.log(`Command ID: ${data.id}`);
    } else {
        const errorText = await response.text();
        console.error("❌ Failed to register command:", errorText);
    }
}

registerCommand();
