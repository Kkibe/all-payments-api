const router = require("express").Router();
const stripeLib = require('stripe');

router.post("/", async (req, res) => {
  const {amount, currency, tokenId, stripeKey} = req.body;
  try {
    const stripe = stripeLib(stripeKey);
    stripe.charges.create(
        {
            source: tokenId,
            amount: amount,
            currency,
        },
        (stripeErr, stripeRes) => {
            if (stripeErr) {
                return res.status(500).json(stripeErr);
            } else {
                return res.status(200).json(stripeRes);
            }
        }
    );
  } catch (error) {
    return res.status(500).json(error);
  }
})


router.post('/v2', async (req, res) => {
  const { amount, stripeSecretKey } = req.body;
  const stripe = stripeLib('stripe')(stripeSecretKey);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;