const express = require("express");
const aws = require("aws-sdk");
const fileUpload = require("express-fileupload");
const router = express.Router();
const path = require("path");
const Recipe = require(path.join(__dirname, "../models/recipe"));
const dotenv = require("dotenv");
dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.region = "eu-central-1";

router.use(fileUpload());

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
    .then((result) => res.status(200).json(result));
});

// adds new recipe to db
router.post("/add", (req, res) => {
  // new recipe instance following schema
  let newRecipeModel = {};
  let uniqueName = "";
  if (req.body.title !== undefined) {
    newRecipeModel["title"] = req.body.title;
  } else {
    res.status(400).send({ error: "No title" });
    return;
  }

  if (req.body.servings !== undefined) {
    newRecipeModel["servings"] = req.body.servings;
  } else {
    res.status(400).send({ error: "No servings" });
    return;
  }

  if (req.body.prepTime !== undefined) {
    newRecipeModel["prepTime"] = req.body.prepTime;
  } else {
    res.status(400).send({ error: "No preparation time" });
    return;
  }

  if (req.body.ingredients !== undefined) {
    newRecipeModel["ingredients"] = req.body.ingredients;
  } else {
    res.status(400).send({ error: "No ingredients" });
    return;
  }

  if (req.body.steps !== undefined) {
    newRecipeModel["steps"] = req.body.steps;
  } else {
    res.status(400).send({ error: "No steps" });
    return;
  }

  if (req.files["image"] !== undefined) {
    uniqueName = "images/" + new Date().toISOString() + req.files["image"].name;
    newRecipeModel["image"] = uniqueName;
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
  const s3 = new aws.S3();
  params = {
    Bucket: S3_BUCKET,
    Key: uniqueName,
    Body: req.files["image"].data,
    ACL: "public-read",
  };

  newRecipe
    .save()
    .then((result) => {
      s3.upload(params, function (err, data) {
        if (err) {
          res.send(err);
        } else {
          res.send(result);
        }
      });
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
  .patch((req, res) => {
    const s3 = new aws.S3();
    const fullRequest = { ...req.body };
    let uniqueName = "";
    if (req.files !== null) {
      if (req.files["image"] !== undefined) {
        console.log(req.files);
        uniqueName =
          "images/" + new Date().toISOString() + req.files["image"].name;
        fullRequest["image"] = uniqueName;
      }
    }

    Recipe.findByIdAndUpdate(req.params.id, fullRequest)
      .then((recipe) => {
        if (fullRequest.image) {
          let params = {
            Bucket: S3_BUCKET,
            Key: uniqueName,
            Body: req.files["image"].data,
          };

          s3.upload(params, function (err, data) {
            if (err) {
              res.send(err);
              return;
            }
          });

          params = {
            Bucket: S3_BUCKET,
            Key: recipe.image,
          };
          s3.deleteObject(params, function (err, data) {
            if (err) {
              res.send(err);
              return;
            }
          });
        }
        res.sendStatus(204);
      })
      .catch((err) => res.status(404).send({ error: err }));
  })
  .delete((req, res) => {
    // delete and error handling, 404 if no recipe found, 400 on any other case
    Recipe.findByIdAndDelete(req.params.id, function (err, recipe) {
      if (err) {
        res.status(400).send(err);
      } else {
        if (recipe === null) {
          res.status(404).send({ error: "Not found" });
          return;
        }
        const s3 = new aws.S3();
        params = {
          Bucket: S3_BUCKET,
          Key: recipe.image,
        };
        s3.deleteObject(params, function (err, data) {
          if (err) {
            res.send(err);
            return;
          }
          res.status(204).send();
        });
      }
    });
  });

module.exports = router;
