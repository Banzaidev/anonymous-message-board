const mongoose = require('mongoose')
const repliesSchema = require('./replies.schema')

const threadsSchema = new mongoose.Schema({
    text: {type: String, required: true},
    board: {type:String, required:true},
    created_on: {type: Date, default: () => new Date()},
    bumped_on: {type: Date, default: () => new Date()},
    reported: {type: Boolean, default: false},
    delete_password: {type: String, required:true},
    replies: {type: [repliesSchema], default: []},
    replycount: {type: Number, default: 0}
})

module.exports = threadsSchema