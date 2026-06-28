// Integration Testing Setup Example
// This file demonstrates how to set up an in-memory MongoDB server (e.g., mongodb-memory-server)
// for clean, isolated integration testing of Express routes and Mongoose models.

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export const setupTestDB = () => {
  beforeAll(async () => {
    // In a real test suite, you would initialize an in-memory MongoDB connection here:
    // const mongoServer = await MongoMemoryServer.create();
    // await mongoose.connect(mongoServer.getUri());
    
    // For this example, we log the setup hook:
    console.log("🛠️ Test database hook initialized");
  });

  afterEach(async () => {
    // Clear collections between tests to ensure isolation
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany();
      }
    }
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.disconnect();
  });
};
