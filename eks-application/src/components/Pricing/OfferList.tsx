const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 12 12" className="fill-current flex-shrink-0">
    <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
  </svg>
);

const crossIcon = (
  <svg width="14" height="14" viewBox="0 0 12 12" className="fill-current flex-shrink-0">
    <path d="M9.78 2.22A.75.75 0 008.72 2.22L6 4.94L3.28 2.22A.75.75 0 002.22 3.28L4.94 6L2.22 8.72A.75.75 0 003.28 9.78L6 7.06L8.72 9.78A.75.75 0 009.78 8.72L7.06 6L9.78 3.28A.75.75 0 009.78 2.22Z" />
  </svg>
);

const OfferList = ({
  text,
  status,
}: {
  text: string;
  status: "active" | "inactive";
}) => {
  return (
    <div className="flex items-start justify-start gap-3 w-full">
      <span
        className={`mt-0.5 flex h-6 w-6 min-w-[24px] items-center justify-center rounded-full ${
          status === "active"
            ? "bg-white/15 text-white border border-white/20 shadow-sm"
            : "bg-white/5 text-gray-500 border border-gray-600/40"
        }`}
      >
        {status === "active" ? checkIcon : crossIcon}
      </span>
      <p className="m-0 text-[15px] leading-relaxed text-white/92 font-medium flex-1 text-left">
        {text}
      </p>
    </div>
  );
};

export default OfferList;
