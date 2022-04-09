const express = require("express");
var bodyParser = require('body-parser');
const app = express();
const port = 8000;
const mongoose = require("mongoose");
const recipeRouter = require('./routes/recipes');
const cors = require('cors');
const corsOpts = {
  origin: 'http://192.168.1.18:3000',
}

const dotenv = require('dotenv');
dotenv.config();
const dbPassword = process.env.dbPassword;
const dbUsername = process.env.dbUsername;
const dbName = process.env.dbName;

const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.9s0vp.mongodb.net/${dbName}?retryWrites=true&w=majority`

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(port, '192.168.1.18'))
  .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.use('/images', express.static('images'));
app.use(cors(corsOpts));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 


app.use('/recipes', recipeRouter);