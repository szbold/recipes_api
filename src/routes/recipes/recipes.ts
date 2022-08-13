import express, { Request, Response } from "express";
import aws from "aws-sdk";
import dotenv from "dotenv";
import fileUpload, { UploadedFile } from "express-fileupload";
import { IQueryParams } from "./types";
import { IRecipe, Recipe } from "../../models";
import { generateImageName } from "../../utils/images";
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { MongooseError } from "mongoose";
import sharp from "sharp";
import sizeOf from "image-size";

import { exit } from "process";
import { ResError } from "../../errors";
import { imageValidator } from "../../utils/validation";

dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET_NAME;

if (S3_BUCKET === undefined) {
  exit(1);
}

aws.config.region = "eu-central-1";

export const router = express.Router();
router.use(fileUpload());

const DEFAULT_LIMIT = 15;
const DEFAULT_OFFSET = 0;

router.use("/all", async (req: Request, res: Response) => {
  const { search, limit, tags, offset }: IQueryParams = req.query;
  const query: { [key: string]: any } = {};

  if (search) {
    query.title = { $regex: new RegExp(`.*${search}.*`, "i") };
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    query.$and = tags.map((tag) => ({ tags: tag }));
  }

  try {
    const data = await Recipe.find(query)
      .select("title image difficulty prepTime servings")
      .skip(offset ? offset : DEFAULT_OFFSET)
      .limit(limit ? limit : DEFAULT_LIMIT)
      .sort({ createdAt: -1 });

    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/add", imageValidator, async (req: Request, res: Response) => {
  // TODO - implement custom upload middleware which checks for file type and processes the file in a manageable way
  const image = req.body.image;
  const dims = sizeOf(image.data);

  if (dims.width && dims.height) {
    const uniqueImageName = generateImageName(image.name);
    const resizeFactor = Math.round(dims.width / 700);

    const s3 = new aws.S3();

    const newRecipe = new Recipe({ ...req.body, image: uniqueImageName });

    try {
      const data = await newRecipe.save();
      const compressedImage = await sharp(image.data)
        .webp()
        .resize(700, Math.round(dims.height / resizeFactor))
        .toBuffer();

      const params: PutObjectRequest = {
        Bucket: S3_BUCKET,
        Key: uniqueImageName,
        Body: compressedImage,
        ACL: "public-read",
      };

      s3.upload(params, (err) => {
        if (err) {
          res.status(500).send({ errcode: ResError.s3Error, ResError: err });
        }
      });
      res.status(201).send(data);
    } catch (err) {
      res.status(500).send({ errcode: ResError.serverError, ResError: err });
    }
  }
});

router
  .route("/:id")
  .get(async (req: Request, res: Response) => {
    try {
      const data = await Recipe.findOne({ _id: req.params.id });
      res.status(200).send(data);
    } catch (err) {
      res.status(404).send({ errcode: ResError.notFound, ResError: err });
    }
  })
  //   .patch((req, res) => {
  //     const s3 = new aws.S3();
  //     const fullRequest = { ...req.body };
  //     let uniqueName = "";
  //     if (req.files !== null) {
  //       if (req.files["image"] !== undefined) {
  //         console.log(req.files);
  //         uniqueName =
  //           "images/" + new Date().toISOString() + req.files["image"].name;
  //         fullRequest["image"] = uniqueName;
  //       }
  //     }

  //     Recipe.findByIdAndUpdate(req.params.id, fullRequest)
  //       .then((recipe) => {
  //         if (fullRequest.image) {
  //           let params = {
  //             Bucket: S3_BUCKET,
  //             Key: uniqueName,
  //             Body: req.files["image"].data,
  //           };

  //           s3.upload(params, function (err, data) {
  //             if (err) {
  //               res.send(err);
  //               return;
  //             }
  //           });

  //           params = {
  //             Bucket: S3_BUCKET,
  //             Key: recipe.image,
  //           };
  //           s3.deleteObject(params, function (err, data) {
  //             if (err) {
  //               res.send(err);
  //               return;
  //             }
  //           });
  //         }
  //         res.sendStatus(204);
  //       })
  //       .catch((err) => res.status(404).send({ ResError: err }));
  //   })
  .delete((req: Request, res: Response) => {
    Recipe.findByIdAndDelete(
      req.params.id,
      (err: MongooseError, recipe: IRecipe) => {
        if (err) {
          res.status(500).send({ errcode: ResError.dbError, ResError: err });
          return;
        }

        if (recipe === null) {
          res.status(404).send({ errcode: ResError.notFound });
          return;
        }

        const s3 = new aws.S3();
        const params: PutObjectRequest = {
          Bucket: S3_BUCKET,
          Key: recipe.image,
        };

        s3.deleteObject(params, (err) => {
          if (err) {
            res.status(500).send({ errcode: ResError.s3Error, ResError: err });
            return;
          }
          res.status(204).send();
        });
      }
    );
  });
