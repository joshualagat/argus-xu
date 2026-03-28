import { google } from 'googleapis';
import path from 'path';

function getSpreadsheetId() {
    let idOrUrl = process.env.SPREADSHEET_ID || '';
    if (idOrUrl.includes('/d/')) {
        return idOrUrl.split('/d/')[1].split('/')[0];
    }
    return idOrUrl;
}

const auth = new google.auth.GoogleAuth({
    // Vercel deployment support: Use stringified JSON env var first, otherwise fallback to local file
    ...(process.env.GOOGLE_CREDENTIALS
        ? { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS) }
        : { keyFile: path.resolve(process.cwd(), 'GOOGLE_APPLICATION_CREDENTIALS.json') }),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Ensures a tab matching the username exists. If not, it creates it with headers.
 */
export async function ensureUserTab(username) {
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = res.data.sheets.map(s => s.properties.title);

    if (!existingSheets.includes(username)) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ addSheet: { properties: { title: username } } }]
            }
        });

        const headers = ["Timestamp", "Symbol", "Side", "Quantity", "Avg Fill Price", "Account Balance", "Total P&L"];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${username}!A1:G1`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [headers] }
        });
        console.log(`Created new tab for user: ${username}`);
    }
}

/**
 * Filters the array of exact duplicate orders and appends the non-duplicates.
 */
export async function appendOrders(username, orderArray, discordTimestamp) {
    if (!orderArray || orderArray.length === 0) {
        return { success: false, reason: "No positions were extracted from the image." };
    }

    const spreadsheetId = getSpreadsheetId();
    const range = `${username}!A:G`;

    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    const newRows = [];

    for (const orderData of orderArray) {
        let isDuplicate = false;

        // 1. Check against Google Sheet legacy rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            const [, rowSymbol, rowSide, rowQty, rowPrice] = row;

            if (
                String(rowSymbol).trim() === String(orderData.symbol).trim() &&
                String(rowSide).trim() === String(orderData.side).trim() &&
                parseFloat(rowQty) === parseFloat(orderData.qty) &&
                parseFloat(rowPrice) === parseFloat(orderData.avgFillPrice)
            ) {
                isDuplicate = true;
                break;
            }
        }

        // 2. Check against rows we are staging to insert to avoid identical rows in the same batch
        for (const staged of newRows) {
            const [, rowSymbol, rowSide, rowQty, rowPrice] = staged;
            if (
                String(rowSymbol).trim() === String(orderData.symbol).trim() &&
                String(rowSide).trim() === String(orderData.side).trim() &&
                parseFloat(rowQty) === parseFloat(orderData.qty) &&
                parseFloat(rowPrice) === parseFloat(orderData.avgFillPrice)
            ) {
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            newRows.push([
                new Date(discordTimestamp).toISOString(),
                orderData.symbol,
                orderData.side,
                orderData.qty,
                orderData.avgFillPrice,
                orderData.accountBalance,
                orderData.totalPnL
            ]);
        }
    }

    if (newRows.length > 0) {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${username}!A:G`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: newRows }
        });
        return { success: true, count: newRows.length, ignored: orderArray.length - newRows.length };
    }

    return { success: false, reason: `Ignored all ${orderArray.length} position(s) because they were already in the Google Sheet.` };
}
