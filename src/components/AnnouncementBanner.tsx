/**
 * Site-wide announcement set in Admin → Settings. Renders nothing unless the
 * announcement is switched on and has a message, so it costs nothing when off.
 */
export function AnnouncementBanner({
  enabled,
  message,
}: {
  enabled: boolean;
  message: string;
}) {
  if (!enabled || !message.trim()) return null;
  return (
    <div className="announcement" role="status">
      {message}
    </div>
  );
}
