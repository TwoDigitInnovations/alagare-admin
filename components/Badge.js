export default function Badge({ children, variant = "default" }) {
  const styles = {
    default: "bg-[#f1f5f9] text-[#475569]",
    active: "bg-[#eaf5dd] text-[#4a6d00]",
    inactive: "bg-[#fee2e2] text-[#dc2626]",
    pending: "bg-[#fef3c7] text-[#d97706]",
    confirmed: "bg-[#eaf5dd] text-[#4a6d00]",
    cancelled: "bg-[#fee2e2] text-[#dc2626]",
    gold: "bg-[#fff7ed] text-[#f26522]",
    platinum: "bg-[#f0f9ff] text-[#0369a1]",
    silver: "bg-[#f8fafc] text-[#64748b]",
    standard: "bg-[#f1f5f9] text-[#64748b]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}
