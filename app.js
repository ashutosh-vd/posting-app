const express = require('express');
const app = express();

const usermodel = require('./models/user');
const postmodel = require('./models/post');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
app.use(cookieparser());

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.render('index');
})

app.post('/create' , (req, res) => {
	const {name, username, email, password} = req.body;
	bcrypt.hash(password, 10, async (err, hash) => {
		const cuser = await usermodel.create({
			name, username, email, password: hash,
		});
		res.send(cuser);
	})
})

app.get('/login', (req, res) => {
	res.render('login');
})
app.post('/login', async (req, res) => {
	const {email, password} = req.body;
	let user = await usermodel.findOne({email});
	if(!user) {
		res.send("something_went_wrong");
		return;
	}
	bcrypt.compare(password, user.password, (err, result) => {
		if(result) {
			const token = jwt.sign({
				username: user.username,
				email: email,
			}, 'shh', (err, token) =>{
				res.cookie("_token", token);
				res.redirect('/login');
			})
		}
		else {
			res.send("something_went_wrong");
			return;
		}
	})
})
app.get('/logout', (req, res) => {
	res.cookie('_token', "");
	res.redirect('/login');
})

app.listen(3000, (err) => {
	if(err) 
		throw err;
})