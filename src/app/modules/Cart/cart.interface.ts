export interface IUpdateCartProduct {
  productId: string;
  type: "increment" | "decrement";
  quantity: number;
}
