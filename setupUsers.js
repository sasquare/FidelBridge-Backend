const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/serviceHub", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));

const User = require("./models/User");

async function setupUsers() {
  try {
    // Set role: "customer", picture: "", videoUrl: "" for users without role
    const updateResult = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: "customer", picture: "", videoUrl: "" } }
    );
    console.log(`Updated ${updateResult.modifiedCount} users to customer`);

    // Set role: "professional" for professional@example.com
    const professionalResult = await User.updateOne(
      { email: "professional@example.com" },
      { $set: { role: "professional" } }
    );
    console.log(
      `Updated professional user: ${professionalResult.modifiedCount} modified`
    );

    // Check results
    const missingRole = await User.find({ role: { $exists: false } });
    console.log(`Users missing role (should be 0): ${missingRole.length}`);
    const professional = await User.findOne({
      email: "professional@example.com",
    });
    console.log(
      "Professional user:",
      professional
        ? { email: professional.email, role: professional.role }
        : "Not found"
    );
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.connection.close();
  }
}

setupUsers();
