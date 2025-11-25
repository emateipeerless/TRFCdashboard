import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Topbar() {
  const { user, signOut } = useAuthenticator(c => [c.user]);
  const email = user?.signInDetails?.loginId || 'user';

  return (
    <header className="topbar2">
      <h1>Turf Connect Dashboard</h1>
      <div className="grow" />
      <div className="user-pill">
        <span>{email}</span>
        <button onClick={signOut}>Sign out</button>
      </div>
    </header>
  );
}