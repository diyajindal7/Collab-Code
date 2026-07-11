import { useParticipants } from "../context/ParticipantsContext";

export default function Participants() {

  const { participants } = useParticipants();

  return (
    <div className="bg-slate-900 h-full p-4 text-white">

      <h2 className="text-xl font-bold mb-4">
        Participants ({participants.length})
      </h2>

      <div className="space-y-3">

        {participants.map((user) => (

          <div
            key={user.id}
            className="flex items-center gap-2"
          >

            <span className="text-green-400">
              🟢
            </span>

            <span>
              {user.name}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}