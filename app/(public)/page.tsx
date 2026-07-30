import ChurchFeed from '@/views/LandingPage/ChurchFeed';

export const metadata = {
  title: 'Shepherd.One — Church Management',
  description: 'Worship updates, Scripture, and weekend life for Grace Community Church.',
};

export default function LandingPage() {
  return <ChurchFeed />;
}
