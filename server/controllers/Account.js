const models = require('../models');

const Account = models.Account;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

// const changePassPage = (req, res) => {
//   res.render('changePass', { csrfToken: req.csrfToken() });
// };

const getToken = (request, response) => {
  const req = request;
  const res = response;

  const csrfJSON = {
    csrfToken: req.csrfToken(),
  };

  res.json(csrfJSON);
};

const getUsername = (request, response) => {
  const req = request;
  const res = response;
  
  const username = {
    username: req.session.username,
  };
  
  res.json(username);
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (request, response) => {
  const req = request;
  const res = response;

  // cast to strings to cover some security flaws
  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  return Account.AccountModel.authenticate(username, password, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password' });
    }

    req.session.account = Account.AccountModel.toAPI(account);
    req.session.username = username;

    return res.json({ redirect: '/maker' });
  });
};

const signup = (request, response) => {
  const req = request;
  const res = response;

  // cast to strings to cover some security flaws
  req.body.username = `${req.body.username}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
    const accountData = {
      username: req.body.username,
      salt,
      password: hash,
      numFighters: 0,
      maxFighters: 3,
    };

    const newAccount = new Account.AccountModel(accountData);

    const savePromise = newAccount.save();

    savePromise.then(() => {
      req.session.account = Account.AccountModel.toAPI(newAccount);
      req.session.username = req.body.username;
      
      console.log(newAccount);
      
      return res.json({ redirect: '/maker', message: 'Account Created Successfully' });
    });

    savePromise.catch((err) => {
      console.log(err);

      if (err.code === 11000) {
        return res.status(400).json({ error: 'Username already in use.' });
      }

      return res.status(400).json({ error: 'An error occurred' });
    });
  });
};

const changePass = (request, response) => {
  const req = request;
  const res = response;
  
  req.body.pass = `${req.body.pass}`
  req.body.newPass = `${req.body.newPass}`;
  req.body.newPass2 = `${req.body.newPass2}`;
  // account: req.session.account._id
  
  // console.dir(`password: ${req.body.pass} new pass 1: ${req.body.newPass} new pass 2: ${req.body.newPass2}`);

  if (!req.body.pass || !req.body.newPass || !req.body.newPass2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (req.body.newPass !== req.body.newPass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }
  
  return Account.AccountModel.authenticate(req.session.account.username, req.body.pass, (er, account) => {
    if (er || !account) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    return Account.AccountModel.generateHash(req.body.newPass, (salt, hash) =>
    // get the object in the database
     Account.AccountModel.findByUsername(req.session.account.username, (err, doc) => {
       const account = doc;

       if (err) {
         console.dir(err);
         return res.status(500).json({ error: 'Internal Server Error. Please try again' });
       }

       if (!doc) {
         console.dir(err);
         return res.status(400).json({ error: 'Account not found. Please try again' });
       }
       console.dir(`old password = ${doc.password}`);
      // update password
       account.password = hash;
       account.salt = salt;
       console.dir(`new password = ${doc.password}`);

       const savePromise = doc.save();

       savePromise.then(() => {
         req.session.account = Account.AccountModel.toAPI(doc);
         return res.json({ redirect:'/maker', message: 'Password Changed Successfully' });
       });

       savePromise.catch(error => {
         console.dir(error);
         return res.status(400).json({ error: 'An error occurred' });
       });

       // return res.json({ redirect:'/maker' });
     }));
  });
};

/// increases the number of fighters an account can have
const increaseMaxFighters = (request, response) => {
  const req = request;
  const res = response;
  
  const increase = req.body.numFighters;
  // validate funds
  
  Account.AccountModel.findByUsername(req.session.account.username, (err, doc) => {
    const account = doc;
    account.maxFighters += 1;
    
    const accountPromise = doc.save();
      
    accountPromise.then(() => {
      console.log(account.maxFighters);
      return res.json({ message: `Purchase Successful` });
    });
    
    accountPromise.catch(error => {
      console.dir(error);
      return res.status(400).json({ error: 'A problem occurred' });
    });
  });
};

module.exports.loginPage = loginPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;
module.exports.getToken = getToken;
module.exports.getUsername = getUsername;
module.exports.changePass = changePass;
module.exports.increaseMaxFighters = increaseMaxFighters;
// module.exports.changePassPage = changePassPage;
