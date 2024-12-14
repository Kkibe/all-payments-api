const router = require("express").Router();

const PAYPAL_API = 'https://api.paypal.com';
const PAYPAL_API_SANDBOX = 'https://api.sandbox.paypal.com';

// Helper function to get access token
async function getAccessToken({PAYPAL_CLIENT_ID, PAYPAL_SECRET}) {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data.access_token;
}

// Create a payment order
router.post('/create-order', async (req, res) => {
  const { amount, currency, clientId, clientSecret } = req.body; // Expecting amount and currency from the client

  try {
    const accessToken = await getAccessToken(clientId, clientSecret);

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency || 'USD',
              value: amount,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ id: response.data.id }); // Send the order ID back to the client
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// Capture payment
router.post('/capture-order', async (req, res) => {
  const { orderId, clientId, clientSecret } = req.body; // Expecting orderId from the client

  try {
    const accessToken = await getAccessToken(clientId, clientSecret);
    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.json({ status: 'success', data: response.data });
  } catch (error) {
    console.error('Error capturing order:', error.message);
    return res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
});

module.exports = router;