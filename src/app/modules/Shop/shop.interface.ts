export interface IUpdateShopStatus {
  status: "ACTIVE" | "BLOCKED";
  shopId: string;
}
