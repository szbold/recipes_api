import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { router as recipesRouter } from "./routes/recipes";
import { errorHandler } from "./utils/errors";
import { logger } from "./utils/logger";

const app = express();
dotenv.config();

const PORT = 8000;
const corsOpts = {
  origin: "http://localhost:3000",
};

const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.9s0vp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

(async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("MONGOSE CONNECTION SUCCESSFUL");

    app.listen(PORT, "localhost", () => {
      console.log("LISTENING ON PORT", PORT);
    });
  } catch (err) {
    console.error(err);
  }
})();

app.use(cors(corsOpts));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger);

app.use("/recipes", recipesRouter);
