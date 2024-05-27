const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  referrals: { type: Number, default: 0 },
  twitterUsername: { type: String },
  discordUsername: { type: String },
  mediumUsername: { type: String },
  walletAddress: { type: String },
  referralLink: { type: String },
  balance: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
