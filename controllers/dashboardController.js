const Request = require("../models/Request");

exports.getMetrics = async (req, res) => {
  try {
    const { status, dateRange = "7d" } = req.query;
    const userId = req.user.id;

    const dateFilter = getDateFilter(dateRange);

    const matchStage = {
      professionalId: userId,
      ...(status && status !== "all" ? { status } : {}),
      ...dateFilter,
    };

    const metrics = await Request.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          requestsToday: { $sum: 1 },
          avgResponse: { $avg: "$responseTime" },
          completedJobs: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          earnings: { $sum: "$price" },
        },
      },
      {
        $project: {
          _id: 0,
          requestsToday: 1,
          avgResponse: { $round: ["$avgResponse", 1] },
          completedJobs: 1,
          earnings: 1,
        },
      },
    ]);

    res.json(
      metrics[0] || {
        requestsToday: 0,
        avgResponse: 0,
        completedJobs: 0,
        earnings: 0,
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { status, dateRange = "7d", searchQuery } = req.query;
    const userId = req.user.id;

    const query = {
      professionalId: userId,
      ...(status && status !== "all" ? { status } : {}),
      ...getDateFilter(dateRange),
    };

    if (searchQuery) {
      query.$or = [
        { category: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const requests = await Request.find(query)
      .populate("client", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function
function getDateFilter(range) {
  const date = new Date();
  switch (range) {
    case "24h":
      date.setHours(date.getHours() - 24);
      return { createdAt: { $gte: date } };
    case "7d":
      date.setDate(date.getDate() - 7);
      return { createdAt: { $gte: date } };
    case "30d":
      date.setDate(date.getDate() - 30);
      return { createdAt: { $gte: date } };
    default:
      return {};
  }
}
