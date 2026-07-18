import Toolbar from "./Toolbar";

export default function TopNavbar({
  language,
  setLanguage,
  onRun,
  roomCode,
  isRunning,
  onLeaveRoom,
  onOpenSettings,
}) {
  return (
    <Toolbar
      language={language}
      setLanguage={setLanguage}
      onRun={onRun}
      roomCode={roomCode}
      isRunning={isRunning}
      onLeaveRoom={onLeaveRoom}
      onOpenSettings={onOpenSettings}
    />
  );
}
