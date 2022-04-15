const express = require("express");
var bodyParser = require('body-parser');
const app = express();
const port = 8000;
const mongoose = require("mongoose");
const serveStatic = require('serve-static');
const path = require('path');
const recipeRouter = require('./routes/recipes');
const cors = require('cors');
const corsOpts = {
     origin: 'https://palcelizac.herokuapp.com',
}

const dotenv = require('dotenv');
dotenv.config();
const dbURI = `mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBPASSWORD}@cluster0.9s0vp.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(port))
  .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.use('/images', express.static('images'));
app.use(cors(corsOpts));
app.use(express.json());
app.use(serveStatic(path.join(__dirname + '/client/dist')))
app.use(bodyParser.urlencoded({ extended: true })); 


app.use('/recipes', recipeRouter);