export default function PageLoader() {
  return (
    <div className="flex-1 flex flex-col h-full items-center justify-center bg-[#f8f9fc] min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-secondary animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
