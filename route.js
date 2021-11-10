const express = require("express");
const db = require("./database");
const router = express.Router();
const bcrypt = require("bcrypt");
var validator = require("email-validator");

var passwordValidator = require('password-validator');


var schema = new passwordValidator();
schema
.is().min(8)                                                                     
.has().uppercase()                              
.has().lowercase()                              
.has().digits(1)                               
.has().not().spaces()                          





const encryptPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (err) {
    throw err;
  }
};

const decryptPassword = async (password, hashedPassword) => {
  try {
    const encodedPassword = await bcrypt.compare(password, hashedPassword);
    return encodedPassword;
  } catch (err) {
    throw err;
  }
};

// custom regex 

const validEmail = (email) => {
  return validator.validate(email);
}

const validPassword = (password) => {
  return schema.validate(password);
}



router.post("/register", async (req, res) => {
  var { username, pass, masterpassword } = req.body;
  if (!username || !pass) {
    res.json({ msg: "empty fields not allowed" });
  }
  else if (!validEmail(username))
  {
      return res.json({"msg":"enter right email"})
  }
  else if (!validPassword(pass))
  {
        return res.json({"msg":"min 8 chars, min 1 capital , min 1 small, min 1 number, min 1 special char"}) 
  }
  else {
    try {
      var sql = `Select * FROM user where username="${username}"`;
      await db.con.query(sql, async(err, result, field) => {
        if (err) throw err;
        var obj = Object.assign({}, result[0]);
        if (obj.length !== 0 && obj.username != null) {
          res.send("user already taken");
        } else {
          const password = await encryptPassword(pass);
          var sql = `INSERT into user (username,pass,masterpassword) values ("${username}","${password}","${masterpassword}")`;
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
      await db.con.query(sql, async(err, result, field) => {
        if (err) throw err;

        var obj = Object.assign({}, result[0]);
        if (obj.length === 0) {
          return res.json({ msg: "not a user in database" });
        }
        console.log(obj);

        if (obj === {} || obj.username === null || !(await decryptPassword(pass,obj.pass))) {
          console.log(obj);
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

router.delete("/delete", async (req, res) => {
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

router.put("/edit", async(req, res) => {
  try {
    if (req.session.user.username === null) {
      res.json({ msg: "please login" });
    } else if (req.session.user.isAdmin) {
      res.json({ msg: "you can't edit this record" });
    } else {
      var sql = `Update user Set pass="${await encodedPassword(req.body.pass)}" where username="${req.session.user.username}"`;
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

// logout

router.post("/logout", (req, res) => {
  if (req.session.authenticated == true) {
    req.session.destroy();
    res.json({ msg: "logout" });
  } else {
    res.json({ msg: "not in use user" });
  }
});
module.exports = router;
