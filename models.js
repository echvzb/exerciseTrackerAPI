const mongoose = require("mongoose");

const Schema = mongoose.Schema

const userSchema = new Schema({
  count: {type:Number},
  username: String,
  log: Array,
})
const exerciseSchema = new Schema({
  userId: String,
  username: String,
  date: Date,
  duration: Number,
  description: String,
})

const User = mongoose.model('User', userSchema),
      Exercise = mongoose.model('Exercise', exerciseSchema);


module.exports = {User, Exercise};