const axios = require("axios");
const Execution = require("../models/Execution");
const Room = require("../models/Room");

const LANGUAGE_MAP = {
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
  python: 71,
};

const runCode = async (req, res) => {
  try {
    const { source_code, language, stdin, roomCode } = req.body;

    const language_id = LANGUAGE_MAP[language];

    if (!language_id) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language",
      });
    }

    const submission = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code,
        language_id,
        stdin: stdin || "",
      }
    );

    if (roomCode) {
      const room = await Room.findOne({ roomCode });

      if (room) {
        await Execution.create({
          room: room._id,
          user: req.user?.userId || null,
          language,
          code: source_code,
          stdin: stdin || "",
          stdout: submission.data.stdout || "",
          stderr: submission.data.stderr || "",
          compileOutput: submission.data.compile_output || "",
          executionTime: submission.data.time || "",
          memory: submission.data.memory ?? null,
          status: submission.data.status || null,
        });
      }
    }

    res.json(submission.data);

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Judge0 Error",
    });
  }
};

module.exports = { runCode };
