export interface IUpdateWishlistProduct {
  productId: string;
  type: "increment" | "decrement";
  quantity: number;
}
