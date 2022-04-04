const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      return cb(
        null,
        false,
        new Error("Only .png, .jpg and .jpeg format allowed!")
      );
    }
  },
});

// gets all the recipes, search and limit params
router.use("/all", (req, res) => {
  const search = req.query.search;
  const limit = req.query.limit;
  const tags = req.query.tags;
  let query = {};
  // assembles query based on availability of parameters (undef or not)

  if (search) {
    query["title"] = { $regex: new RegExp(`.*${search}.*`, "i") };
  }

  if (tags) {
    query["$and"] = tags.map((tag) => ({ tags: tag }));
  }

  Recipe.find(query)
    .select("title image")
    .limit(limit ? limit : 15).sort({'createdAt': -1})
    .then((result) => res.json(result));
});

// adds new recipe to db
router.post("/add", upload.single("image"), (req, res) => {
  // new recipe instance following schema
  if (!req.file) {
    res.status(400).send({ error: "Invalid file" });
    return;
  }

  const newRecipe = new Recipe({
    title: req.body.title,
    ingredients: req.body.ingredients,
    steps: req.body.steps,
    difficulty: req.body.difficulty,
    tags: req.body.tags,
    image: req.file.path,
  });

  newRecipe
    .save()
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((err) => {
      // formatted response message
      const message = err.message;
      let colon = message.lastIndexOf(":") + 2;
      res.status(409).send({ error: message.substring(colon, message.length) });
    });
});

// operations on specific recipe, fetching, updating, deleting
router
  .route("/:id")
  .get((req, res) => {
    Recipe.findOne({ _id: req.params.id })
      .then((result) => {
        if (result === null) {
          res.status(404).send({ error: "Not found" });
        }
        res.status(200).json(result);
      })
      .catch(() => res.status(404).send({ error: "Not found" }));
  })
  .put(upload.single("image"), (req, res) => {
    // simple form data update

    if (!req.file) {
      res.status(400).send({ error: "File not attached" });
    }

    Recipe.findOne({ _id: req.params.id })
      .then((result) => {
        const recipe = result;
        const imagefile = recipe.image;
        recipe.title = req.body.title;
        recipe.ingredients = req.body.ingredients;
        recipe.steps = req.body.steps;
        recipe.difficulty = req.body.difficulty;
        recipe.tags = req.body.tags;
        recipe.image = req.file.path;

        recipe
          .save()
          .then((result) => {
            fs.unlink(imagefile, function () {
              res.status(200).json(result);
            });
          })
          .catch(() => {
            res.status(400).send({ error: "Bad request" });
          });
      })
      .catch(() => res.status(404).send({ error: "Not found" }));
  })
  .delete((req, res) => {
    // delete and error handling, 404 if no recipe found, 400 on any other case
    Recipe.findByIdAndDelete(req.params.id, function (err, recipe) {
      if (err) {
        res.status(400).send(err);
      } else {
        if (recipe === null) {
          res.status(404).send({ error: "Not found" });
        } else {
          fs.unlink(recipe.image, function () {
            res.status(204).send({ message: "No content" });
          });
        }
      }
    });
  });

module.exports = router;
