const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "professional"], required: true },
  picture: { type: String, default: "" },
  videoUrl: { type: String, default: "" },
  headline: { type: String, default: "" },
  serviceType: {
    type: String,
    default: "",
    enum: [
      "Plumbing",
      "Tutoring",
      "Cleaning",
      "Electrical",
      "Carpentry",
      "Haircut",
      "Gardening",
      "Fashion Designing",
      "Moving",
      "Photography",
      "Catering",
      "Personal Training",
      "Accounting",
      "",
    ],
  },
  businessRegNumber: { type: String, default: "" },
  videoUrl: { type: String, default: "" },
  portfolio: [
    {
      title: { type: String, default: "" },
      image: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  ],
  links: {
    portfolio: { type: String, default: "" },
    socialMedia: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    email: { type: String, default: "" },
  },
  contact: {
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  ratings: [
    {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      score: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  averageRating: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Define comparePassword method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.pre("save", function (next) {
  if (this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
    this.averageRating = total / this.ratings.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

// Prevent model overwrite
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
