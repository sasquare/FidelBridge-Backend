const Message = require("../models/Message");

exports.sendMessage = async (req, res) => {
  const { recipientId, content } = req.body;
  try {
    const message = new Message({
      senderId: req.user.id,
      recipientId,
      content,
    });
    await message.save();
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    })
      .populate("senderId", "name email")
      .populate("recipientId", "name email")
      .sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
