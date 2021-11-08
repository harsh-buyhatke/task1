const db = require("./database");
const path = require("path");
const express = require("express");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var FileStore = require("session-file-store")(session);
const { copyFileSync } = require("fs");
const { runInNewContext, compileFunction } = require("vm");

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

app.use(cookieParser());

app.use(
  session({
    secret: "Shh, its a secret!",
    cookie: { maxAge: 30000 },
    store: new FileStore(),
    saveUninitialized: true,
  })
);

app.listen(port, () => console.log(`server started on port ${port}`));

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

app.post("/register", async (req, res) => {
  var { username, pass, masterpassword } = req.body;
  if (!username || !pass) {
    res.json({ msg: "empty fields not allowed" });
  } else {
    try {
      var sql = `Select * FROM user where username="${username}"`;
      await db.con.query(sql, (err, result) => {
        if (err) throw err;
        if (result.username != null) {
          res.send("user already taken");
        } else {
          var sql = `INSERT into user (username,pass,masterpassword) values ("${username}","${pass}","${masterpassword}")`;
          db.con.query(sql, (er, result) => {
            if (er) throw er;
            res.send("record inserted successfully");
          });
        }
      });
    } catch (err) {
      res.json({ msg: err });
    }
  }
});

//login
app.post("/login", async (req, res) => {
  var { username, pass } = req.body;
  let Masterpassword = "aaa";
  if (!username || !pass) {
    res.json({ msg: "enter the fields" });
  } else {
    try {
      var sql = `Select * FROM user where username="${username}"`;
      await db.con.query(sql, (err, result, field) => {
        if (err) throw err;
        if (result[0].username === null || result[0].pass !== pass) {
          console.log({ result });
          res.json({ msg: "enter right credentials" });
        } else {
          if (
            req.session.authenticated &&
            req.session.user.username == username &&
            req.session.user.pass == pass
          ) {
            res.json({ msg: `hello user ${username}` });
          } else {
            let isAdmin = false;
            if (result.masterpassword === Masterpassword) {
              isAdmin = true;
            }
            req.session.authenticated = true;
            req.session.user = {};
            req.session.user.isAdmin = isAdmin;
            req.session.user.username = username;
            req.session.user.pass = pass;
            res.json({ msg: `hello user ${username} first time login` });
          }
        }
      });
    } catch (err) {
      res.json({ msg: err });
    }
  }
});

// delete

app.post("/delete", async (req, res) => {
  try {
    if (req.session.user.username === null) {
      res.json({ msg: "please login" });
    } else if (req.session.user.isAdmin) {
      res.json({ msg: "you can't delete this record" });
    } else {
      var sql = `DELETE FROM user WHERE username="${req.session.user.username}"`;
      await db.con.query(sql, function (err, result) {
        if (err) throw err;
        res.json("record successfully deleted");
      });
    }
  } catch (err) {
    res.json({ error: err });
  }
});

// edit

app.post("/edit", (req, res) => {
  try {
    if (req.session.user.username === null) {
      res.json({ msg: "please login" });
    } else if (req.session.user.isAdmin) {
      res.json({ msg: "you can't edit this record" });
    } else {
      var sql = `Update user Set pass="${req.body.pass}" where username="${req.session.user.username}"`;
      db.con.query(sql, (err, result, field) => {
        if (err) {
          console.log(err);
          throw err;
        }
        res.send("updated successfully");
      });
    }
  } catch (err) {
    res.json({ error: err });
  }
});

app.post("/logout", (req, res) => {
  if (req.session.authenticated == true) {
    req.session.destroy();
    res.json({ msg: "logout" });
  } else {
    res.json({ msg: "not in use user" });
  }
});
