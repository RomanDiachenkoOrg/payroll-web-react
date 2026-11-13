import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>
        The page you are looking for does not exist. <Link to="/">Back to the dashboard</Link>.
      </p>
    </div>
  );
}
