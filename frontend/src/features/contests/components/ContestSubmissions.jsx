export default function ContestSubmissions({ submissions }) {
  if (!submissions?.length) {
    return <div className="p-4 text-sm text-slate-400">No contest submissions yet.</div>;
  }

  return (
    <div className="p-3 text-sm text-slate-300">
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-slate-950 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Problem</th>
              <th className="px-3 py-2">Language</th>
              <th className="px-3 py-2">Verdict</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Memory</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission._id} className="border-t border-slate-800">
                <td className="px-3 py-2">{submission.problem?.title || "Problem"}</td>
                <td className="px-3 py-2">{submission.language}</td>
                <td
                  className={`px-3 py-2 font-medium ${
                    submission.verdict === "Accepted" ? "text-emerald-400" : "text-amber-300"
                  }`}
                >
                  {submission.verdict}
                </td>
                <td className="px-3 py-2">{submission.executionTime || 0}s</td>
                <td className="px-3 py-2">{submission.memory || 0} KB</td>
                <td className="px-3 py-2 text-xs text-slate-400">
                  {new Date(submission.submittedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
