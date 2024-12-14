const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors'); 
const bodyParser = require('body-parser');
//const path = require('path');
//const dotenv = require('dotenv');

//dotenv.config();
const app = express();

// Middleware for parsing requests
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true })); // For form-encoded data
app.use(bodyParser.json()); // For JSON data


// route handlers
const ipesaRouter = require("./routes/ipesa");
const korapayRouter = require("./routes/kora");
const mpesaRouter = require("./routes/mpesa");
const nowpaymentsRouter = require("./routes/nowpayments");
const paypalRouter = require("./routes/paypal");
const paystackRouter = require("./routes/paystack");
const pesapalRouter = require("./routes/pesapal");
const revenuecatRouter = require("./routes/revenuecat");
const skrillRouter = require("./routes/skrill");
const stripeRouter = require("./routes/stripe");

//routes with distinct paths
app.use("/api/ipesa", ipesaRouter);
app.use("/api/kora", korapayRouter);
app.use("/api/mpesa", mpesaRouter);
app.use("/api/nowpayments", nowpaymentsRouter);
app.use("/api/paypal", paypalRouter);
app.use("/api/paystack", paystackRouter);
app.use("/api/pesapal", pesapalRouter);
app.use("/api/revenuecat", revenuecatRouter);
app.use("/api/skrill", skrillRouter);
app.use("/api/stripe", stripeRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});