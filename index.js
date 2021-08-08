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
app.use(express.urlencoded());
app.use(express.static(__dirname + "/"));

const PORT = process.env.PORT || 3000;
const exphbs = require("express-handlebars");
// setting up handlebars
// Set handlebars middleware
var hbs = exphbs.create({
  defaultLayout: "main",
  extname: ".hbs",
  helpers: {
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
  },
});
app.engine("hbs", hbs.engine);
app.set("view engine", ".hbs");

// init transactions
var transactionResponse = {};
var investmentResponse = {};
// init budget
var budget_desired = 0.0;
var budget_actual = 0.0;
var food_desired = 0.0;
var food_actual = 0.0;
var entertainment_desired = 0.0;
var entertainment_actual = 0.0;
var shopping_desired = 0.0;
var shopping_actual = 0.0;
var payments_desired = 0.0;
var payments_actual = 0.0;
var travel_desired = 0.0;
var travel_actual = 0.0;
var transportation_desired = 0.0;
var transportation_actual = 0.0;
var over_under = "Budget Balanced";
var over_under_by = 0.0;

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
    client_name: "Budget Tracker",
    products: ["auth", "identity", "transactions", "investments"],
    country_codes: ["US"],
    language: "en",
  });
  // res.render("budget_profile");
  // pass the created link token back to the front end
  res.json({ linkToken });
  // res.status(200).render("budget_profile");
});

// create route after user goes to plaid link, exchanges public token for access token,
app.post("/token-exchange", async (req, res) => {
  // res.render("budget_profile");
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
  //   // balance endpoint
  investmentResponse = await plaidClient.getInvestmentTransactions(
    accessToken,
    "2021-05-01",
    "2021-06-01",
    {}
  );
  // console.log("------");
  // console.log("Balance response: ");
  // console.log(util.inspect(balanceResponse, false, null, true));
  // transaction endpoint
  transactionResponse = await plaidClient.getTransactions(
    accessToken,
    "2021-05-01",
    "2021-06-01",
    {}
  );
  console.log("------");
  //   console.log("Transaction response: ");
  console.log("Finance App v2");
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
    if (transactionResponse.transactions[i].category[0].includes("Food")) {
      food_actual += transactionResponse.transactions[i].amount;
    } else if (
      transactionResponse.transactions[i].category[0].includes("Recreation")
    ) {
      entertainment_actual += transactionResponse.transactions[i].amount;
    } else if (
      transactionResponse.transactions[i].category[0].includes("Shop")
    ) {
      shopping_actual += transactionResponse.transactions[i].amount;
    } else if (
      transactionResponse.transactions[i].category[0].includes("Transfer") ||
      transactionResponse.transactions[i].category[0].includes("Payment")
    ) {
      payments_actual += transactionResponse.transactions[i].amount;
    } else if (
      transactionResponse.transactions[i].category[0].includes("Travel")
    ) {
      travel_actual += transactionResponse.transactions[i].amount;
    }
    console.log("Amount: $" + transactionResponse.transactions[i].amount);
    budget_actual = budget_actual + transactionResponse.transactions[i].amount;
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
    // res.status(200).redirect("home.hbs");
    // res.status(200).redirect("/home");
    // res.status(401).render("index", { message: "TEST" });
    // res.status(401).render("/", { message: "TEST" });
  }
  // for (int i = 0; i < investmentResponse.investment_transactions; i++) {
  // investmentResponse.securities
  // }
  console.log(investmentResponse);
  //   console.log(util.inspect(transactionResponse, false, null, true));
  // tell front status is good
  // res.sendStatus(200);
  // res.status(200).render("budget_profile");
});

app.post("/budget_profile", function (req, res) {
  budget_desired = req.body.desiredBalance
    ? req.body.desiredBalance
    : budget_desired;
  food_desired = req.body.desiredFood ? req.body.desiredFood : food_desired;
  entertainment_desired = req.body.desiredEntertainment
    ? req.body.desiredEntertainment
    : entertainment_desired;
  shopping_desired = req.body.desiredShopping
    ? req.body.desiredShopping
    : shopping_desired;
  travel_desired = req.body.desiredTravel
    ? req.body.desiredTravel
    : travel_desired;
  transportation_desired = req.body.desiredTransportation
    ? req.body.desiredTransportation
    : travel_desired;
  payments_desired = req.body.desiredPayments
    ? req.body.desiredPayments
    : payments_desired;

  budget_desired =
    +food_desired +
    +entertainment_desired +
    +shopping_desired +
    +travel_desired +
    +transportation_desired +
    +payments_desired;

  res.render("budget_profile", {
    style: "budget.css",
    desired_balance: formatter.format(budget_desired),
    actual_balance: formatter.format(budget_actual),
    desired_food: formatter.format(food_desired),
    actual_food: formatter.format(food_actual),
    desired_entertainment: formatter.format(entertainment_desired),
    actual_entertainment: formatter.format(entertainment_actual),
    desired_shopping: formatter.format(shopping_desired),
    actual_shopping: formatter.format(shopping_actual),
    desired_payments: formatter.format(payments_desired),
    actual_payments: formatter.format(payments_actual),
    desired_travel: formatter.format(travel_desired),
    actual_travel: formatter.format(travel_actual),
    desired_transportation: formatter.format(transportation_desired),
    actual_transportation: formatter.format(transportation_actual),
    over_or_under:
      budget_desired - budget_actual < 0
        ? "Over budget by: "
        : "Under budget by: ",
    over_or_under_amount:
      budget_desired - budget_actual < 0
        ? formatter.format(-1 * (budget_desired - budget_actual))
        : formatter.format(budget_desired - budget_actual),
  });
});

