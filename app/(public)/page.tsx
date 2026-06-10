import Navbar from '@/Components/Navbar/Navbar';
import HeroSection from '@/Components/HeroSection/HeroSection';
import Footer from '@/Components/Footer/Footer';
import '@/views/LandingPage/LandingPage.css';

export const metadata = {
  title: 'Shepherd.One — Church Management System',
  description: 'Streamline church operations, engage members, and grow ministries effectively.',
};

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <Footer />
    </div>
  );
}
