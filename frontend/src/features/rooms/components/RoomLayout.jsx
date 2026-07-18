export default function RoomLayout({
  navbar,
  modal,
  leftSidebar,
  workspace,
  bottomPanel,
  rightSidebar,
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {navbar}
      {modal}
      <div className="flex min-h-0 flex-1 overflow-hidden border-t border-slate-800">
        {leftSidebar}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-950">
          {workspace}
          {bottomPanel}
        </main>
        {rightSidebar}
      </div>
    </div>
  );
}
