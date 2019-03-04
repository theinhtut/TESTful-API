const mongoose = require("mongoose"), Types = mongoose.Schema.Types;

const variableSchema = new mongoose.Schema({}, { strict:false });

module.exports = mongoose.model('Variable', variableSchema);