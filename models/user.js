const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/posting-app');

const userSchema = mongoose.Schema({
	name: String,
	email: String,
	username: String,
	password: String,
	posts: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'post',
	}],
	avatar: {
		type: String,
		default: "default.jpg"
	},
})

module.exports = mongoose.model('user', userSchema);