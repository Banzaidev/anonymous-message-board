const mongoose = require('mongoose')


const repliesSchema = new mongoose.Schema({
    text: {type: String, required: true},
    created_on: {type: Date, default: () =>  new Date(Date.now()).toUTCString()},
    reported: {type:Boolean, default: false},
    delete_password: {type:String, required: true},
})

module.exports = repliesSchema