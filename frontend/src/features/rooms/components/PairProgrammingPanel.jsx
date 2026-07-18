import { useEffect, useMemo, useState } from "react";
import socket from "@/features/editor/socket";
import { Button } from "@/components/ui/button";
import { useParticipants } from "../context/ParticipantsContext";

const getUserId = (user) => user?._id || user?.id || user?.userId;

const formatDuration = (startedAt) => {
  if (!startedAt) return "00:00";

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  );
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function PairProgrammingPanel({
  roomCode,
  isOwner,
  pairState,
  setPairState,
}) {
  const { participants } = useParticipants();
  const [duration, setDuration] = useState(() =>
    formatDuration(pairState?.startedAt)
  );
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const userId = getUserId(user);
  const driverId = pairState?.driver?.toString();
  const navigatorId = pairState?.navigator?.toString();
  const pendingRequesterId =
    pairState?.pendingControlRequest?.from?.toString?.() ||
    pairState?.pendingControlRequest?.from;
  const isDriver = userId?.toString() === driverId;
  const isNavigator = pairState?.enabled && !isDriver;
  const mutedParticipants = pairState?.mutedParticipants || [];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDuration(formatDuration(pairState?.startedAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [pairState?.startedAt]);

  useEffect(() => {
    const handlePairState = (state) => {
      setPairState(state);
    };
    const handlePresence = ({ userId: presenceUserId, status }) => {
      setPairState((currentState) => ({
        ...currentState,
        presence: {
          ...(currentState?.presence || {}),
          [presenceUserId]: status,
        },
      }));
    };

    socket.on("pair:state", handlePairState);
    socket.on("pair:presence", handlePresence);

    return () => {
      socket.off("pair:state", handlePairState);
      socket.off("pair:presence", handlePresence);
    };
  }, [setPairState]);

  const emitPairEvent = (event, payload = {}) => {
    socket.emit(event, {
      roomCode,
      ...payload,
    });
  };

  const getParticipantName = (participantId) => {
    const participant = participants.find(
      (currentParticipant) =>
        currentParticipant.userId?.toString() === participantId?.toString() ||
        currentParticipant.id?.toString() === participantId?.toString() ||
        currentParticipant._id?.toString() === participantId?.toString()
    );

    return participant?.name || participant?.username || "Unassigned";
  };

  return (
    <div className="border-b border-slate-700 bg-slate-950 px-5 py-3 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Pair Programming
          </h2>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-300">
            <span>Status: {pairState?.enabled ? "Enabled" : "Disabled"}</span>
            <span>Driver: {getParticipantName(driverId)}</span>
            <span>Navigator: {getParticipantName(navigatorId)}</span>
            <span>Duration: {duration}</span>
            <span>Control: {isDriver ? "You are driver" : "Read only"}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  emitPairEvent("pair:toggle", {
                    enabled: !pairState?.enabled,
                  })
                }
              >
                {pairState?.enabled ? "Disable Pair" : "Enable Pair"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  emitPairEvent("pair:permissions:update", {
                    permissions: {
                      locked: !pairState?.locked,
                    },
                  })
                }
              >
                {pairState?.locked ? "Unlock Mode" : "Lock Mode"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  emitPairEvent("pair:permissions:update", {
                    permissions: {
                      restrictEditing: !pairState?.restrictEditing,
                    },
                  })
                }
              >
                {pairState?.restrictEditing ? "Allow All Edits" : "Restrict Edits"}
              </Button>
            </>
          )}

          {pairState?.enabled && isNavigator && (
            <Button
              variant="secondary"
              disabled={Boolean(pendingRequesterId)}
              onClick={() => emitPairEvent("pair:request-control")}
            >
              Request Control
            </Button>
          )}

          {isDriver && pendingRequesterId && (
            <>
              <Button
                onClick={() =>
                  emitPairEvent("pair:respond-control", {
                    accepted: true,
                  })
                }
              >
                Accept Control
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  emitPairEvent("pair:respond-control", {
                    accepted: false,
                  })
                }
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {participants.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {participants.map((participant) => {
            const participantUserId =
              participant.userId || participant._id || participant.id;
            const isMuted = mutedParticipants.some(
              (participantId) =>
                participantId?.toString() === participantUserId?.toString()
            );
            const isFollowing =
              pairState?.followTarget?.toString() ===
              participantUserId?.toString();

            return (
              <div
                key={participant.id}
                className="flex flex-wrap gap-2 rounded border border-slate-800 bg-slate-900 p-2"
              >
                <span className="self-center px-1 text-slate-300">
                  {participant.name || "Participant"}
                </span>
                {isOwner && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      emitPairEvent("pair:assign-roles", {
                        driver: participantUserId,
                        navigator: driverId || null,
                      })
                    }
                  >
                    Make Driver
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() =>
                    emitPairEvent("pair:follow-target", {
                      targetUserId: isFollowing ? "" : participantUserId,
                    })
                  }
                >
                  {isFollowing ? "Stop Following" : "Follow"}
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        emitPairEvent("room:mute-participant", {
                          targetUserId: participantUserId,
                          muted: !isMuted,
                        })
                      }
                    >
                      {isMuted ? "Unmute" : "Mute"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        emitPairEvent("room:transfer-owner", {
                          targetUserId: participantUserId,
                        })
                      }
                    >
                      Transfer Owner
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        emitPairEvent("room:remove-participant", {
                          targetUserId: participantUserId,
                        })
                      }
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pairState?.enabled && (
        <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
          {Object.entries(pairState?.presence || {}).map(
            ([presenceUserId, status]) => (
              <div
                key={presenceUserId}
                className="rounded border border-slate-800 bg-slate-900 px-3 py-2"
              >
                <span className="font-medium text-slate-200">
                  {status.user?.name || getParticipantName(presenceUserId)}
                </span>{" "}
                is {status.activity || "viewing"}
                {status.currentFileName ? ` ${status.currentFileName}` : ""}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
