const axios = require('axios');
const router = require("express").Router();

function generateOrderIdWithDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // Combine the date and time parts
    const datePart = `${year}${month}${day}${hours}${minutes}${seconds}`;
    // Optional: Add a random suffix to ensure uniqueness
    const uniqueSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${datePart}${uniqueSuffix}`;
}

router.post("/", async (req, res) => {
  const {amount, countryCode, currency, description, url, callbackUrl, consumerKey, consumerSecret} = req.body;
  try {
    const { data } = await axios.post("https://pay.pesapal.com/v3/api/Auth/RequestToken",
        {
            consumer_key: consumerKey,
            consumer_secret: consumerSecret
        },
        {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        }
    );

    const ipn = await axios.post(
        "https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN",
        {
            url,
            ipn_notification_type: "GET"
        },
        {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer` + " " + data.token,
            }
        }
    );


    const response = await axios.post(
        "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest",
        {
            "id": generateOrderIdWithDate(),
            "currency": currency,
            "amount": amount,
            "description": description,
            "callback_url": callbackUrl,
            "notification_id": ipn.data.ipn_id,
            "billing_address": {
                "country_code": countryCode,
            }
        },
        {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer` + " " + data.token,
            }
        }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).send(error);
  }
})


/*router.get("/status/:orderTrackingId", async (req, res) => {
    const { orderTrackingId } = req.params; // Order tracking ID you get from Pesapal's SubmitOrderRequest
    const { consumerKey, consumerSecret } = req.body; // Provide consumer credentials in request body
    */
router.post("/status", async (req, res) => {
    const {orderTrackingId, consumerKey, consumerSecret} = req.body;
    try {
        // Step 1: Get the Bearer Token
        const { data } = await axios.post(
            "https://pay.pesapal.com/v3/api/Auth/RequestToken",
            {
                consumer_key: consumerKey,
                consumer_secret: consumerSecret
            },
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            }
        );

        // Step 2: Check Transaction Status
        const response = await axios.get(
            `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
            {
                headers: {
                    "Accept": "application/json",
                    Authorization: `Bearer ${data.token}`,
                }
            }
        );

        // Return the status to the client
        return res.status(200).json(response.data);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: "Failed to fetch transaction status." });
    }
});
module.exports = router;
