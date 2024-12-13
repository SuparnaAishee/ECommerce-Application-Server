import { Request, Response } from "express";
import { wishlistService } from "./wishlist.service";

const addToWishlist = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const user = req.user;

  const wishlistItem = await wishlistService.addToWishlist(user, productId);
  res.status(201).json({ message: "Product added to wishlist", wishlistItem });
};

const getWishlist = async (req: Request, res: Response) => {
  const user = req.user;

  const wishlist = await wishlistService.getWishlistByUser(user);
  res.status(200).json({ wishlist });
};

const removeFromWishlist = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const user = req.user;

  await wishlistService.removeFromWishlist(user, productId);
  res.status(200).json({ message: "Product removed from wishlist" });
};

export const wishlistController = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
