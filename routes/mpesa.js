const router = require("express").Router();
const Daraja = require("@saverious/daraja");

router.post("/", async(req, res) => {
    const {number, amount, shortCode, callbackUrl, consumerKey, consumerSecret, environment} = req.body;
    try{
        const daraja = new Daraja({
            consumer_key : consumerKey,
            consumer_secret : consumerSecret,
            environment
        });
        
        const response = await daraja.stkPush({
            sender_phone : number,
            payBillOrTillNumber : shortCode,
            amount : amount,
            callback_url : callbackUrl,
        });
        return res.status(200).json(response)
    }catch(error){
        return res.status(500).json(error.message);
    }
})


router.post("/v2", async(req, res) => {
    const {number, amount, shortCode, callbackUrl, consumerKey, consumerSecret, environment} = req.body;

    const getDarajaAccessToken = async () => {
        const response = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            method: "GET",
            headers: {
                "Authorization": "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
            }
        });
    
        const data = await response.json();
        return data.access_token;
    };

    if (number.startsWith("0")) {
        number = "254" + number.slice(1);
    } else if(number.startsWith('+')) {
        number = number.substring(1); // Start from index 1 to exclude +
    }

    try {
        // Step 1: Get the access token
        const accessToken = await getDarajaAccessToken();

        // Step 2: Prepare STK Push request
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
        const password = Buffer.from(`${process.env.DARAJA_SHORT_CODE}${process.env.DARAJA_PASSKEY}${timestamp}`).toString("base64");

        const stkPushData = {
            BusinessShortCode: process.env.DARAJA_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: number, // The phone number sending payment
            PartyB: shortCode,
            PhoneNumber: number, // The phone number to receive the STK Push
            CallBackURL: callbackUrl,
            AccountReference: "YOUR_REFERENCE", // A reference for the transaction
            TransactionDesc: "Payment for services"
        };

        // Step 3: Make the STK Push request
        const stkPushResponse = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(stkPushData)
        });

        const result = await stkPushResponse.json();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
})
module.exports = router;