import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createProducts() {
  try {
    // List of products to add to each category and shop
    const products = [
      //Electronics Products
        {
          name: "4K Ultra HD Smart TV",
          description:
            "A 55-inch 4K Ultra HD Smart TV with built-in Wi-Fi and streaming capabilities.",
          price: 499.99,
          inventory: 50,
          category: "Electronics",
          shop: "Rahim's Electronics Shop",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999266/images_vvzqfn.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999300/modern-curved-4k-ultrahd-tv_f1xpbk.jpg",
          ],
        },
        {
          name: "Wireless Bluetooth Headphones",
          description:
            "Noise-canceling Bluetooth headphones with a 20-hour battery life.",
          price: 89.99,
          inventory: 100,
          category: "Electronics",
          shop: "Alpha Electronics Hub",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999346/Hoco-ESD15-Wireless_zrr6zp.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999419/p9-bluetooth-headphones-stylish-wireless-gaming-headset-with-bt5-original-imahf4pmgrcm2tzz_n9mscp.jpg",
          ],
        },
        {
          name: "iPhone 15",
          description:
            "A sleek smartphone with a 6.5-inch display and high-quality camera.",
          price: 299.99,
          inventory: 80,
          category: "Electronics",
          shop: "Smart Gadget Store",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999507/images_rtfoci.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999524/IMG-10942145_9f7ece93-39fc-4310-a98d-9c11efa3a51e_ysjrfn.jpg",
          ],
        },
        {
          name: "Asus Gaming Laptop ",
          description:
            "A high-performance gaming laptop with NVIDIA RTX 3060, 16GB RAM, and 1TB SSD.",
          price: 1299.99,
          inventory: 25,
          category: "Electronics",
          shop: "Smart Gadget Store",
          isFlashSale: true,
          discount_percentage: 20,
          sale_start_time: new Date("2024-12-01T10:00:00Z"),
          sale_end_time: new Date("2024-12-28T23:59:59Z"),
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734027860/gl504gm-scare-1-500x500_lqnj43.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734027916/81JICyZ9x9L._AC_UF894_1000_QL80__red7aq.jpg",
          ],
        },

        // Beauty Products
        {
          name: "Pond's Face Cream",
          description:
            "A rich face cream with anti-aging properties, perfect for dry skin.",
          price: 39.99,
          inventory: 200,
          category: "Beauty",
          shop: "Rokeya's Beauty Store",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999663/663a30b0ed5f1e199e546f67-pond-s-dry-skin-face-moisturizer_xzb8ed.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999677/face-cream-1024x683_yaogqv.jpg",
          ],
        },
        {
          name: "Hair Growth Serum",
          description:
            "A serum designed to promote natural hair growth and reduce hair loss.",
          price: 29.99,
          inventory: 150,
          category: "Beauty",
          shop: "Elegance Beauty Emporium",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999749/634d0dde688410521c5c6b12-ardorlove-hair-growth-serum-oil-ginger_rrxdfz.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999780/4c0cac96-7521-442a-950d-dcf87ab068db.893ab67b3ec21e14ff601b87aa2c9e22_jxahqr.jpg",
          ],
        },
        {
          name: "Luxury Perfume",
          description:
            "A premium fragrance for both men and women with floral and woody notes.",
          price: 99.99,
          inventory: 120,
          category: "Beauty",
          shop: "Luxe Cosmetics Shop",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999817/images_byygd6.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999837/ins-luxury-perfumes-test-yves-saint-laurent-libre-eau-de-parfum-intense-jjuliao-11627-0f453a0a35f34e169a30ba18cd57af65_x00kso.jpg",
          ],
        },

        // Books Products
        {
          name: "The Catcher in the Rye",
          description:
            "A classic novel by J.D. Salinger that delves into adolescent angst.",
          price: 15.99,
          inventory: 200,
          category: "Books",
          shop: "Tariq's Book Haven",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999920/1918_oqzcvc.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1733999927/images_pyi8ul.jpg",
          ],
        },
        {
          name: "The Great Gatsby",
          description:
            "A timeless classic by F. Scott Fitzgerald about the American Dream.",
          price: 12.99,
          inventory: 250,
          category: "Books",
          shop: "Literary Haven Bookstore",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000004/91dfa4fe-8659-46e8-9fa4-d74cda862d53_ai0uvg.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000066/images_nn3gxm.jpg",
          ],
        },
        {
          name: "To Kill a Mockingbird",
          description:
            "A Pulitzer Prize-winning novel by Harper Lee about racism and injustice.",
          price: 18.99,
          inventory: 150,
          category: "Books",
          shop: "Book World",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000116/images_ls7py5.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000102/Mockingbird_HERO_0_lncptq.jpg",
          ],
        },
        {
          name: "The Art of Coding",
          description:
            "A must-read book for aspiring developers, covering fundamentals to advanced programming concepts.",
          price: 29.99,
          inventory: 50,
          category: "Books",
          shop: "Book World",
          isFlashSale: true,
          discount_percentage: 30,
          sale_start_time: new Date("2024-12-12T10:00:00Z"),
          sale_end_time: new Date("2024-12-25T23:59:59Z"),
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028338/1699757031668_qqqn7a.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028234/719SYGJejmL._AC_UF1000_1000_QL80__srjgqo.jpg",
          ],
        },
        {
          name: "Mindful Eating",
          description:
            "A book that explores the science of mindful eating and how to build a healthy relationship with food.",
          price: 24.99,
          inventory: 30,
          category: "Books",
          shop: "Book World",
          isFlashSale: true,
          discount_percentage: 25,
          sale_start_time: new Date("2024-12-15T10:00:00Z"),
          sale_end_time: new Date("2024-12-25T23:59:59Z"),
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028640/7d136d62-aa3c-4348-8268-7399f77384cc_zgj9ww.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028645/images_rj3g1z.jpg",
          ],
        },

        {
          name: "Blender with Glass Jar",
          description:
            "A powerful 600W blender with a durable glass jar for smoothies and soups.",
          price: 49.99,
          inventory: 40,
          category: "Home Appliances",
          shop: "Nahar's Home Appliances",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000420/Blender-accessories-glass-jar-1.4L-silk-pink-blender-with-jar-making-smoothie_nbw2ew.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000429/5055dd6d6251-red-smoothie-blender-blending-fruits_mpym35.jpg",
          ],
        },
        {
          name: "Cordless Vacuum Cleaner",
          description:
            "A lightweight, cordless vacuum cleaner ideal for quick clean-ups and tight spaces.",
          price: 89.99,
          inventory: 50,
          category: "Home Appliances",
          shop: "Nahar's Home Appliances",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734000485/hoover-onepwr-blade-cordless-stick-vacuum-cleaner-lightweight-bh53310-1_yr20bs.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002509/images_ooqer1.jpg",
          ],
        },
        {
          name: "Electric Kettle",
          description:
            "A 1.7L electric kettle with automatic shut-off and boil-dry protection.",
          price: 29.99,
          inventory: 70,
          category: "Home Appliances",
          shop: "Nahar's Home Appliances",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002562/Exploring_The_Latest_Tea_Brewing_Techniques_with_Electric_Kettles_siojx7.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002548/Finding_Your_Perfect_Cup-_A_Guide_to_Choosing_the_Best_Electric_Kettle_for_You_aa782981-38f2-494a-98cd-931e0d11489b_n9bjnt.jpg",
          ],
        },

        // Products for "Appliance Central"

        {
          name: "Hand Mixer",
          description:
            "A 5-speed hand mixer with stainless steel beaters, ideal for baking.",
          price: 24.99,
          inventory: 85,
          category: "Home Appliances",
          shop: "Appliance Central",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002659/873299_Hand-Mixer-Red_iqfos7.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002677/d0caa038a43b041afcf9de6aa20c54c1_asd4qk.jpg",
          ],
        },
        {
          name: "Slow Cooker",
          description:
            "A 3.5L slow cooker with multiple heat settings for soups and stews.",
          price: 59.99,
          inventory: 45,
          category: "Home Appliances",
          shop: "Appliance Central",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002723/slowcookers-lowres-0430_jpxn99.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002730/images_xutauz.jpg",
          ],
        },

        // Products for "Home Essentials"
        {
          name: "Toaster Oven",
          description:
            "A compact 4-slice toaster oven with bake and broil functions.",
          price: 69.99,
          inventory: 35,
          category: "Home Appliances",
          shop: "Home Essentials",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002798/wechatimg5138-1659643929010_o7qchp.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002804/how-to-use-a-toaster-oven-1365458839-08b398e862dc4cf09a11287e807a45da_ad8vew.jpg",
          ],
        },
        {
          name: "Smart Air Purifier",
          description:
            "An advanced air purifier with real-time air quality monitoring and app control.",
          price: 249.99,
          inventory: 40,
          category: "Home Appliances",
          shop: "Home Essentials",
          isFlashSale: true,
          discount_percentage: 40,
          sale_start_time: new Date("2024-12-15T10:00:00Z"),
          sale_end_time: new Date("2024-12-30T23:59:59Z"),
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028030/coway-400s-airmega-smart-air-purifier-lifestyle_skbhbo.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028022/images_xruvkf.jpg",
          ],
        },

        // Food & Groceries Products
        {
          name: "Organic Tomatoes",
          description: "Fresh organic tomatoes, perfect for cooking and salads.",
          price: 3.99,
          inventory: 500,
          category: "Food & Groceries",
          shop: "Shafi's Grocery Store",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002886/tomatto_p97apm.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002895/81rgQt9ekjL_unpymi.jpg",
          ],
        },

        {
          name: "Whole Wheat Bread",
          description: "Freshly baked whole wheat bread for a healthy diet.",
          price: 2.99,
          inventory: 300,
          category: "Food & Groceries",
          shop: "Farm Fresh Grocers",
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002960/images_nvsg4c.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734002998/gardenia-high-fiber-wheat-bread-600g-thick-slice_sh3qcc.jpg",
          ],
        },
        {
          name: "Fresh Chicken",
          description:
            "Fresh chicken breasts, sourced locally from trusted farms.",
          price: 7.99,
          inventory: 150,
          category: "Food & Groceries",
          shop: "Grocery King Market",
          images: [
            "https://assets.tendercuts.in/product/C/H/a62a73e9-a7d5-4f79-86c1-9f6127e7026e.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734003056/a62a73e9-a7d5-4f79-86c1-9f6127e7026e_pblonf.webp",
          ],
        },
        {
          name: "Gourmet Chocolate Box",
          description:
            "A premium selection of handcrafted chocolates, perfect for gifting or self-indulgence.",
          price: 19.99,
          inventory: 100,
          category: "Food & Groceries",
          shop: "Shafi's Grocery Store",
          isFlashSale: true,
          discount_percentage: 27,
          sale_start_time: new Date("2025-01-01T10:00:00Z"),
          sale_end_time: new Date("2025-01-10T23:59:59Z"),
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028446/uma-caixa-de-chocolates-da-empresa-de-chocolate_512531-400_flcxhs.jpg",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028454/images_mn8szr.jpg",
          ],
        },
        {
          name: "Organic Snack Pack",
          description:
            "A selection of organic and gluten-free snacks for a healthy on-the-go lifestyle.",
          price: 14.99,
          inventory: 80,
          category: "Food & Groceries",
          shop: "Shafi's Grocery Store",
          isFlashSale: true,
          discount_percentage: 30,
          sale_start_time: new Date("2025-01-01T10:00:00Z"),
          sale_end_time: new Date("2025-01-15T23:59:59Z"),
          images: [
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028733/resize_zpnv6n.webp",
            "https://res.cloudinary.com/dwelabpll/image/upload/v1734028738/c86daa5c31081923f6a6e1201338f5ec_large_dz0r3e.png",
          ],
        },
      {
        name: "Gourmet Coffee Beans",
        description:
          "Premium Arabica coffee beans roasted to perfection for a rich and smooth flavor.",
        price: 19.99,
        inventory: 100,
        category: "Food & Groceries",
        shop: "Shafi's Grocery Store",
        images: [
          "https://res.cloudinary.com/dwelabpll/image/upload/v1734032773/1bean_edomyu.jpg",
          "https://res.cloudinary.com/dwelabpll/image/upload/v1734032766/images_wrccqa.jpg",
        ],
        isFlashSale: true,
        discount_percentage: 20,
        sale_start_time: new Date("2024-12-11T06:00:00Z"),
        sale_end_time: new Date("2024-12-26T23:00:00Z"),
      },
      {
        name: "Luxury Bedding Set",
        description:
          "A 4-piece luxury bedding set made with high-quality materials for ultimate comfort.",
        price: 129.99,
        inventory: 20,
        category: "Home Appliances",
        shop: "Home Essentials",
        images: [
          "https://res.cloudinary.com/dwelabpll/image/upload/v1734032950/P-PIFLO1_znes53.jpg",
          "https://res.cloudinary.com/dwelabpll/image/upload/v1734032956/71cp5JDLtjL._AC_UF894_1000_QL80__dw23f4.jpg",
        ],
        isFlashSale: true,
        discount_percentage: 35,
        sale_start_time: new Date("2024-12-13T10:00:00Z"),
        sale_end_time: new Date("2024-12-28T23:59:59Z"),
      },
      {
        name: "Ergonomic Office Chair",
        description:
          "Adjustable office chair with lumbar support and breathable mesh back.",
        price: 149.99,
        inventory: 25,
        category: "Home Appliances",
        shop: "Home Essentials",
        images: [
          "https://res.cloudinary.com/dwelabpll/image/upload/v1734033174/images_sl8vrg.jpg",
          "https://res.cloudinary.com/dwelabpll/image/upload/v1734033180/images_cs8exa.jpg",
        ],
        isFlashSale: true,
        discount_percentage: 20,
        sale_start_time: new Date("2024-12-15T09:00:00Z"),
        sale_end_time: new Date("2024-12-22T23:59:59Z"),
      },
    ];
    for (const product of products) {
      // Fetch category and shop IDs
      const category = await prisma.category.findFirst({
        where: { name: product.category },
      });

      const shop = await prisma.shop.findFirst({
        where: { shopName: product.shop },
      });

      if (!category || !shop) {
        console.log(`Category or Shop not found for ${product.name}`);
        continue;
      }

      // Check if the product already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: product.name,
          categoryId: category.id,
          shopId: shop.id,
        },
      });

      if (existingProduct) {
        // Update the product with new fields if it exists
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            isFlashSale: product.isFlashSale ?? false,
            discount_percentage: product.discount_percentage ?? null,
            sale_start_time: product.sale_start_time ?? null,
            sale_end_time: product.sale_end_time ?? null,
          },
        });
        console.log(`Product updated: ${product.name}`);
      } else {
        // Create the product
        await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            price: product.price,
            inventory: product.inventory,
            categoryId: category.id,
            shopId: shop.id,
            images: product.images,
            isFlashSale: product.isFlashSale ?? false,
            discount_percentage: product.discount_percentage ?? null,
            sale_start_time: product.sale_start_time ?? null,
            sale_end_time: product.sale_end_time ?? null,
          },
        });
        console.log(`Product created: ${product.name}`);
      }
    }

    console.log("All products processed successfully!");
  } catch (error) {
    console.error("Error creating products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createProducts();
