import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className={`flex w-full max-h-[90vh] flex-col rounded-2xl bg-white shadow-xl animate-fade-in ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-base font-bold text-[#1e293b]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#f4f6f8]">
            <X size={18} className="text-[#64748b]" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
