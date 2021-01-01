let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let session=require('express-session')
let config=require('./config/config')

let LL1Router = require('./routes/LL1');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret:'databaseProject',
    resave:false,
    saveUninitialized:true
}));
app.use('/LL1', LL1Router);

app.listen(config.port,()=>{
    console.log("listening on port "+config.port)
})

module.exports = app;
