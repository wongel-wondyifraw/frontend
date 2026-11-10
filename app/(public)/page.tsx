import { Inter } from 'next/font/google';
import ChurchFeed from '@/views/LandingPage/ChurchFeed';
import { TENANT, PLATFORM } from '@/lib/tenant';
import { fetchLandingContent } from '@/lib/landing-server';
import { getImageUrl } from '@/lib/media-url';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const revalidate = 60;

export const metadata = {
  title: TENANT.name,
  description: `${TENANT.tagline} Managed with ${PLATFORM.name}.`,
};

export default async function LandingPage() {
  const content = await fetchLandingContent();
  const heroUrl = getImageUrl(content.hero?.image_url) || '';

  return (
    <div id="landing-page-root" className={`${inter.variable} ${inter.className}`}>
      {heroUrl ? (
        <link
          rel="preload"
          as="image"
          href={heroUrl}
          fetchPriority="high"
        />
      ) : null}
      <ChurchFeed initialContent={content} />
    </div>
  );
}
