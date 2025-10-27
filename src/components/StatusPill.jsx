export default function StatusPill({ ok, text }) {
  return (
    <span className={`pill ${ok ? 'green' : 'red'}`}>{text}</span>
  );
}
