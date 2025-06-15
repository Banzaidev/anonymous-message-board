const mongoose = require('mongoose')
require('dotenv').config()


async function connectDB(){
   return await mongoose.connect(process.env.MONGO_URI)
}


module.exports = connectDB