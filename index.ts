import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import { router as recipesRouter } from "./src/routes/recipes";

const app = express();

const PORT = 8000;
const corsOpts = {
  origin: "http://localhost:3000",
};

dotenv.config();
const dbURI = `mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBPASSWORD}@cluster0.9s0vp.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`;

(async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("MONGOSE CONNECTION SUCCESSFUL");

    app.listen(PORT, "localhost", () => {
      console.log("LISTENING ON PORT", PORT);
    });
  } catch (err) {
    console.error(err);
  }
})();

app.use("/images", express.static("images"));
app.use(cors(corsOpts));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/recipes", recipesRouter);
