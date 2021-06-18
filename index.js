// include env
require("dotenv").config();

// include express
const express = require("express");
// start express
const app = express();

// include body parser
const bodyParser = require("body-parser");
// use json when using the body parser
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// this will allow us to easily concatanate paths
const path = require("path");
// this will allow us to inspect json objects
const util = require("util");

const plaid = require("plaid");
const plaidClient = new plaid.Client({
  clientID: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: plaid.environments.sandbox,
});

// create route -- when page loads, we will call this page to create link token
// create link token and send it to front end
app.get("/create-link-token", async (req, res) => {
  const { link_token: linkToken } = await plaidClient.createLinkToken({
    user: {
      client_user_id: "unique-id",
    },
    client_name: "summer knights",
    products: ["auth", "identity", "transactions"],
    country_codes: ["US"],
    language: "en",
  });
  // pass the created link token back to the front end
  res.json({ linkToken });
});

// create route after user goes to plaid link, exchanges public token for access token,
app.post("/token-exchange", async (req, res) => {
  // getting the token from the request body from front end
  const { publicToken } = req.body;
  const { access_token: accessToken } = await plaidClient.exchangePublicToken(
    publicToken
  );
  // call api endpoints
  //   // auth endpoint
  //   const authResponse = await plaidClient.getAuth(accessToken);
  //   console.log("-------");
  //   console.log("Auth response: ");
  //   console.log(util.inspect(authResponse, false, null, true));
  //   // identity endpoint
  //   const identityResponse = await plaidClient.getIdentity(accessToken);
  //   console.log("------");
  //   console.log("Identity response: ");
  //   console.log(util.inspect(identityResponse, false, null, true));
  //   // balance endpoint
  //   const balanceResponse = await plaidClient.getBalance(accessToken);
  //   console.log("------");
  //   console.log("Balance response: ");
  //   console.log(util.inspect(balanceResponse, false, null, true));
  // transaction endpoint
  const transactionResponse = await plaidClient.getTransactions(
    accessToken,
    "2018-01-01",
    "2020-02-01",
    {}
  );
  console.log("------");
  //   console.log("Transaction response: ");
  console.log("Summer Knights Finance App");
  console.log("Transactions: ");
  var transaction_type = "other";
  for (var i = 0; i < transactionResponse.transactions.length; i++) {
    const account_id = transactionResponse.transactions[i].account_id;
    for (var j = 0; j < transactionResponse.accounts.length; j++) {
      if (transactionResponse.accounts[j].account_id === account_id) {
        transaction_type = transactionResponse.accounts[j].subtype;
      }
    }
    console.log("Transaction " + i + ":");
    console.log("Category: " + transactionResponse.transactions[i].category[0]);
    console.log("Amount: $" + transactionResponse.transactions[i].amount);
    console.log("Date: " + transactionResponse.transactions[i].date);
    console.log(
      "Description: " +
        transactionResponse.transactions[i].merchant_name +
        " - " +
        transactionResponse.transactions[i].category[1] +
        " - " +
        transactionResponse.transactions[i].category[2]
    );
    console.log("Type: " + transaction_type);
    console.log("------");
    // console.log(transactionResponse.transactions[i].category[0]);
  }
  //   console.log(transactionResponse.transactions[0].category[0]);
  //   console.log(util.inspect(transactionResponse, false, null, true));
  // tell front status is good
  res.sendStatus(200);
});
// create route that will send the index.html and serve it
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("listening on port: ", PORT);
});
