import Leaderboard from '../components/Leaderboard';

// Next.js Route Segment Config: Revalidate page every 5 seconds!
export const revalidate = 5;

export default function Home() {
  return (
    <main>
      <Leaderboard />
    </main>
  );
}
