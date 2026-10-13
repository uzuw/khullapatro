import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Nothing on this date.</h1>
      <p>This page does not exist.</p>
      <Link href="/" className="text-primary underline">
        Back to the calendar
      </Link>
    </div>
  );
}
