const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth");

const {
  getTree,
  createFile,
  createFolder,
  renameItem,
  deleteItem,
  updateContent,
} = require("../controllers/fileController");

router.get("/:roomCode/tree", protect, getTree);
router.post("/:roomCode/file", protect, createFile);
router.post("/:roomCode/folder", protect, createFolder);
router.put("/:id/rename", protect, renameItem);
router.delete("/:id", protect, deleteItem);
router.put("/:id/content", protect, updateContent);

module.exports = router;
