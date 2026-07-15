import { useMemo, useRef } from "react";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const DEFAULT_CONFIG = {
  readonly: false,
  height: 420,
  toolbarSticky: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  buttons: [
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "|",
    "ul",
    "ol",
    "|",
    "font",
    "fontsize",
    "brush",
    "paragraph",
    "|",
    "align",
    "|",
    "link",
    "hr",
    "|",
    "undo",
    "redo",
    "|",
    "fullsize",
    "source",
  ],
  removeButtons: ["image", "video", "file"],
  showXPathInStatusbar: false,
  style: {
    fontFamily: "inherit",
  },
};

export default function ContentEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      placeholder: placeholder || "Write content here...",
    }),
    [placeholder],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e8f0]">
      <JoditEditor
        ref={editorRef}
        value={value || ""}
        config={config}
        onBlur={(newContent) => onChange?.(newContent)}
        onChange={() => {}}
      />
    </div>
  );
}