// create route that will send the index.html and serve it
app.get("/", (req, res) => {
  // res.sendFile(path.join(__dirname, "/home"));
  res.render("home");
  transactionResponse = {};
  investmentResponse = {};
  budget_desired = 0.0;
  budget_actual = 0.0;
  food_desired = 0.0;
  food_actual = 0.0;
  entertainment_desired = 0.0;
  entertainment_actual = 0.0;
  shopping_desired = 0.0;
  shopping_actual = 0.0;
  payments_desired = 0.0;
  payments_actual = 0.0;
  travel_desired = 0.0;
  travel_actual = 0.0;
  over_under = "Budget Balanced";
  over_under_by = 0.0;
  // res.status(200).redirect("budget_profile");
  // res.status(401).render("home", {
  //   message: "sowwy, your email or password is incorrect :(",
  // });
});
// Create our number formatter.
var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});
// compare budget
// over_under_by = budget_desired - budget_actual;
// if (over_under_by < 0) {
//   over_under = "Over Budget by: ";
//   over_under_by *= -1;
// } else if (over_under_by > 0) {
//   over_under = "Under Budget by: ";
// }
// routing to second dynamic page
app.get("/budget_profile", function (req, res) {
  budget_desired = req.body.desiredBalance
    ? req.body.desiredBalance
    : budget_desired;
  food_desired = req.body.desiredFood ? req.body.desiredFood : food_desired;
  entertainment_desired = req.body.desiredEntertainment
    ? req.body.desiredEntertainment
    : entertainment_desired;
  shopping_desired = req.body.desiredShopping
    ? req.body.desiredShopping
    : shopping_desired;
  travel_desired = req.body.desiredTravel
    ? req.body.desiredTravel
    : travel_desired;
  transportation_desired = req.body.desiredTransportation
    ? req.body.desiredTransportation
    : travel_desired;
  payments_desired = req.body.desiredPayments
    ? req.body.desiredPayments
    : payments_desired;

  budget_desired =
    +food_desired +
    +entertainment_desired +
    +shopping_desired +
    +travel_desired +
    +transportation_desired +
    +payments_desired;

  res.render("budget_profile", {
    style: "budget.css",
    desired_balance: formatter.format(budget_desired),
    actual_balance: formatter.format(budget_actual),
    desired_food: formatter.format(food_desired),
    actual_food: formatter.format(food_actual),
    desired_entertainment: formatter.format(entertainment_desired),
    actual_entertainment: formatter.format(entertainment_actual),
    desired_shopping: formatter.format(shopping_desired),
    actual_shopping: formatter.format(shopping_actual),
    desired_payments: formatter.format(payments_desired),
    actual_payments: formatter.format(payments_actual),
    desired_travel: formatter.format(travel_desired),
    actual_travel: formatter.format(travel_actual),
    desired_transportation: formatter.format(transportation_desired),
    actual_transportation: formatter.format(transportation_actual),
    over_or_under:
      budget_desired - budget_actual < 0
        ? "Over budget by: "
        : "Under budget by: ",
    over_or_under_amount:
      budget_desired - budget_actual < 0
        ? formatter.format(-1 * (budget_desired - budget_actual))
        : formatter.format(budget_desired - budget_actual),
  });
});
app.get("/home", function (req, res) {
  res.render("home");
});
// transaction history
app.get("/transaction_history", function (req, res) {
  res.render("transaction_history", {
    transaction: transactionResponse,
    // message: JSON.stringify(transactionResponse.transactions),
  });
});
// investment profile
app.get("/investment_profile", function (req, res) {
  res.render("investment_profile", {
    investment: investmentResponse,
    // investment: JSON.stringify(investmentResponse.investment_transactions),
  });
});
// account settings
app.get("/account_settings", function (req, res) {
  res.render("account_settings", {
    // investment: investmentResponse,
    // investment: JSON.stringify(investmentResponse.investment_transactions),
  });
});

// new_design
app.get("/new_design", function (req, res) {
  res.sendFile(path.join(__dirname, "/new_design.html"));
});

// user profile
app.get("/profile", function (req, res) {
  res.render("profile", {
    user: "Username",
    // investment: JSON.stringify(investmentResponse.investment_transactions),
  });
});

// app.get("/", function (req, res) {
//   // res.render("home", { message: "TEST" });
//   res.status(401).render("home", {
//     message: "sowwy, your email or password is incorrect :(",
//   });
// });
app.listen(PORT, () => {
  console.log("listening on port: ", PORT);
});
