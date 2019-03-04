const mongoose = require("mongoose"), Types = mongoose. Schema.Types;

const deviceSchema = new mongoose.Schema({
    deviceName: { type: String },
    deviceURLId: { type: String },
    createdOn: { type: Date, default: Date.now }
}, { strict:false });

module.exports = mongoose.model('Device', deviceSchema);