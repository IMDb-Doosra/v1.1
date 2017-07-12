const express = require('express');
var router = express.Router();
var path = require('path');
var bcrypt = require('bcryptjs');
//
router.get('/', (req, res) => {
    console.log("home pe session: ", req.session);
    res.sendFile(path.join(__dirname, '/../public/index.html'));
});
//
router.get('/login', (req, res) => {
    if (req.session.userid) {
        res.redirect('/logs');
    }
    else {
        res.sendFile(path.join(__dirname, '/../public/login.html'));
    }
});
//
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/../public/register.html'));
});
//
//
router.post('/login', function (req, res) {
    var user = {
        email: req.body.email
        , pass: req.body.pass
    };
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'localhost'
        , user: 'root'
        , password: 'aakash'
        , database: 'imdb2'
    });
    var loginUser = 'SELECT * FROM user WHERE email="' + user.email + '" AND pass="' + user.pass + '";';
    try {
        connection.query(loginUser, function (err, data) {
            var msg = '';
            if (err) {
                msg = 'Error';
                res.send(msg);
            }
            else {
                if (data.length) {
                    //msg = 'Logged in as ' + data[0].name;
                    req.session.userid = data[0].userid;
                    console.log("session", req.session);
                    req.session.name = data[0].name;
                    res.redirect('/logs');
                }
                else {
                    msg = 'Invalid Email or Password!!';
                    res.send(msg);
                }
            }
        });
    }
    catch (err) {
        res.send("Error Occured!");
        console.log("Error Occured!");
    }
});
//
router.post('/register', function (req, res) {
    var newUser = {
        name: req.body.name
        , email: req.body.email
        , pass: req.body.pass
    };
    if (newUser.name && newUser.email && newUser.pass) {
        var mysql = require('mysql');
        var connection = mysql.createConnection({
            host: 'localhost'
            , user: 'root'
            , password: 'aakash'
            , database: 'imdb2'
        });
        var createUser = 'INSERT INTO user(name,email,pass) VALUES("' + newUser.name + '","' + newUser.email + '","' + newUser.pass + '");';
        try {
            connection.query(createUser, function (err, data) {
                var msg = '';
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        msg = 'This email has already been registered!! Enter another email or Try logging in instead.';
                    }
                }
                else {
                    msg = 'Registration Successful!';
                }
                res.send(msg);
            });
        }
        catch (err) {
            res.send("Error Occured!");
            console.log("Error Occured!");
        }
    }
    else {
        res.send("Enter credentials properly!!");
    }
});
router.get('/getmovie', (req, res) => {
    var title = req.query.title;
    title = add(title);
    var url = 'http://www.omdbapi.com/?apikey=ec6483bd&plot=full&t=' + title;
    var request = require('request');
    var reqs = request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.render('movie', JSON.parse(body));
        }
    })
});
router.post('/rate', (req, res) => {
    var rating = {
        rating: req.body.rating
        , mid: req.body.mid
        , mname: req.body.mname
    };
    console.dir(rating);
    if (req.session.userid) {
        if (rating.rating) {
            var addRating = 'INSERT INTO ur VALUES("' + req.session.userid + '","' + rating.mid + '","' + rating.mname + '","' + rating.rating + '");';
            var mysql = require('mysql');
            var connection = mysql.createConnection({
                host: 'localhost'
                , user: 'root'
                , password: 'aakash'
                , database: 'imdb2'
            });
            try {
                connection.query(addRating, function (err, data) {
                    var msg = '';
                    if (err) {
                        msg = 'Unable to add your rating to database currently! Sorry for inconvinience.';
                    }
                    else {
                        msg = 'Rating Submitted!';
                    }
                    res.send(msg);
                });
            }
            catch (err) {
                res.send("Error Occured!");
                console.log("Error Occured!");
            }
        }
        else {
            res.send("Enter a rating!");
        }
    }
    else {
        res.redirect('/login');
    }
});
router.get('/logs', function (req, res) {
    console.log("req.session : ", req.session);
    if (req.session.userid) {
        var mysql = require("mysql");
        var connection = mysql.createConnection({
            host: 'localhost'
            , user: 'root'
            , password: 'aakash'
            , database: 'imdb2'
        });
        var nm = req.session.name;
        var findRating = 'SELECT * FROM ur WHERE userid="' + req.session.userid + '";';
        try {
            connection.query(findRating, function (err, rows) {
                if (err) {
                    res.send("Error");
                }
                else {
                    if (rows.length) {
                        console.log(rows);
                        res.render('profile', {
                            name: nm
                            , list: JSON.parse(JSON.stringify(rows))
                        });
                    }
                    else {
                        console.log("no movies rated by this user");
                        res.send("no movies rated by this user");
                    }
                }
            });
        }
        catch (x) {
            res.send("Error Occured!");
            console.log("Error Occured!");
        }
    }
    else {
        res.redirect("/login");
    }
});
//
router.get('/logout', function (req, res) {
    req.session.destroy(function () {
        console.log("User logged out!")
    });
    console.log("session after logout: ", req.session);
    res.redirect('/login');
});
//
router.get(function (req, res) {
    res.render('error', {
        message: "Does Not Exist"
    });
});

function add(mname) {
    for (i = 0; i < mname.length; i++) {
        if (mname[i] == ' ') {
            mname = mname.replace(' ', '+');
        }
    }
    return mname;
}
module.exports = router;