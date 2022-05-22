const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  users: { type: String, required: true },
  votes: { type: Array, required: true },
});

module.exports = mongoose.model('Voter', voterSchema);