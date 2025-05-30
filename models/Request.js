const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestSchema = new Schema(
  {
    // User who created the request
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Professional assigned to the request
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Service details
    category: {
      type: String,
      required: true,
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
      ],
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
    },

    // Location information
    location: {
      type: String,
      required: true,
      default: "Not specified",
    },
    addressDetails: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    responseTime: {
      // in hours
      type: Number,
      min: 0,
    },
    completedAt: Date,

    // Media
    images: [String],
    documents: [String],

    // Ratings and feedback
    customerRating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for optimized queries
requestSchema.index({ professionalId: 1, status: 1, createdAt: -1 }); // Dashboard queries
requestSchema.index({ category: "text", location: "text" }); // Search functionality
requestSchema.index({ userId: 1, status: 1 }); // User's requests
requestSchema.index({ createdAt: -1 }); // Recent requests
requestSchema.index({ price: 1 }); // Pricing queries

// Virtuals
requestSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

requestSchema.virtual("duration").get(function () {
  if (this.completedAt && this.createdAt) {
    const hours = Math.abs(this.completedAt - this.createdAt) / 36e5;
    return `${hours.toFixed(1)} hours`;
  }
  return null;
});

// Pre-save hooks
requestSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed") {
    this.completedAt = new Date();
    this.responseTime = Math.abs(this.completedAt - this.createdAt) / 36e5;
  }
  this.updatedAt = new Date();
  next();
});

// Static methods
requestSchema.statics.findByProfessional = function (professionalId, status) {
  return this.find({ professionalId, ...(status && { status }) })
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });
};

requestSchema.statics.searchServices = function (query) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
};

// Instance methods
requestSchema.methods.getStatusInfo = function () {
  const statusMap = {
    pending: { color: "warning", icon: "⏳" },
    active: { color: "info", icon: "🛠️" },
    completed: { color: "success", icon: "✅" },
    cancelled: { color: "danger", icon: "❌" },
  };
  return statusMap[this.status] || { color: "secondary", icon: "❓" };
};

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
