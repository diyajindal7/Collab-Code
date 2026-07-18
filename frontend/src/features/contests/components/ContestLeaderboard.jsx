export default function ContestLeaderboard({ leaderboard }) {
  if (!leaderboard?.length) {
    return <div className="p-4 text-sm text-slate-400">Leaderboard is empty.</div>;
  }

  return (
    <div className="p-3 text-sm text-slate-300">
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-slate-950 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Participant</th>
              <th className="px-3 py-2">Solved</th>
              <th className="px-3 py-2">Penalty</th>
              <th className="px-3 py-2">Submissions</th>
              <th className="px-3 py-2">Last Submission</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row) => (
              <tr key={row.userId} className="border-t border-slate-800">
                <td className="px-3 py-2 font-semibold text-white">#{row.rank}</td>
                <td className="px-3 py-2">{row.participant}</td>
                <td className="px-3 py-2 text-emerald-400">{row.solved}</td>
                <td className="px-3 py-2">{row.penalty}</td>
                <td className="px-3 py-2">{row.submissions}</td>
                <td className="px-3 py-2 text-xs text-slate-400">
                  {row.lastSubmission ? new Date(row.lastSubmission).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
