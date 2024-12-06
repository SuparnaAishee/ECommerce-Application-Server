import { z } from "zod";

const createReview = z.object({
  body: z.object({
    rating: z.number({ required_error: "Rating is required" }),
    comment: z.string({ required_error: "Comment is required" }),
  }),
});

export const reviewValidation = {
  createReview,
};
