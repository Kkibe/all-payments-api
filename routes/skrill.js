const router = require('express').Router();
const crypto = require('crypto');


// Skrill Config
const SKRILL_PAY_TO_EMAIL = 'merchant@example.com';
const SKRILL_SECRET_WORD = 'YourSecretWord';
const SKRILL_MERCHANT_ID = 'YourMerchantID';
const SKRILL_URL = 'https://pay.skrill.com'; // Skrill payment gateway

// Endpoint to initiate payment
router.post('/initiate-payment', (req, res) => {
  const { amount, currency, customerEmail } = req.body;

  if (!amount || !currency || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transactionId = crypto.randomBytes(8).toString('hex'); // Unique transaction ID

  const params = {
    pay_to_email: SKRILL_PAY_TO_EMAIL,
    recipient_description: 'Your Business Name',
    transaction_id: transactionId,
    amount,
    currency,
    language: 'EN',
    return_url: 'https://yourwebsite.com/payment-success',
    cancel_url: 'https://yourwebsite.com/payment-cancel',
    status_url: 'https://yourwebsite.com/api/payment-status', // Notification handler
    customer_email: customerEmail,
  };

  // Generate a redirect URL
  const redirectUrl = `${SKRILL_URL}?${new URLSearchParams(params).toString()}`;

  res.json({ redirectUrl });
});

// Endpoint to handle payment status notifications
router.post('/api/payment-status', (req, res) => {
  const {
    transaction_id,
    mb_amount,
    mb_currency,
    status,
    md5sig,
    merchant_id,
  } = req.body;

  // Compute the MD5 signature for validation
  const computedMd5sig = crypto
    .createHash('md5')
    .update(
      `${merchant_id}${transaction_id}${mb_amount}${mb_currency}${SKRILL_SECRET_WORD}`
    )
    .digest('hex')
    .toUpperCase();

  // Validate the MD5 signature
  if (computedMd5sig !== md5sig) {
    return res.status(400).json({ error: 'Invalid notification signature' });
  }

  // Handle payment statuses
  switch (status) {
    case '2': // Payment Successful
      console.log(`Payment successful for transaction: ${transaction_id}`);
      // Update your database to mark the payment as successful
      break;
    case '-1': // Payment Cancelled
      console.log(`Payment cancelled for transaction: ${transaction_id}`);
      break;
    default:
      console.log(`Payment pending or failed for transaction: ${transaction_id}`);
      break;
  }

  res.status(200).send('Notification received');
});

module.exports = router;
