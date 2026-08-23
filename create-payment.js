const { randomUUID } = require("crypto");

const PRICE_MAP = {
  "350 Bills — $20": 2000,
  "600 Bills — $35": 3500,
  "750 Bills — $50": 5000,
  "1,000 Bills — $85": 8500,
  "1.5K Bills — $100": 10000
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { sourceId, amount, package: packageName } = body;

    if (!sourceId || !packageName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing payment information" }) };
    }

    const baseAmount = PRICE_MAP[packageName];
    if (!baseAmount) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid package" }) };
    }

    // The browser sends a displayed amount, but the server validates it.
    const validAmounts = [baseAmount, Math.round(baseAmount * 0.90)];
    if (!validAmounts.includes(Number(amount))) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid order amount" }) };
    }

    const response = await fetch("https://connect.squareup.com/v2/payments", {
      method: "POST",
      headers: {
        "Square-Version": "2025-10-16",
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: randomUUID(),
        amount_money: {
          amount: Number(amount),
          currency: "USD"
        },
        location_id: process.env.SQUARE_LOCATION_ID,
        note: packageName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.errors?.[0]?.detail || "Square payment was declined" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ payment: data.payment })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unable to process payment" })
    };
  }
};