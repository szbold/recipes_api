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
    .select("title image difficulty prepTime servings")
    .limit(limit ? limit : 15)
    .sort({ createdAt: -1 })
    .then((result) => res.json(result));
});

// adds new recipe to db
router.post("/add", upload.single("image"), (req, res) => {
  // new recipe instance following schema
  let newRecipeModel = {};
  if (req.body.title !== undefined) {
    newRecipeModel["title"] = req.body.title;
  } else {
    fs.unlink(req.file.path, function () {});
    res.status(400).send({ error: "No title" });
    return;
  }

  if (req.body.servings !== undefined) {
    newRecipeModel["servings"] = req.body.servings;
  } else {
    fs.unlink(req.file.path, function () {});
    res.status(400).send({ error: "No servings" });
    return;
  }

  if (req.body.prepTime !== undefined) {
    newRecipeModel["prepTime"] = req.body.prepTime;
  } else {
    fs.unlink(req.file.path, function () {});
    res.status(400).send({ error: "No preparation time" });
    return;
  }

  if (req.body.ingredients !== undefined) {
    newRecipeModel["ingredients"] = req.body.ingredients;
  } else {
    fs.unlink(req.file.path, function () {});
    res.status(400).send({ error: "No ingredients" });
    return;
  }

  if (req.body.steps !== undefined) {
    newRecipeModel["steps"] = req.body.steps;
  } else {
    fs.unlink(req.file.path, function () {});
    res.status(400).send({ error: "No steps" });
    return;
  }

  if (req.file !== undefined) {
    newRecipeModel["image"] = req.file.path;
  } else {
    res.status(400).send({ error: "No image" });
    return;
  }

  if (req.body.description !== undefined) {
    newRecipeModel["description"] = req.body.description;
  }

  if (req.body.difficulty !== undefined) {
    newRecipeModel["difficulty"] = req.body.difficulty;
  }

  if (req.body.tags !== undefined) {
    newRecipeModel["tags"] = req.body.tags;
  }

  const newRecipe = new Recipe(newRecipeModel);

  newRecipe
    .save()
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((err) => {
      // formatted response message
      const message = err.message;
      let colon = message.lastIndexOf(":") + 2;
      res.status(400).send({ error: message.substring(colon, message.length) });
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
  .patch(upload.single('image'), (req, res) => {
    const fullrequest = {...req.body}
    if (req.file !== undefined) {
      fullrequest['image'] = req.file.path;
    }

    Recipe.findByIdAndUpdate(req.params.id, fullrequest).then(
      (recipe) => {
        if (fullrequest.image) {
          fs.unlink(recipe.image, function() {})
        }
        res.sendStatus(204);
      }
    ).catch(err => res.status(404).send({error: err}));
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
