import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VenueSection from "@/components/VenueSection";
import TournamentSection from "@/components/TournamentSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import GallerySection from "@/components/GallerySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <VenueSection />
        <TournamentSection />
        <LeaderboardSection />
        <GallerySection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
