// // Import Prisma client
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// async function seedReviews() {
//   try {
//     const reviews = [
//       // Reviews for iPhone 15
//       {
//         rating: 5,
//         comment: "This phone is amazing! The camera quality is top-notch.",
//         userEmail: "user@example.com", // Arittra
//         productId: "916a76a8-a5e5-4523-9661-2fb99a87492a",
//       },
//       {
//         rating: 4,
//         comment: "Great performance, but I expected better battery life.",
//         userEmail: "aishee@example.com", // Aishee
//         productId: "916a76a8-a5e5-4523-9661-2fb99a87492a",
//       },
//       {
//         rating: 4,
//         comment: "Solid build and excellent display quality.",
//         userEmail: "ankita@example.com", // Ankita
//         productId: "916a76a8-a5e5-4523-9661-2fb99a87492a",
//       },

//       // Reviews for Asus Gaming Laptop
//       {
//         rating: 4,
//         comment: "Handles all my games smoothly, no lag at all.",
//         userEmail: "riyad@example.com", // Riyad
//         productId: "465cc103-1950-48ff-989f-80cb50792f9d",
//       },
//       {
//         rating: 5,
//         comment: "Excellent for both gaming and multitasking!",
//         userEmail: "tonmoy@example.com", // Tonmoy
//         productId: "465cc103-1950-48ff-989f-80cb50792f9d",
//       },
//       {
//         rating: 3,
//         comment: "Good laptop, but it gets hot during long gaming sessions.",
//         userEmail: "anu@example.com", // Anu
//         productId: "465cc103-1950-48ff-989f-80cb50792f9d",
//       },

//       // Reviews for Luxury Perfume
//       {
//         rating: 5,
//         comment: "The fragrance is absolutely divine. Long-lasting too!",
//         userEmail: "user@example.com", // Arittra
//         productId: "43df0bf9-c3af-4bb9-b32a-974ba0d3d317",
//       },
//       {
//         rating: 4,
//         comment: "Lovely scent, but the bottle design could be better.",
//         userEmail: "aishee@example.com", // Aishee
//         productId: "43df0bf9-c3af-4bb9-b32a-974ba0d3d317",
//       },

//       // Reviews for Ergonomic Office Chair
//       {
//         rating: 4,
//         comment: "Comfortable for long hours. Good lumbar support.",
//         userEmail: "ankita@example.com", // Ankita
//         productId: "f06dd2f7-1655-4f2b-a85d-1657f01d5e2d",
//       },
//       {
//         rating: 5,
//         comment: "The best office chair I’ve ever used!",
//         userEmail: "riyad@example.com", // Riyad
//         productId: "f06dd2f7-1655-4f2b-a85d-1657f01d5e2d",
//       },
//       {
//         rating: 4,
//         comment: "Good quality, though assembly instructions were confusing.",
//         userEmail: "tonmoy@example.com", // Tonmoy
//         productId: "f06dd2f7-1655-4f2b-a85d-1657f01d5e2d",
//       },
//     ];

//     for (const review of reviews) {
//       // Fetch the user
//       const user = await prisma.user.findUnique({
//         where: { email: review.userEmail },
//       });

//       if (!user) {
//         console.log(`User not found for review: ${review.comment}`);
//         continue;
//       }

//       // Check if the review already exists
//       const existingReview = await prisma.review.findUnique({
//         where: {
//           userId_productId: {
//             userId: user.id,
//             productId: review.productId,
//           },
//         },
//       });

//       if (existingReview) {
//         console.log(
//           `Review already exists for user: ${user.email}, product ID: ${review.productId}`
//         );
//         continue;
//       }

//       // Create a new review
//       await prisma.review.create({
//         data: {
//           rating: review.rating,
//           comment: review.comment,
//           userId: user.id,
//           productId: review.productId,
//         },
//       });

//       console.log(
//         `Review created for product ID: ${review.productId}, user: ${user.email}`
//       );
//     }

//     console.log("All reviews processed successfully!");
//   } catch (error) {
//     console.error("Error creating reviews:", error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// seedReviews();
