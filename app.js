const express = require("express");
var bodyParser = require('body-parser');
const app = express();
const port = 8000;
const mongoose = require("mongoose");
const recipeRouter = require('./routes/recipes');
const cors = require('cors');
const corsOpts = {
  origin: 'http://localhost:3000',

}

const dbURI = 'mongodb+srv://szymonbold:Kanjialive365@cluster0.9s0vp.mongodb.net/recipes_api?retryWrites=true&w=majority'

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(port))
  .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.use('/images', express.static('images'));
app.use(cors(corsOpts));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 


app.use('/recipes', recipeRouter);