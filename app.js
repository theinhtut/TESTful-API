const express = require('express');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api');
const indexRoutes = require('./routes/index');

const app = express();

// MongoDb config
const dbConfig = require('./config/keys').MongoURI;


// Connect to MongoDb
mongoose.connect(dbConfig, { useNewUrlParser: true })
.then(() => console.log('MongoDb is connected...'))
.catch(err => console.log(err));

// EJS
app.set('view engine', 'ejs');

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// CORS Error handling 
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if(req.method === 'OPTIONS') {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE,GET");
      return res.status(200).json({});
    }
    next();
  });

// Routes
app.use(express.static(__dirname + '/public'));
app.use('/', indexRoutes);
app.use('/api/v1', apiRoutes);

app.use((req, res, next) => {
    //const error = new Error('Not found');
    //error.status= 404;
    //next(error);
    res.send('404 NOT FOUND');
});

module.exports = app;