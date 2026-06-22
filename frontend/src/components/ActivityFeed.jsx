import './ActivityFeed.css';

export default function ActivityFeed({ events = [] }) {
  if (!events.length) {
    return <p className="muted">No activity recorded yet.</p>;
  }

  return (
    <ul className="activity-feed">
      {events.map((event) => (
        <li key={event.id}>
          <div className="event-type">{event.event_type.replace(/_/g, ' ')}</div>
          <div>{event.description}</div>
          <div className="event-meta">
            {new Date(event.created_at).toLocaleString()}
            {event.role ? ` · ${event.role}` : ''}
          </div>
        </li>
      ))}
    </ul>
  );
}
