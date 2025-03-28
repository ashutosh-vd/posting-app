const mongoose = require('mongoose');


const postSchema = mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
	},
	data: String,
	content: {
		type: String,
	},
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
	}],
})

module.exports = mongoose.model('post', postSchema)