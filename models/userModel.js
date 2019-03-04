const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true},
    token: { type: String },
    createdOn: { type: Date, default: Date.now }
}, { strict:false });

module.exports = mongoose.model('User', userSchema);