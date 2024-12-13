"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("../modules/Auth/auth.route");
const user_route_1 = require("../modules/User/user.route");
const category_route_1 = require("../modules/Category/category.route");
const shop_route_1 = require("../modules/Shop/shop.route");
const product_route_1 = require("../modules/Product/product.route");
const cart_route_1 = require("../modules/Cart/cart.route");
const userShopFollow_route_1 = require("../modules/UserShopFollow/userShopFollow.route");
const order_route_1 = require("../modules/Order/order.route");
const payment_route_1 = require("../modules/payment/payment.route");
const review_route_1 = require("../modules/Review/review.route");
const coupon_route_1 = require("../modules/Coupon/coupon.route");
const flashSale_route_1 = require("../modules/FlashSale/flashSale.route");
const profile_route_1 = require("../modules/Profile/profile.route");
const comparison_route_1 = require("../modules/Comparison/comparison.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_route_1.authRoutes,
    },
    {
        path: "/users",
        route: user_route_1.userRoutes,
    },
    {
        path: "/categories",
        route: category_route_1.categoryRoutes,
    },
    {
        path: "/shops",
        route: shop_route_1.shopRoutes,
    },
    {
        path: "/products",
        route: product_route_1.productRoute,
    },
    {
        path: "/carts",
        route: cart_route_1.cartRoutes,
    },
    {
        path: "/follow-shop",
        route: userShopFollow_route_1.userShopFollowRoutes,
    },
    {
        path: "/orders",
        route: order_route_1.orderRoutes,
    },
    {
        path: "/payment",
        route: payment_route_1.paymentRoute,
    },
    {
        path: "/reviews",
        route: review_route_1.reviewRoutes,
    },
    {
        path: "/coupons",
        route: coupon_route_1.couponRoutes,
    },
    {
        path: "/flash-sales",
        route: flashSale_route_1.flashSaleRoutes,
    },
    {
        path: "/profile",
        route: profile_route_1.profileRoutes,
    },
    {
        path: "/comparisons",
        route: comparison_route_1.comparisonRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
