function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let roomCode = "";

  for (let i = 0; i < length; i++) {
    roomCode += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return roomCode;
}

module.exports = generateRoomCode;