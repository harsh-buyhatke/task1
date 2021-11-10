const db = require("./database");
const path = require("path");
const express = require("express");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var FileStore = require("session-file-store")(session);
const { copyFileSync } = require("fs");
const { runInNewContext, compileFunction } = require("vm");
const app = express();
const route = require('./route')
const port = process.env.PORT || 5000;
app.use(express.json());

app.use(cookieParser());

app.use(
  session({
    secret: "Shh, its a secret!",
    cookie: { maxAge: 3000000 },
    store: new FileStore(),
    saveUninitialized: false,
  })
);

app.listen(port, () => console.log(`server started on port ${port}`));
app.use('/test',route)
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
  //__dirname : It will resolve to your project folder.
});

// createUserAccount - Pass in Body {Name, Email, Password, Phone, Address} - Return UID
// createAdminAccount - Pass in Body {Name, Email, Password, Phone, Addredd, MasterPassword} - Return AUID

// Login - Pass in Body {Email, Password, isAdmin}
// Check above crdentials in two different tables and save in cookie  - Email, UID, isAdmin

// getUserDetails - {Pass in Body {MyEmail, MasterPassword (Optional)}} if MyEmail / UID !=Session Email or UID, check if current one is Admin else return error.

// editMyDetails - {Pass in Body {MyEmail and details to be changed}}If MyEmail is != SessionEmail, return error

// register


