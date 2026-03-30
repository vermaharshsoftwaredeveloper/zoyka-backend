const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Zoyka Backend API",
    version: "1.0.0",
    description:
      "API documentation for Zoyka ecommerce backend with email OTP auth, customer flows, and admin management APIs.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
    {
      url: "https://zoyka-backend.onrender.com",
      description: "Production Server",
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Outlets" },
    { name: "Products" },
    { name: "Reviews" },
    { name: "Addresses" },
    { name: "Wishlist" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Support" },
    { name: "Profile" },
    { name: "Banners" },
    { name: "Admin" },
    { name: "Admin Finance" },
    { name: "Admin Products" },
    { name: "Admin Outlets" },
    { name: "Admin Testimonials" },
    { name: "Admin Coupons" },
    { name: "Admin Banners" },
    { name: "Operations Manager" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid request body" },
          errors: {
            type: "array",
            items: { type: "string" },
            example: [],
          },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["name", "email", "mobile", "password"],
        properties: {
          name: { type: "string", example: "Ravi Kumar" },
          email: { type: "string", format: "email", example: "ravi@example.com" },
          mobile: { type: "string", example: "9876543210" },
          password: { type: "string", example: "Pass@1234" },
        },
      },
      CreateStaffRequest: {
        type: "object",
        required: ["name", "email", "mobile", "password", "role"],
        properties: {
          name: { type: "string", example: "New Manager" },
          email: { type: "string", format: "email", example: "manager@zoyka.com" },
          mobile: { type: "string", example: "9876543210" },
          password: { type: "string", example: "Manager@1234" },
          role: { type: "string", enum: ["ADMIN", "MANAGER"], example: "MANAGER" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email", example: "ravi@example.com" },
          otp: { type: "string", example: "123456" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ravi@example.com" },
          password: { type: "string", example: "Pass@1234" },
        },
      },
      ResendOtpRequest: {
        type: "object",
        required: ["email", "purpose"],
        properties: {
          email: { type: "string", format: "email", example: "ravi@example.com" },
          purpose: { type: "string", enum: ["SIGNUP", "LOGIN"], example: "LOGIN" },
        },
      },
      Outlet: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          key: { type: "string", example: "karigar" },
          name: { type: "string", example: "Karigar" },
          description: { type: "string", example: "Handmade artisan products" },
          imageUrl: { type: "string", format: "uri", nullable: true, example: "https://cdn.zoyka.in/outlets/karigar.jpg" },
        },
      },
      ProductImage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri", example: "https://cdn.zoyka.in/products/1.jpg" },
          sortOrder: { type: "integer", example: 0 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ProductCard: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Organic Turmeric Powder" },
          slug: { type: "string", example: "organic-turmeric-powder" },
          description: { type: "string", nullable: true },
          producerName: { type: "string", nullable: true, example: "Lakshmi Farmers Collective" },
          producerStory: { type: "string", nullable: true },
          district: { type: "string", example: "Warangal" },
          price: { type: "number", example: 149 },
          stock: { type: "integer", example: 45 },
          outlet: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              key: { type: "string", example: "kisansetu" },
              name: { type: "string", example: "Kisan Setu" },
            },
          },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductImage" },
          },
          averageRating: { type: "number", example: 4.6 },
          totalRatingsCount: { type: "integer", example: 12 },
        },
      },
      ReviewImage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri", example: "https://cdn.zoyka.in/reviews/1.jpg" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", nullable: true, example: "Very authentic and fresh." },
          wouldRecommend: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string", example: "Ravi Kumar" },
            },
          },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/ReviewImage" },
          },
        },
      },
      CreateReviewRequest: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { type: "integer", minimum: 1, maximum: 5, example: 4 },
          comment: { type: "string", example: "Great quality product." },
          wouldRecommend: { type: "boolean", example: true },
          images: {
            type: "array",
            items: { type: "string", format: "uri" },
            example: ["https://cdn.zoyka.in/reviews/abc.jpg"],
          },
        },
      },
      ContactUsRequest: {
        type: "object",
        required: ["name", "email", "phone", "message"],
        properties: {
          name: { type: "string", example: "Ravi Kumar" },
          email: { type: "string", format: "email", example: "ravi@example.com" },
          phone: { type: "string", example: "9876543210" },
          message: { type: "string", example: "Need help with product authenticity information." },
        },
      },
      BulkOrderInquiryRequest: {
        type: "object",
        required: ["fullName", "companyName", "email", "phoneNumber", "quantityRequired", "city", "state", "pincode"],
        properties: {
          fullName: { type: "string", example: "Sita Reddy" },
          companyName: { type: "string", example: "Nature Retail Pvt Ltd" },
          email: { type: "string", format: "email", example: "sita@natureretail.com" },
          phoneNumber: { type: "string", example: "9988776655" },
          quantityRequired: { type: "integer", example: 500 },
          city: { type: "string", example: "Hyderabad" },
          state: { type: "string", example: "Telangana" },
          pincode: { type: "string", example: "500001" },
          additionalDetails: { type: "string", example: "Need monthly repeat supply for 6 months" },
        },
      },
      PaymentDeliveryHelpRequest: {
        type: "object",
        required: ["referenceId", "additionalDetails"],
        properties: {
          referenceId: { type: "string", example: "ORD-123456 or TXN-889900" },
          additionalDetails: { type: "string", example: "Payment debited but order not visible in app" },
        },
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Ravi Kumar" },
          email: { type: "string", format: "email", example: "ravi@example.com" },
          mobile: { type: "string", example: "9876543210" },
          avatar: { type: "string", format: "uri", nullable: true },
          role: { type: "string", example: "USER" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Ravi K" },
          avatar: { type: "string", format: "uri", example: "https://cdn.zoyka.in/avatars/ravi.jpg" },
        },
      },
      Address: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["HOME", "WORK", "OTHER"] },
          isDefault: { type: "boolean", example: true },
          fullName: { type: "string", example: "Ravi Kumar" },
          phoneNumber: { type: "string", example: "9876543210" },
          line1: { type: "string", example: "H.No 2-12, Main Road" },
          line2: { type: "string", nullable: true, example: "Near Hanuman Temple" },
          landmark: { type: "string", nullable: true, example: "Bus stand" },
          district: { type: "string", example: "Warangal" },
          state: { type: "string", example: "Telangana" },
          pincode: { type: "string", example: "506001" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UpsertAddressRequest: {
        type: "object",
        required: ["fullName", "phoneNumber", "line1", "district", "state", "pincode"],
        properties: {
          type: { type: "string", enum: ["HOME", "WORK", "OTHER"], example: "HOME" },
          isDefault: { type: "boolean", example: true },
          fullName: { type: "string", example: "Ravi Kumar" },
          phoneNumber: { type: "string", example: "9876543210" },
          line1: { type: "string", example: "H.No 2-12, Main Road" },
          line2: { type: "string", example: "Near Hanuman Temple" },
          landmark: { type: "string", example: "Bus stand" },
          district: { type: "string", example: "Warangal" },
          state: { type: "string", example: "Telangana" },
          pincode: { type: "string", example: "506001" },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          quantity: { type: "integer", example: 2 },
          product: { $ref: "#/components/schemas/ProductCard" },
        },
      },
      Cart: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
          subtotal: { type: "number", example: 598 },
        },
      },
      AddCartItemRequest: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1, example: 1 },
        },
      },
      UpdateCartItemRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1, example: 3 },
        },
      },
      AddToWishlistRequest: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "string", format: "uuid" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
          },
          quantity: { type: "integer", example: 2 },
          unitPrice: { type: "number", example: 149 },
          totalAmount: { type: "number", example: 298 },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          product: { $ref: "#/components/schemas/ProductCard" },
          address: { $ref: "#/components/schemas/Address" },
          tracking: {
            type: "object",
            properties: {
              currentStatus: { type: "string", example: "PACKED" },
              availableStatuses: {
                type: "array",
                items: { type: "string" },
              },
              lastUpdatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      CheckoutRequest: {
        type: "object",
        required: ["addressId"],
        properties: {
          addressId: { type: "string", format: "uuid" },
          notes: { type: "string", example: "Please deliver in the evening" },
        },
      },
      AdminCreateProductRequest: {
        type: "object",
        required: ["outletId", "categoryId", "title", "slug", "district", "price"],
        properties: {
          outletId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid" },
          title: { type: "string", example: "Organic Turmeric Powder" },
          slug: { type: "string", example: "organic-turmeric-powder" },
          description: { type: "string", nullable: true },
          producerName: { type: "string", nullable: true, example: "Lakshmi Farmers Collective" },
          producerStory: { type: "string", nullable: true },
          district: { type: "string", example: "Warangal" },
          price: { type: "number", example: 149 },
          stock: { type: "integer", minimum: 0, example: 100 },
          images: {
            type: "array",
            items: { type: "string", format: "uri" },
            example: ["https://cdn.zoyka.in/products/turmeric-1.jpg"],
          },
          isActive: { type: "boolean", example: true },
        },
      },
      AdminUpdateProductRequest: {
        type: "object",
        properties: {
          outletId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid" },
          title: { type: "string" },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
          producerName: { type: "string", nullable: true },
          producerStory: { type: "string", nullable: true },
          district: { type: "string" },
          price: { type: "number" },
          stock: { type: "integer", minimum: 0 },
          images: {
            type: "array",
            items: { type: "string", format: "uri" },
          },
          isActive: { type: "boolean" },
        },
      },
      AdminCreateOutletRequest: {
        type: "object",
        required: ["key", "name"],
        properties: {
          key: { type: "string", example: "kisansetu" },
          name: { type: "string", example: "Kisan Setu" },
          description: { type: "string", nullable: true },
          imageUrl: { type: "string", format: "uri", nullable: true },
          isActive: { type: "boolean", example: true },
        },
      },
      AdminUpdateOutletRequest: {
        type: "object",
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          imageUrl: { type: "string", format: "uri", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      Testimonial: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          customerName: { type: "string", example: "Ravi Kumar" },
          customerImageUrl: { type: "string", format: "uri", nullable: true },
          reviewText: { type: "string", example: "Authentic products and fast delivery." },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          sortOrder: { type: "integer", example: 0 },
          isActive: { type: "boolean", example: true },
        },
      },
      DashboardOverviewCard: {
        type: "object",
        properties: {
          count: { type: "integer", example: 145 },
          amount: { type: "number", example: 45000.5 },
          changeFromYesterdayPercent: { type: "number", example: 12.5 },
        },
      },
      DashboardResponse: {
        type: "object",
        properties: {
          section1_overviewCards: {
            type: "object",
            properties: {
              todaysOrders: { $ref: "#/components/schemas/DashboardOverviewCard" },
              pendingQc: { $ref: "#/components/schemas/DashboardOverviewCard" },
              lowInventory: { $ref: "#/components/schemas/DashboardOverviewCard" },
              todaysRevenue: { $ref: "#/components/schemas/DashboardOverviewCard" },
              dispatchPending: { $ref: "#/components/schemas/DashboardOverviewCard" },
            },
          },
          section2_categorySalesTrend: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date", example: "2023-10-01" },
                categories: {
                  type: "object",
                  additionalProperties: { type: "number" },
                  example: { "Kisan Setu": 15000, "Karigar": 8000 },
                },
              },
            },
          },
          section3_regionPerformance: {
            type: "array",
            items: {
              type: "object",
              properties: {
                region: { type: "string", example: "Telangana" },
                revenue: { type: "number", example: 45000 },
                orderCount: { type: "integer", example: 120 },
              },
            },
          },
          section4_topProducts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                title: { type: "string", example: "Organic Turmeric Powder" },
                price: { type: "number", example: 149 },
                stock: { type: "integer", example: 45 },
                totalSold: { type: "integer", example: 350 },
              },
            },
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Spices" },
          slug: { type: "string", example: "spices" },
          description: { type: "string", nullable: true, example: "Fresh organic spices" },
          isActive: { type: "boolean", example: true },
          _count: {
            type: "object",
            properties: {
              products: { type: "integer", example: 12 },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AdminCreateTestimonialRequest: {
        type: "object",
        required: ["customerName", "reviewText", "rating"],
        properties: {
          customerName: { type: "string", example: "Ravi Kumar" },
          customerImageUrl: { type: "string", format: "uri", nullable: true },
          reviewText: { type: "string", example: "Authentic products and fast delivery." },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          sortOrder: { type: "integer", minimum: 0, example: 0 },
          isActive: { type: "boolean", example: true },
        },
      },
      AdminUpdateTestimonialRequest: {
        type: "object",
        properties: {
          customerName: { type: "string" },
          customerImageUrl: { type: "string", format: "uri", nullable: true },
          reviewText: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          sortOrder: { type: "integer", minimum: 0 },
          isActive: { type: "boolean" },
        },
      },
      Coupon: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string", example: "WELCOME10" },
          description: { type: "string", nullable: true },
          discountType: { type: "string", enum: ["PERCENTAGE", "FLAT"] },
          discountValue: { type: "number", example: 10 },
          minOrderAmount: { type: "number", nullable: true, example: 499 },
          maxDiscount: { type: "number", nullable: true, example: 100 },
          startsAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          usageLimit: { type: "integer", nullable: true, example: 5000 },
          usedCount: { type: "integer", example: 120 },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AdminCreateCouponRequest: {
        type: "object",
        required: ["code", "discountType", "discountValue"],
        properties: {
          code: { type: "string", example: "WELCOME10" },
          description: { type: "string", nullable: true },
          discountType: { type: "string", enum: ["PERCENTAGE", "FLAT"] },
          discountValue: { type: "number", example: 10 },
          minOrderAmount: { type: "number", nullable: true, example: 499 },
          maxDiscount: { type: "number", nullable: true, example: 100 },
          startsAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          usageLimit: { type: "integer", nullable: true, example: 5000 },
          isActive: { type: "boolean", example: true },
        },
      },
      AdminUpdateCouponRequest: {
        type: "object",
        properties: {
          code: { type: "string" },
          description: { type: "string", nullable: true },
          discountType: { type: "string", enum: ["PERCENTAGE", "FLAT"] },
          discountValue: { type: "number" },
          minOrderAmount: { type: "number", nullable: true },
          maxDiscount: { type: "number", nullable: true },
          startsAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          usageLimit: { type: "integer", nullable: true },
          usedCount: { type: "integer", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      Banner: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          imageUrl: { type: "string", format: "uri", example: "https://cdn.zoyka.in/banners/summer-sale.jpg" },
          link: { type: "string", format: "uri", nullable: true, example: "https://zoyka.in/products/organic-turmeric-powder" },
          sortOrder: { type: "integer", example: 0 },
          isActive: { type: "boolean", example: true },
        },
      },
      CreateCategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Handicrafts" },
          slug: { type: "string", example: "handicrafts" },
          description: { type: "string", example: "Local handmade crafts" },
        },
      },
      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Updated Spices" },
          slug: { type: "string", example: "updated-spices" },
          description: { type: "string", example: "Updated description here" },
        },
      },
      Region: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Warangal" },
          isActive: { type: "boolean", example: true },
          category: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string", example: "Handicrafts" }
            }
          },
          manager: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string", example: "Rahul Manager" },
              email: { type: "string", format: "email", example: "rahul@zoyka.com" },
            }
          },
          totalOutlets: { type: "integer", example: 15 },
          activeProducersCount: { type: "integer", example: 12 },
        },
      },
      CreateRegionRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Warangal" },
          managerId: { type: "string", format: "uuid", nullable: true, example: "123e4567-e89b-12d3-a456-426614174000" },
          categoryId: { type: "string", format: "uuid", nullable: true, example: "987e6543-e21b-12d3-a456-426614174000" },
        },
      },
      UpdateRegionRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "South Telangana" },
          managerId: { type: "string", format: "uuid", nullable: true },
          categoryId: { type: "string", format: "uuid", nullable: true },
        },
      },
      OperationalManager: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Rahul Manager" },
          email: { type: "string", format: "email", example: "rahul@zoyka.com" },
          mobile: { type: "string", example: "9876543210" },
          avatar: { type: "string", format: "uri", nullable: true },
          role: { type: "string", example: "MANAGER" },
          isEmailVerified: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          managedRegions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", example: "North Telangana" },
                isActive: { type: "boolean", example: true },
                _count: {
                  type: "object",
                  properties: {
                    outlets: { type: "integer", example: 3 }
                  }
                }
              }
            }
          }
        }
      },
      ProducerAdminView: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          key: { type: "string", example: "kisan-setu" },
          name: { type: "string", example: "Kisan Setu" },
          description: { type: "string", nullable: true, example: "Organic farming collective" },
          isActive: { type: "boolean", example: true },
          regionId: { type: "string", format: "uuid", nullable: true },
          ownerId: { type: "string", format: "uuid", nullable: true },
          region: {
            type: "object",
            nullable: true,
            properties: {
              name: { type: "string", example: "North Telangana" }
            }
          },
          owner: {
            type: "object",
            nullable: true,
            properties: {
              name: { type: "string", example: "Ramesh Farmer" },
              email: { type: "string", format: "email", example: "ramesh@producer.com" },
              mobile: { type: "string", example: "9876543210" }
            }
          },
          _count: {
            type: "object",
            properties: {
              products: { type: "integer", example: 45 }
            }
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AdminCreateBannerRequest: {
        type: "object",
        required: ["imageUrl"],
        properties: {
          imageUrl: { type: "string", format: "uri" },
          link: { type: "string", format: "uri", nullable: true },
          sortOrder: { type: "integer", minimum: 0, example: 0 },
          isActive: { type: "boolean", example: true },
        },
      },
      AdminUpdateBannerRequest: {
        type: "object",
        properties: {
          imageUrl: { type: "string", format: "uri" },
          link: { type: "string", format: "uri", nullable: true },
          sortOrder: { type: "integer", minimum: 0 },
          isActive: { type: "boolean" },
        },
      },
      CreateProducerRequest: {
        type: "object",
        required: ["key", "name"],
        properties: {
          key: { type: "string", example: "karigar-hub" },
          name: { type: "string", example: "Karigar Hub" },
          description: { type: "string", nullable: true, example: "Handcrafted wooden toys" },
          regionId: { type: "string", format: "uuid", nullable: true },
          ownerId: { type: "string", format: "uuid", nullable: true },
        },
      },
      UpdateProducerRequest: {
        type: "object",
        properties: {
          key: { type: "string", example: "karigar-hub-v2" },
          name: { type: "string", example: "Karigar Hub Premium" },
          description: { type: "string", nullable: true },
          regionId: { type: "string", format: "uuid", nullable: true },
          ownerId: { type: "string", format: "uuid", nullable: true },
        },
      },
    },
  },


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Server status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "Zoyka backend is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/create-staff": {
      post: {
        tags: ["Auth"],
        summary: "Create a new Admin or Manager (Requires ADMIN role)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStaffRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Staff account created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "MANAGER account created successfully." },
                  },
                },
              },
            },
          },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden - Requires ADMIN role", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Signup and send OTP to email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "OTP sent to your email for signup verification" },
                  },
                },
              },
            },
          },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/auth/signup/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify signup OTP and create active account session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Signup verified",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    {
                      type: "object",
                      properties: {
                        message: { type: "string", example: "Signup verification successful" },
                      },
                    },
                    { $ref: "#/components/schemas/AuthTokens" },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in directly with email and password to receive access tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Login successful" },
                    role: { type: "string", example: "SUPER_ADMIN" },
                    accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                    refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid email or password"
          },
          403: {
            description: "Email not verified. Complete signup verification first."
          },
          404: {
            description: "User not found"
          }
        },
      },
    },
    // "/api/auth/login/verify-otp": {
    //   post: {
    //     tags: ["Auth"],
    //     summary: "Verify login OTP and return tokens",
    //     requestBody: {
    //       required: true,
    //       content: {
    //         "application/json": {
    //           schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
    //         },
    //       },
    //     },
    //     responses: {
    //       200: {
    //         description: "Login successful",
    //         content: {
    //           "application/json": {
    //             schema: {
    //               allOf: [
    //                 {
    //                   type: "object",
    //                   properties: {
    //                     message: { type: "string", example: "Login successful" },
    //                   },
    //                 },
    //                 { $ref: "#/components/schemas/AuthTokens" },
    //               ],
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    "/api/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend OTP for signup or login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResendOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP resent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "OTP resent for login verification" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/outlets": {
      get: {
        tags: ["Outlets"],
        summary: "List active sub-outlets",
        responses: {
          200: {
            description: "Outlets list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Outlets fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Outlet" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List products with filters",
        parameters: [
          { name: "outletKey", in: "query", schema: { type: "string" }, example: "kisansetu" },
          { name: "district", in: "query", schema: { type: "string" }, example: "Warangal" },
          { name: "search", in: "query", schema: { type: "string" }, example: "turmeric" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
        ],
        responses: {
          200: {
            description: "Paginated products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Products fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductCard" },
                    },
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 12 },
                    total: { type: "integer", example: 48 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/bestsellers": {
      get: {
        tags: ["Products"],
        summary: "Get bestsellers for an outlet",
        parameters: [
          {
            name: "outletKey",
            in: "query",
            required: true,
            schema: { type: "string" },
            example: "kisansetu",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: {
            description: "Bestsellers list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Outlet bestsellers fetched successfully" },
                    data: {
                      type: "array",
                      items: {
                        allOf: [
                          { $ref: "#/components/schemas/ProductCard" },
                          {
                            type: "object",
                            properties: {
                              totalSoldQuantity: { type: "integer", example: 120 },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/top-picks": {
      get: {
        tags: ["Products"],
        summary: "Get personalized top picks for logged-in user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: {
            description: "Top picks list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Top picks fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProductCard" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/{productId}": {
      get: {
        tags: ["Products"],
        summary: "Get product details by id",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Product detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Product fetched successfully" },
                    data: {
                      allOf: [
                        { $ref: "#/components/schemas/ProductCard" },
                        {
                          type: "object",
                          properties: {
                            reviews: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Review" },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/{productId}/reviews": {
      get: {
        tags: ["Reviews"],
        summary: "List reviews for a product",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Reviews list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Reviews fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Review" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create review for product",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateReviewRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Review created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Review created successfully" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        rating: { type: "integer", example: 4 },
                        comment: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        images: {
                          type: "array",
                          items: { $ref: "#/components/schemas/ReviewImage" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/reviews/highlights": {
      get: {
        tags: ["Reviews"],
        summary: "Get best customer reviews and global review stats",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 6 },
          },
        ],
        responses: {
          200: {
            description: "Review highlights fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Customer review highlights fetched successfully" },
                    data: {
                      type: "object",
                      properties: {
                        stats: {
                          type: "object",
                          properties: {
                            totalReviewCount: { type: "integer", example: 2450 },
                            averageRating: { type: "number", example: 4.4 },
                            recommendPercentage: { type: "number", example: 91.3 },
                          },
                        },
                        bestReviews: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Review" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/addresses": {
      get: {
        tags: ["Addresses"],
        summary: "List user addresses",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Addresses list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Addresses fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Address" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Addresses"],
        summary: "Create new address",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpsertAddressRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Address created",
          },
        },
      },
    },
    "/api/addresses/{addressId}": {
      patch: {
        tags: ["Addresses"],
        summary: "Update address",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "addressId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpsertAddressRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Address updated",
          },
        },
      },
      delete: {
        tags: ["Addresses"],
        summary: "Delete address",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "addressId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Address deleted",
          },
        },
      },
    },
    "/api/wishlist": {
      get: {
        tags: ["Wishlist"],
        summary: "List wishlist items",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Wishlist fetched" },
        },
      },
      post: {
        tags: ["Wishlist"],
        summary: "Add product to wishlist",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddToWishlistRequest" },
            },
          },
        },
        responses: {
          201: { description: "Product added to wishlist" },
        },
      },
    },
    "/api/wishlist/{productId}": {
      delete: {
        tags: ["Wishlist"],
        summary: "Remove product from wishlist",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: { description: "Removed from wishlist" },
        },
      },
    },
    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get user cart",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Cart fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Cart fetched successfully" },
                    data: { $ref: "#/components/schemas/Cart" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddCartItemRequest" },
            },
          },
        },
        responses: {
          201: { description: "Item added" },
        },
      },
    },
    "/api/cart/items/{itemId}": {
      patch: {
        tags: ["Cart"],
        summary: "Update item quantity",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "itemId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCartItemRequest" },
            },
          },
        },
        responses: {
          200: { description: "Item updated" },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove cart item",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "itemId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: { description: "Item removed" },
        },
      },
    },
    "/api/cart/clear": {
      delete: {
        tags: ["Cart"],
        summary: "Clear cart",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Cart cleared" },
        },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List user orders",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Orders fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Orders fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Order" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/orders/checkout": {
      post: {
        tags: ["Orders"],
        summary: "Checkout cart as independent product orders",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckoutRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Checkout completed",
          },
        },
      },
    },
    "/api/orders/{orderId}": {
      get: {
        tags: ["Orders"],
        summary: "Get order details and tracking status",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orderId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Order fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Order fetched successfully" },
                    data: { $ref: "#/components/schemas/Order" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/contact-us": {
      post: {
        tags: ["Support"],
        summary: "Submit contact us form",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ContactUsRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Contact query submitted",
          },
        },
      },
    },
    "/api/bulk-order-inquiries": {
      post: {
        tags: ["Support"],
        summary: "Submit bulk order inquiry form",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkOrderInquiryRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Bulk inquiry submitted",
          },
        },
      },
    },
    "/api/payment-delivery-help": {
      post: {
        tags: ["Support"],
        summary: "Submit payment and delivery help request",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentDeliveryHelpRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Help request submitted",
          },
        },
      },
    },
    "/api/banners": {
      get: {
        tags: ["Banners"],
        summary: "List active banners for user app",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Banners fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Banners fetched successfully" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          imageUrl: { type: "string", format: "uri" },
                          link: { type: "string", format: "uri", nullable: true },
                          sortOrder: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/products": {
      get: {
        tags: ["Admin Products"],
        summary: "List products (read-only admin access)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Admin products fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Admin products fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/ProductCard" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/products/{productId}": {
      get: {
        tags: ["Admin Products"],
        summary: "Get product by id (read-only admin access)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Admin product fetched" },
        },
      },
    },
    "/api/admin/outlets": {
      get: {
        tags: ["Admin Outlets"],
        summary: "List outlets for admin management",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Admin outlets fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Admin outlets fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Outlet" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin Outlets"],
        summary: "Create outlet",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminCreateOutletRequest" },
            },
          },
        },
        responses: {
          201: { description: "Outlet created" },
        },
      },
    },
    "/api/admin/outlets/{outletId}": {
      get: {
        tags: ["Admin Outlets"],
        summary: "Get outlet by id for admin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "outletId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Outlet fetched" },
        },
      },
      patch: {
        tags: ["Admin Outlets"],
        summary: "Update outlet",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "outletId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUpdateOutletRequest" },
            },
          },
        },
        responses: {
          200: { description: "Outlet updated" },
        },
      },
      delete: {
        tags: ["Admin Outlets"],
        summary: "Soft delete outlet (set inactive)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "outletId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Outlet deleted" },
        },
      },
    },
    "/api/admin/testimonials": {
      get: {
        tags: ["Admin Testimonials"],
        summary: "List testimonials for admin management",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Admin testimonials fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Admin testimonials fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Testimonial" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin Testimonials"],
        summary: "Create testimonial",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminCreateTestimonialRequest" },
            },
          },
        },
        responses: {
          201: { description: "Testimonial created" },
        },
      },
    },
    "/api/admin/testimonials/{testimonialId}": {
      get: {
        tags: ["Admin Testimonials"],
        summary: "Get testimonial by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "testimonialId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Testimonial fetched" },
        },
      },
      patch: {
        tags: ["Admin Testimonials"],
        summary: "Update testimonial",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "testimonialId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUpdateTestimonialRequest" },
            },
          },
        },
        responses: {
          200: { description: "Testimonial updated" },
        },
      },
      delete: {
        tags: ["Admin Testimonials"],
        summary: "Delete testimonial",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "testimonialId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Testimonial deleted" },
        },
      },
    },
    "/api/admin/coupons": {
      get: {
        tags: ["Admin Coupons"],
        summary: "List coupons for admin management",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Admin coupons fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Admin coupons fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Coupon" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin Coupons"],
        summary: "Create coupon",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminCreateCouponRequest" },
            },
          },
        },
        responses: {
          201: { description: "Coupon created" },
        },
      },
    },
    "/api/admin/coupons/{couponId}": {
      get: {
        tags: ["Admin Coupons"],
        summary: "Get coupon by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "couponId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Coupon fetched" },
        },
      },
      patch: {
        tags: ["Admin Coupons"],
        summary: "Update coupon",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "couponId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUpdateCouponRequest" },
            },
          },
        },
        responses: {
          200: { description: "Coupon updated" },
        },
      },
      delete: {
        tags: ["Admin Coupons"],
        summary: "Delete coupon",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "couponId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Coupon deleted" },
        },
      },
    },
    "/api/admin/banners": {
      get: {
        tags: ["Admin Banners"],
        summary: "List banners for admin management",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Admin banners fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Admin banners fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Banner" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin Banners"],
        summary: "Create banner",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminCreateBannerRequest" },
            },
          },
        },
        responses: {
          201: { description: "Banner created" },
        },
      },
    },
    "/api/admin/banners/{bannerId}": {
      get: {
        tags: ["Admin Banners"],
        summary: "Get banner by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "bannerId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Banner fetched" },
        },
      },
      patch: {
        tags: ["Admin Banners"],
        summary: "Update banner",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "bannerId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUpdateBannerRequest" },
            },
          },
        },
        responses: {
          200: { description: "Banner updated" },
        },
      },
      delete: {
        tags: ["Admin Banners"],
        summary: "Delete banner",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "bannerId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Banner deleted" },
        },
      },
    },
    "/api/profile/me": {
      get: {
        tags: ["Profile"],
        summary: "Get logged-in user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile fetched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Profile fetched successfully" },
                    data: { $ref: "#/components/schemas/Profile" },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update full name or profile picture",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated",
          },
        },
      },
    },
    "/api/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Get admin dashboard analytics and aggregations",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "period",
            in: "query",
            schema: { type: "string", enum: ["HALF_YEARLY", "YEARLY"], default: "HALF_YEARLY" },
            description: "Time period for the section 2 category sales trend graph",
          },
        ],
        responses: {
          200: {
            description: "Dashboard metrics fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Admin dashboard metrics fetched successfully" },
                    data: { $ref: "#/components/schemas/DashboardResponse" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden - Requires ADMIN or MANAGER role", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/admin/categories": {
      get: {
        tags: ["Admin"],
        summary: "Get all categories (including inactive)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Categories fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCategoryRequest" } } },
        },
        responses: {
          201: {
            description: "Category created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Category created successfully" },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/categories/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a category",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateCategoryRequest" } } },
        },
        responses: {
          200: { description: "Category updated successfully" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a category (Fails if products are attached)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Category deleted successfully" },
          400: { description: "Cannot delete category with attached products" },
        },
      },
    },
    "/api/admin/categories/{id}/toggle-status": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle category active/inactive status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Category status toggled successfully" },
        },
      },
    },
    "/api/admin/regions": {
      get: {
        tags: ["Admin"],
        summary: "Get all regions with manager, category, and outlet counts",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
            description: "Filter regions by a specific Category ID",
          },
        ],
        responses: {
          200: {
            description: "Regions fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Region" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new region, assign manager and category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRegionRequest" } } },
        },
        responses: {
          201: {
            description: "Region created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Region created successfully" },
                    data: { $ref: "#/components/schemas/Region" },
                  },
                },
              },
            },
          },
          400: { description: "Bad Request" }
        },
      },
    },
    "/api/admin/regions/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a region (Rename or change Manager)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateRegionRequest" } } },
        },
        responses: {
          200: { description: "Region updated successfully" },
          400: { description: "Manager role validation failed" }
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a region (Fails if outlets are attached)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Region deleted successfully" },
          400: { description: "Cannot delete region with attached outlets" },
        },
      },
    },
    "/api/admin/regions/{id}/toggle-status": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle region active/inactive status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Region status toggled successfully" },
        },
      },
    },
    "/api/admin/staff/managers": {
      get: {
        tags: ["Admin"],
        summary: "Get list of all Operational Managers and their assigned regions",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Managers fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Operational Managers fetched successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/OperationalManager" }
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/outlets": {
      get: {
        tags: ["Admin"],
        summary: "Get all producers (outlets), optionally filter by region",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "regionId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
            description: "Filter producers by a specific Region ID",
          },
        ],
        responses: {
          200: {
            description: "Producers fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/ProducerAdminView" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new producer (outlet)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProducerRequest" } } },
        },
        responses: {
          201: {
            description: "Producer created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Producer created successfully" },
                    data: { $ref: "#/components/schemas/ProducerAdminView" },
                  },
                },
              },
            },
          },
          400: { description: "Bad Request (e.g., duplicate key or invalid owner role)" }
        },
      },
    },
    "/api/admin/outlets/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get a producer by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: {
            description: "Producer details fetched successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, data: { $ref: "#/components/schemas/ProducerAdminView" } } } } }
          },
          404: { description: "Producer not found" }
        }
      },
      patch: {
        tags: ["Admin"],
        summary: "Update a producer",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProducerRequest" } } },
        },
        responses: {
          200: { description: "Producer updated successfully" },
          400: { description: "Role validation failed or duplicate key" }
        },
      },
    },
    "/api/admin/outlets/{id}/toggle-status": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle producer active/inactive status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Producer status toggled successfully" },
        },
      },
    },
    "/api/admin/artisans": {
      get: {
        tags: ["Admin"],
        summary: "Get all artisans, filterable by category",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
            description: "Filter artisans by Category ID"
          },
        ],
        responses: {
          200: {
            description: "Artisans fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/ProducerAdminView" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new artisan (outlet)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProducerRequest" } } },
        },
        responses: {
          201: { description: "Artisan created successfully" },
          400: { description: "Bad Request (e.g., duplicate key or owner is not an ARTISAN)" }
        },
      },
    },
    "/api/admin/artisans/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get an artisan by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: {
            description: "Artisan details fetched successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, data: { $ref: "#/components/schemas/ProducerAdminView" } } } } }
          },
          404: { description: "Artisan not found" }
        }
      },
      patch: {
        tags: ["Admin"],
        summary: "Update an artisan",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProducerRequest" } } },
        },
        responses: {
          200: { description: "Artisan updated successfully" },
        },
      },
    },
    "/api/admin/artisans/{id}/toggle-status": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle artisan active/inactive status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Artisan status toggled successfully" },
        },
      },
    },
    "/api/admin/orders": {
      get: {
        tags: ["Admin"],
        summary: "Get paginated list of all orders with deep filtering and search",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by Order ID, User Name, or Product Name" },
          { name: "status", in: "query", schema: { type: "string", enum: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "regionId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "dateRange", in: "query", schema: { type: "string", enum: ["this_week", "this_month", "custom"] } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" }, description: "Required if dateRange=custom" },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" }, description: "Required if dateRange=custom" }
        ],
        responses: {
          200: { description: "Orders fetched successfully" }
        }
      }
    },
    "/api/admin/orders/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get full A-to-Z details of a specific order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Order details fetched successfully" },
          404: { description: "Order not found" }
        }
      }
    },

    "/api/ops/dashboard": {
      get: {
        tags: ["Operations Manager"],
        summary: "Get outlet operations dashboard stats",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "lowStockThreshold", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          200: { description: "Operations dashboard fetched successfully" }
        }
      }
    },
    "/api/ops/orders/new": {
      get: {
        tags: ["Operations Manager"],
        summary: "List new orders waiting for acceptance",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "New orders fetched successfully" }
        }
      }
    },
    "/api/ops/orders/{orderId}/decision": {
      patch: {
        tags: ["Operations Manager"],
        summary: "Accept or reject a newly placed order",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["ACCEPT", "REJECT"] },
                  reason: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Order decision applied successfully" }
        }
      }
    },
    "/api/ops/qc/pending": {
      get: {
        tags: ["Operations Manager"],
        summary: "List orders pending QC",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "QC pending orders fetched successfully" }
        }
      }
    },
    "/api/ops/orders/{orderId}/qc": {
      patch: {
        tags: ["Operations Manager"],
        summary: "Pass or fail QC for an order",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["PASS", "FAIL"] },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "QC decision applied successfully" }
        }
      }
    },
    "/api/ops/dispatch": {
      get: {
        tags: ["Operations Manager"],
        summary: "Get dispatch queues for packing and shipping",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "Dispatch queues fetched successfully" }
        }
      }
    },
    "/api/ops/returns": {
      get: {
        tags: ["Operations Manager"],
        summary: "List return-pending orders with return reason and latest feedback",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "Returns pending orders fetched successfully" }
        }
      }
    },
    "/api/ops/inventory/low-stock": {
      get: {
        tags: ["Operations Manager"],
        summary: "List low stock products for managed outlets",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "threshold", in: "query", schema: { type: "integer", default: 10 } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "Low stock products fetched successfully" }
        }
      }
    },
    "/api/ops/inventory/products/{productId}/stock": {
      patch: {
        tags: ["Operations Manager"],
        summary: "Update stock for a managed outlet product",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: {
                  mode: { type: "string", enum: ["SET", "INCREMENT"], default: "INCREMENT" },
                  quantity: { type: "integer", minimum: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Product stock updated successfully" }
        }
      }
    },
    "/api/ops/products": {
      get: {
        tags: ["Operations Manager"],
        summary: "List products in managed outlets",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "Outlet products fetched successfully" }
        }
      },
      post: {
        tags: ["Operations Manager"],
        summary: "Create a product for a managed outlet",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminCreateProductRequest" }
            }
          }
        },
        responses: {
          201: { description: "Outlet product created successfully" }
        }
      }
    },
    "/api/ops/products/{productId}": {
      get: {
        tags: ["Operations Manager"],
        summary: "Get a managed outlet product by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Outlet product fetched successfully" }
        }
      },
      patch: {
        tags: ["Operations Manager"],
        summary: "Update a product in managed outlets",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUpdateProductRequest" }
            }
          }
        },
        responses: {
          200: { description: "Outlet product updated successfully" }
        }
      },
      delete: {
        tags: ["Operations Manager"],
        summary: "Soft delete a product in managed outlets",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "outletId", in: "query", schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Outlet product deleted successfully" }
        }
      }
    },
    "/api/admin/finance/dashboard": {
      get: {
        tags: ["Admin Finance"],
        summary: "Get total revenue metrics and a filtered list of vendor payouts",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "vertical",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["FOOD", "ARTISAN", "FARM"] },
            description: "Filter the payouts list by specific vendor vertical"
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 }
          }
        ],
        responses: {
          200: {
            description: "Finance dashboard data fetched successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    revenueStats: {
                      totalRevenue: 150000,
                      foodRevenue: 75000,
                      artisanRevenue: 45000,
                      farmRevenue: 30000
                    },
                    payouts: {
                      data: [
                        {
                          payoutId: "uuid-string",
                          vendorName: "Rahul's Organic Farm",
                          ordersCount: 42,
                          grossAmount: 12000,
                          commission: 1200,
                          amount: 10800,
                          status: "PENDING",
                          date: "2026-03-27T10:00:00.000Z"
                        }
                      ],
                      meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized - Invalid or missing token" },
          403: { description: "Forbidden - Requires ADMIN or MANAGER role" }
        }
      }
    },
    "/api/admin/customers": {
      get: {
        tags: ["Admin"],
        summary: "Get customer dashboard stats and paginated list with dynamic Tiers",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by Name, Email, or Mobile" }
        ],
        responses: { 200: { description: "Customers fetched successfully" } }
      }
    },
    "/api/admin/customers/new": {
      get: {
        tags: ["Admin"],
        summary: "Get the 10 newest registered customers",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "New customers fetched successfully" } }
      }
    },
    "/api/admin/customers/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get full A-to-Z profile of a specific customer including their orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } }
        ],
        responses: { 200: { description: "Customer profile fetched successfully" } }
      }
    },
    "/api/admin/customers/{id}/verify": {
      patch: {
        tags: ["Admin"],
        summary: "Manually mark a customer's email as verified",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Customer verified successfully" } }
      }
    },
    "/api/admin/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Get 5-section analytics dashboard data with category and region filtering",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "regionId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } }
        ],
        responses: {
          200: {
            description: "Analytics fetched successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    cards: { totalOrders: 150, totalRevenue: 45000, conversionRate: 12.5, repeatRate: 35.2 },
                    revenueDistribution: [{ id: "FOOD", label: "Food Revenue", value: 15000 }],
                    inventoryTurnover: { totalUnitsSold: 300, totalCurrentStock: 1000, turnoverRate: 0.3 },
                    topOutlets: [{ name: "Organic Farms", revenue: 8000 }],
                    growthTrend: [{ month: "2026-01", FOOD: 5000, ARTISAN: 2000, FARM: 3000, total: 10000 }]
                  }
                }
              }
            }
          }
        }
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  },
};

export default openApiSpec;
