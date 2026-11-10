export default function Spinner({ label = "Loading" }) {
  return (
    <div
      className="h-[30px] w-[30px] animate-spin rounded-full border-[3px] border-lit-blue-100 border-t-lit-blue motion-reduce:animate-none"
      role="status"
      aria-label={label}
    />
  );
}
