import './globals.css';

export const metadata = {
  title: 'Argus Dashboard',
  description: 'Bitcoin DeFi Leaderboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-body">{children}</body>
    </html>
  );
}
