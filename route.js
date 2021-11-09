const express = require("express");
const db = require("./database");
const router = express.Router();

router.post("/register", async (req, res) => {
  var { username, pass, masterpassword } = req.body;
  if (!username || !pass) {
    res.json({ msg: "empty fields not allowed" });
  } else {
    try {
      var sql = `Select * FROM user where username="${username}"`;
      await db.con.query(sql, (err, result, field) => {
        if (err) throw err;
        var obj = Object.keys(result);
        if (obj.length !== 0 && obj[0].username != null) {
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
router.post("/login", async (req, res) => {
  var { username, pass } = req.body;
  let Masterpassword = "aaa";
  if (!username || !pass) {
    res.json({ msg: "enter the fields" });
  } else {
    try {
      var sql = `Select * FROM user where username="${username}"`;
      await db.con.query(sql, (err, result, field) => {
        if (err) throw err;
        var obj = Object.keys(result);
        if (obj.length === 0) {
          return res.json({ msg: "not a user in database" });
        }
        console.log(obj)
        if (obj[0].username === null || obj[0].pass !== pass) {
          console.log(obj[0]);
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

router.post("/delete", async (req, res) => {
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

router.post("/edit", (req, res) => {
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

router.post("/logout", (req, res) => {
  if (req.session.authenticated == true) {
    req.session.destroy();
    res.json({ msg: "logout" });
  } else {
    res.json({ msg: "not in use user" });
  }
});
module.exports = router;
