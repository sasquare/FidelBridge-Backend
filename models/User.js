const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "professional"], required: true },
  picture: { type: String, default: "" }, // URL to uploaded image
  headline: { type: String, default: "" }, // Bio
  portfolio: [
    {
      title: { type: String, required: true },
      image: { type: String, required: true }, // URL to image
      description: { type: String, required: true },
    },
  ], // Up to 2 portfolio items
  links: {
    portfolio: { type: String, default: "" }, // Portfolio URL
    socialMedia: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    email: { type: String, default: "" }, // Public email
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

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Update average rating on save
userSchema.pre("save", function (next) {
  if (this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
    this.averageRating = total / this.ratings.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
