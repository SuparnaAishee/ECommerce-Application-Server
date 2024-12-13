const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedCoupons() {
  try {
    const coupons = [
      {
        code: "WELCOME10",
        discount: 10,
        discountType: "PERCENTAGE", // Use enums like "PERCENTAGE" or "FIXED"
        expiryDate: "2024-12-31",
        minimumOrderValue: 200,
        usageLimit: 100,
      },
      {
        code: "FIXED50",
        discount: 50,
        discountType: "FIXED", // Fixed discount value
        expiryDate: "2024-11-30",
        minimumOrderValue: 500,
        usageLimit: 50,
      },
    ];

    for (const coupon of coupons) {
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: coupon.code },
      });

      if (!existingCoupon) {
        await prisma.coupon.create({
          data: coupon,
        });
        console.log(`Coupon created: ${coupon.code}`);
      } else {
        console.log(`Coupon already exists: ${coupon.code}`);
      }
    }
  } catch (error) {
    console.error("Error seeding coupons:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCoupons();
