import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createVendors() {
  try {
    const vendors = [
      // Electronics Vendors
      {
        id: "vendor-6",
        name: "Alpha Electronics",
        email: "alpha.electronics@example.com",
        password: "vendor123",
        shopName: "Alpha Electronics Hub",
        shopDetails:
          "Selling top-quality gadgets, home electronics, and accessories.",
        category: "Electronics",
      },
      {
        id: "vendor-7",
        name: "Smart Gadget Store",
        email: "smart.gadget@example.com",
        password: "vendor123",
        shopName: "Smart Gadget Store",
        shopDetails:
          "Specializing in the latest smartphones, laptops, and accessories.",
        category: "Electronics",
      },
      {
        id: "vendor-8",
        name: "Gizmo Galaxy",
        email: "gizmo.galaxy@example.com",
        password: "vendor123",
        shopName: "Gizmo Galaxy Electronics",
        shopDetails:
          "Wide selection of gadgets, smart home devices, and computers.",
        category: "Electronics",
      },

      // Beauty Vendors
      {
        id: "vendor-9",
        name: "Elegance Beauty Store",
        email: "elegance.beauty@example.com",
        password: "vendor123",
        shopName: "Elegance Beauty Emporium",
        shopDetails: "High-end cosmetics, skincare, and beauty accessories.",
        category: "Beauty",
      },
      {
        id: "vendor-10",
        name: "Luxe Cosmetics",
        email: "luxe.cosmetics@example.com",
        password: "vendor123",
        shopName: "Luxe Cosmetics Shop",
        shopDetails: "Luxury makeup and skincare products for all skin types.",
        category: "Beauty",
      },
      {
        id: "vendor-11",
        name: "Beauty Essentials",
        email: "beauty.essentials@example.com",
        password: "vendor123",
        shopName: "Beauty Essentials Store",
        shopDetails:
          "Providing essential beauty products, skincare, and wellness items.",
        category: "Beauty",
      },

      // Book Vendors
      {
        id: "vendor-12",
        name: "Literary Haven",
        email: "literary.haven@example.com",
        password: "vendor123",
        shopName: "Literary Haven Bookstore",
        shopDetails:
          "A paradise for book lovers with a wide variety of genres.",
        category: "Books",
      },
      {
        id: "vendor-13",
        name: "Book World",
        email: "book.world@example.com",
        password: "vendor123",
        shopName: "Book World",
        shopDetails: "Bringing you the bestsellers and timeless classics.",
        category: "Books",
      },
      {
        id: "vendor-14",
        name: "Novel Nook",
        email: "novel.nook@example.com",
        password: "vendor123",
        shopName: "Novel Nook Bookstore",
        shopDetails:
          "Explore the world of fiction and non-fiction at our bookstore.",
        category: "Books",
      },

      // Home Appliances Vendors
      {
        id: "vendor-15",
        name: "Appliance Central",
        email: "appliance.central@example.com",
        password: "vendor123",
        shopName: "Appliance Central",
        shopDetails:
          "A complete selection of home appliances for your comfort.",
        category: "Home Appliances",
      },
      {
        id: "vendor-16",
        name: "Smart Home Solutions",
        email: "smart.home@example.com",
        password: "vendor123",
        shopName: "Smart Home Solutions",
        shopDetails: "Innovative home appliances for modern living.",
        category: "Home Appliances",
      },
      {
        id: "vendor-17",
        name: "Home Essentials",
        email: "home.essentials@example.com",
        password: "vendor123",
        shopName: "Home Essentials",
        shopDetails: "Affordable home appliances for everyday needs.",
        category: "Home Appliances",
      },

      // Food & Groceries Vendors
      {
        id: "vendor-18",
        name: "Fresh Produce Mart",
        email: "fresh.produce@example.com",
        password: "vendor123",
        shopName: "Fresh Produce Mart",
        shopDetails:
          "Fresh fruits, vegetables, and organic foods for healthy living.",
        category: "Food & Groceries",
      },
      {
        id: "vendor-19",
        name: "Grocery King",
        email: "grocery.king@example.com",
        password: "vendor123",
        shopName: "Grocery King Market",
        shopDetails:
          "The best groceries, snacks, and beverages delivered to your door.",
        category: "Food & Groceries",
      },
      {
        id: "vendor-20",
        name: "Farm Fresh Grocers",
        email: "farm.fresh@example.com",
        password: "vendor123",
        shopName: "Farm Fresh Grocers",
        shopDetails: "Locally sourced fresh food, dairy, and organic produce.",
        category: "Food & Groceries",
      },
    ];

    for (const vendor of vendors) {
      // Hash the vendor's password
      const hashedPassword = await bcrypt.hash(vendor.password, 10);

      // Create the vendor user
      const user = await prisma.user.create({
        data: {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          password: hashedPassword,
          role: "VENDOR",
          isDeleted: false,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create the shop for the vendor
      await prisma.shop.create({
        data: {
          shopName: vendor.shopName,
          shopDetails: vendor.shopDetails,
          shopLogo: null,
          status: "ACTIVE",
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`Vendor and shop created for: ${vendor.name}`);
    }

    console.log("All vendors created successfully!");
  } catch (error) {
    console.error("Error creating vendors:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createVendors();
