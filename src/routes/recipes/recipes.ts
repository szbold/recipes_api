import express, { Request, Response } from "express";
import aws from "aws-sdk";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import { IQueryParams } from "./types";
import { IRecipe, Recipe } from "../../models";
import { generateImageName, parseImage } from "../../utils/images";
import { DeleteObjectRequest, PutObjectRequest } from "aws-sdk/clients/s3";
import { MongooseError } from "mongoose";
import { exit } from "process";
import { ResError } from "../../errors";
import { imageValidator, optionalImageValidator } from "../../utils/validation";

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

router.post(
  "/add",
  imageValidator,
  parseImage,
  async (req: Request, res: Response) => {
    const { image, ...reqBody } = req.body;

    const uniqueImageName = generateImageName(image.name);
    const newRecipe = new Recipe({ ...reqBody, image: uniqueImageName });

    try {
      const data = await newRecipe.save();

      const s3 = new aws.S3();
      const params: PutObjectRequest = {
        Bucket: S3_BUCKET,
        Key: uniqueImageName,
        Body: image.data,
        ACL: "public-read",
      };

      s3.upload(params, (err) => {
        if (err) {
          res.status(500).send({ errcode: ResError.s3Error, ResError: err });
        }
      });
      res.status(201).send(data);
    } catch (err) {}
  }
);

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
  .patch(
    optionalImageValidator,
    parseImage,
    async (req: Request, res: Response) => {
      let queryData = {
        ...req.body,
      };

      if (req.body.image) {
        const uniqueImageName = generateImageName(req.body.image.name);
        queryData = { ...queryData, image: uniqueImageName };
      }

      try {
        const data = await Recipe.findByIdAndUpdate(req.params.id, queryData);

        if (data && req.body.image) {
          const s3 = new aws.S3();
          const params: PutObjectRequest = {
            Bucket: S3_BUCKET,
            Key: queryData.image,
            Body: req.body.image ? req.body.image.data : null,
          };

          s3.upload(params, (err) => {
            if (err) {
              res.status(500).send({ err: ResError.s3Error });
              return;
            }
          });

          s3.deleteObject(
            {
              Bucket: S3_BUCKET,
              Key: data.image,
            },
            (err) => {
              if (err) {
                res.status(500).send({ err: ResError.s3Error });
                return;
              }
            }
          );
        }

        res.status(200).send(data);
      } catch {
        res.status(500).send({ err: ResError.serverError });
      }
    }
  )
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
        const params: DeleteObjectRequest = {
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
