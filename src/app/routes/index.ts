import { Router } from "express";
import { authRoutes } from "../modules/Auth/auth.route";
import { userRoutes } from "../modules/User/user.route";
import { categoryRoutes } from "../modules/Category/category.route";
import { shopRoutes } from "../modules/Shop/shop.route";
import { productRoute } from "../modules/Product/product.route";
import { cartRoutes } from "../modules/Cart/cart.route";
import { userShopFollowRoutes } from "../modules/UserShopFollow/userShopFollow.route";
import { orderRoutes } from "../modules/Order/order.route";
import { paymentRoute } from "../modules/payment/payment.route";
import { reviewRoutes } from "../modules/Review/review.route";
import { couponRoutes } from "../modules/Coupon/coupon.route";
import { flashSaleRoutes } from "../modules/FlashSale/flashSale.route";
import { profileRoutes } from "../modules/Profile/profile.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/categories",
    route: categoryRoutes,
  },
  {
    path: "/shops",
    route: shopRoutes,
  },
  {
    path: "/products",
    route: productRoute,
  },
  {
    path: "/carts",
    route: cartRoutes,
  },
  {
    path: "/follow-shop",
    route: userShopFollowRoutes,
  },
  {
    path: "/orders",
    route: orderRoutes,
  },
  {
    path: "/payment",
    route: paymentRoute,
  },
  {
    path: "/reviews",
    route: reviewRoutes,
  },
  {
    path: "/coupons",
    route: couponRoutes,
  },
  {
    path: "/flash-sales",
    route: flashSaleRoutes,
  },
  {
    path: "/profile",
    route: profileRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
