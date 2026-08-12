import dynamic from "next/dynamic";

// Next.js dynamic import ensures Leaflet is only loaded on the client-side
// because Leaflet relies on the `window` object which is not available during SSR.
const LiveMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <div className="text-center">
        <svg className="mx-auto h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-sm font-semibold">Loading Live Map...</p>
      </div>
    </div>
  ),
});

export default LiveMap;
