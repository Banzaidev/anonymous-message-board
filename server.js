'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');
const connectDB = require('./config/db.js')
const mongoose = require('mongoose')
const threadsSchema = require('./schemas/threads.schema.js')
const helmet = require('helmet')

const app = express();
app.use(
  helmet({
    referrerPolicy: {
      policy: ["same-origin"],
    },
  }),
)
app.use(async (req,res,next) => {
  if (mongoose.connection.readyState != 1){
    return res.status(503).send('Database connection error')
  }
  next()
})

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);
const Threads = mongoose.model('Threads',threadsSchema)

//Routing for API 
apiRoutes(app,Threads);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
/* 
  You can't connect to DB every request because it's bad practice, 
  it consumes  a lot of reosurces and significantly slows down your server, 
  and can quickly exhaust the database's connection limit,
 */
(async () => {
  await connectDB()
  const listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
    if(process.env.NODE_ENV==='test') {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch(e) {
          console.log('Tests are not valid:');
          console.error(e);
        }
      }, 1500);
    }
  });

})()





module.exports = app; //for testing
