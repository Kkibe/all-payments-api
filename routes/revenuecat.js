const axios = require('axios');
const router = require("express").Router()
//const req.headers.REVENUECAT_API_KEY = 'YOUR_REVENUECAT_PUBLIC_API_KEY';
const BASE_URL = 'https://api.revenuecat.com/v1';


router.post("/pay", async (req, res) => {
    const {price, currency, customerId, productId, apiKey} = req.body;
    try {
        const response = await axios.post(
            `${BASE_URL}/receipts`,
            {
                subscriber_id: customerId,
                product_id: productId,
                currency, // or your chosen currency
                price: price, // actual price
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );
        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

router.post("/create-customer", async (req, res) => {
    const {customerId, apiKey} = req.body;
    try {
        const response = await axios.post(
            `${BASE_URL}/subscribers/${customerId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating customer:', error);
        return null;
    }
})

router.post("/get-offerings", async (req, res) => {
    const {apiKey} = req.body;
    try {
        const response = await axios.get(`${BASE_URL}/offerings`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return res.status(200).json(response.data.offerings);
    } catch (error) {
        return res.status(500).json('Error fetching offerings:', error);
    }
})

module.exports = router;