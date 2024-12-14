const axios = require('axios');
const router = require("express").Router();

// Function to get OAuth token from Pesapal
const getOAuthToken = async ({consumerKey, consumerSecret}) => {
  const tokenURL = 'https://pay.pesapal.com/v3/api/Auth/RequestToken';
  const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const { data } = await axios.post(tokenURL, {}, {
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
  });

  return data.token;
};

// Function to get access token from Pesapal
const getPesapalToken = async ({consumerKey, consumerSecret}) => {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const response = await axios({
    method: 'POST',
    url: 'https://pay.pesapal.com/v3/api/Auth/RequestToken',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });
  return response.data.token;
};


// Initialize payment
app.post('/', async (req, res) => {
  try {
    const token = await getOAuthToken();
    const paymentUrl = 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest';
    const { amount, description, firstName, lastName, email, phoneNumber } = req.body;
    const paymentData = {
      Amount: amount,
      Description: description,
      Type: 'MERCHANT',
      Reference: '123456789', // unique transaction ID
      PhoneNumber: phoneNumber,
      Email: email,
      FirstName: firstName,
      LastName: lastName,
      Currency: 'KES', // Or any other supported currency
      CallbackUrl: 'http://localhost:3000/payment-success', // Change to your success URL
    };

    const { data } = await axios.post(paymentUrl, paymentData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    res.json({ payment_url: data.redirect_url });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).send('Failed to initialize payment');
  }
});





// Function to initiate payment with Pesapal
const initiatePayment = async (token, paymentDetails) => {
  const response = await axios({
    method: 'POST',
    url: 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: paymentDetails,
  });
  return response.data.redirect_url; // URL to redirect user to Pesapal payment page
};


// Endpoint to handle payment request
router.post('/payment', async (req, res) => {
  const { amount, email, phoneNumber, paymentMethod, description, redirectMode, cancellationUrl } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ message: 'Either email or phone number is required in billing address.' });
  }

  const notificationId = 'order_' + new Date().getTime(); // Unique Notification ID
  const transactionId = `txn_${new Date().getTime()}`.slice(0, 50); // Unique Transaction ID, limited to 50 characters

  try {
    const token = await getPesapalToken();

    const paymentDetails = {
      id: transactionId,
      amount,
      currency: 'KES', // Modify if accepting other currencies
      description, // Limit description to 100 characters
      redirect_mode: redirectMode || 'TOP_WINDOW',
      callback_url: 'https://powerkingtips.com/tips', // Replace with your actual callback URL
      //cancellation_url: cancellationUrl || undefined, // Optional cancellation URL
      notification_id: notificationId,
      billing_address: {
        email_address: email || undefined,
        phone_number: phoneNumber || undefined,
        country_code: 'KE',
      },
      method: paymentMethod, // 'MPESA' or 'CARD'
    };

    const paymentUrl = await initiatePayment(token, paymentDetails);
    res.json({ paymentUrl });
  } catch (error) {
    const errorDetails = error.response?.data || error.message
    //res.status(500).json({ message: 'Payment initiation failed', details: errorDetails });
    res.status(500).json({ message: token})
  }
});

module.exports = router;