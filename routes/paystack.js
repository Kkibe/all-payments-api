const axios = require('axios');
const router = require('express').Router();

// Initialize a payment
router.post('/initialize', async (req, res) => {
    const { email, amount} = req.body;
    if (!email || !amount) {
        return res.status(400).json({ message: 'Email and amount are required' });
    }

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: email,
                amount: amount * 100, // Convert to kobo (or cents) for Paystack
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { authorization_url, reference } = response.data.data;
        return res.status(200).json({ authorization_url, reference });
    } catch (error) {
        return res.status(500).json({ message: 'Payment initialization failed' });
    }
});

// Verify a payment
router.get('/verify/:reference', async (req, res) => {
    const { reference } = req.params;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const data = response.data.data;

        if (data.status === 'success') {
            return res.status(200).json({ message: 'Payment verified successfully', data });
        } else {
            return res.status(400).json({ message: 'Payment verification failed', data });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Payment verification failed' });
    }
});

module.exports = router;