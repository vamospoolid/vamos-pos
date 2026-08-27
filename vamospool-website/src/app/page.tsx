import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VenueSection from "@/components/VenueSection";
import TournamentSection from "@/components/TournamentSection";
import PlayerAppSection from "@/components/PlayerAppSection";
import CafeSection from "@/components/CafeSection";
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
        <PlayerAppSection />
        <CafeSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
