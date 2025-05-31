// setupUsers.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

// Avoid re-registering models if already registered
if (!mongoose.models.User) {
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    picture: String,
    videoUrl: String,
    isOnline: Boolean,
  });

  mongoose.model("User", userSchema);
}

// Safely get the User model
const User = mongoose.model("User");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/serviceHub", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    return setupUsers();
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });

// Async function to update users
async function setupUsers() {
  try {
    // 1. Update users without a role
    const updateResult = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: "customer", picture: "", videoUrl: "" } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} users to role 'customer'`);

    // 2. Update specific user to professional
    const professionalResult = await User.updateOne(
      { email: "professional@example.com" },
      { $set: { role: "professional" } }
    );
    console.log(
      `✅ Updated 'professional@example.com' to role 'professional' (${professionalResult.modifiedCount} modified)`
    );

    // 3. Confirm no missing roles
    const missingRole = await User.find({ role: { $exists: false } });
    console.log(`🔍 Users missing role (should be 0): ${missingRole.length}`);

    const professional = await User.findOne({
      email: "professional@example.com",
    });
    console.log(
      "👤 Professional user:",
      professional
        ? { email: professional.email, role: professional.role }
        : "Not found"
    );
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    mongoose.connection.close(() => {
      console.log("🔌 MongoDB connection closed");
    });
  }
}
