import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function extractFinancialData(imageBuffer, mimeType = 'image/png') {
    const prompt = `
You are an expert financial data extraction assistant analyzing a screenshot of a TradingView (or similar) interface.
Your most important goal is to extract the **TradingView Username** visible in the screenshot (usually beside the "paper trading" indicator or profile icon at the top of the interface).

Additionally, extract ALL visible positions currently active or recorded in the main list.
Simultaneously, locate the overall Account Balance and the summary level Total P&L (Unrealized or Realized) on the screen.

Output a strictly valid JSON document containing the following structure:
{
  "tradingViewUsername": "(string) The exact username found in the screenshot near 'paper trading'",
  "orders": [
    {
      "symbol": "(string) Details of the traded symbol (e.g., 'BITSTAMP:BTCUSD')",
      "side": "(string) Direction of trade: 'Long', 'Short', 'Buy', or 'Sell'",
      "qty": (number) The quantity or size of the position,
      "avgFillPrice": (number) The recorded average fill price, stripping out commas,
      "equity": (number) The total Account Equity (including Unrealized P&L). Look EXPLICITLY for "Equity", stripping commas,
      "totalPnL": (number) The summarized total PNL, stripping commas
    }
  ]
}

Even if only one position is found, wrap it in the \`orders\` array. If no positions are found, return an empty array for \`orders\`. Remember to apply the \`equity\` and \`totalPnL\` to every object in the \`orders\` array if found globally!

**Strict Output Constraint:** Do absolutely not include Markdown wrappers (e.g. \`\`\`json). Output raw parseable JSON only.
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const response = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: imageBuffer.toString('base64'),
                                mimeType: mimeType
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        let textOutput = response.response.text();
        // Fallback for json blocks if the model wrapped it
        textOutput = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(textOutput);
        
        // Return the full JSON containing { tradingViewUsername, orders }
        return parsed;
    } catch (error) {
        console.error('Error extracting data using Gemini:', error);
        throw new Error('Failed to extract financial data from the image.');
    }
}
