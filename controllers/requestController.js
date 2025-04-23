const Request = require("../models/Request");

exports.createRequest = async (req, res) => {
  const { category, description } = req.body;
  try {
    const request = new Request({
      userId: req.user.id,
      category,
      description,
    });
    await request.save();
    res.status(201).json({ message: "Request created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [
        { userId: req.user.id },
        { status: "open" },
        { professionalId: req.user.id },
      ],
    })
      .populate("userId", "name email")
      .populate("professionalId", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "open") {
      return res.status(400).json({ message: "Request already responded to" });
    }
    if (req.user.role !== "professional") {
      return res
        .status(403)
        .json({ message: "Only professionals can respond" });
    }
    request.status = "accepted";
    request.professionalId = req.user.id;
    await request.save();
    res.json({ message: "Request accepted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
