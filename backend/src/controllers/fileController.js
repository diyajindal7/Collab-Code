const FileNode = require("../models/FileNode");
const Room = require("../models/Room");

const buildTree = (nodes, parent = null) =>
  nodes
    .filter((node) => String(node.parent || "") === String(parent || ""))
    .map((node) => ({
      _id: node._id,
      id: node._id,
      name: node.name,
      type: node.type,
      parent: node.parent,
      content: node.content,
      language: node.language,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      expanded: true,
      children: buildTree(nodes, node._id),
    }));

const getRoom = async (roomCode) => Room.findOne({ roomCode });

const getTree = async (req, res) => {
  try {
    const room = await getRoom(req.params.roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const files = await FileNode.find({ room: room._id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      files: buildTree(files),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const createFile = async (req, res) => {
  try {
    const { name, parent, language } = req.body;
    const room = await getRoom(req.params.roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const file = await FileNode.create({
      room: room._id,
      name,
      type: "file",
      parent: parent || null,
      language: language || room.language,
      content: "",
    });

    res.status(201).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const room = await getRoom(req.params.roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const folder = await FileNode.create({
      room: room._id,
      name,
      type: "folder",
      parent: parent || null,
    });

    res.status(201).json({
      success: true,
      folder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const renameItem = async (req, res) => {
  try {
    const file = await FileNode.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const collectChildren = async (itemId) => {
  const children = await FileNode.find({ parent: itemId });
  const ids = [itemId];

  for (const child of children) {
    ids.push(...await collectChildren(child._id));
  }

  return ids;
};

const deleteItem = async (req, res) => {
  try {
    const ids = await collectChildren(req.params.id);

    await FileNode.deleteMany({
      _id: {
        $in: ids,
      },
    });

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateContent = async (req, res) => {
  try {
    const file = await FileNode.findByIdAndUpdate(
      req.params.id,
      {
        content: req.body.content,
        language: req.body.language,
      },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getTree,
  createFile,
  createFolder,
  renameItem,
  deleteItem,
  updateContent,
};
