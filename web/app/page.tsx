import { Calibration } from "../components/Calibration";
import { Deployment } from "../components/Deployment";
import { EvalResults } from "../components/EvalResults";
import { Guarantees } from "../components/Guarantees";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { ReplayDemo } from "../components/ReplayDemo";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function HomePage() {
    return (
        <>
            <SiteHeader />
            <main>
                <Hero />
                <HowItWorks />
                <ReplayDemo />
                <Guarantees />
                <EvalResults />
                <Calibration />
                <Deployment />
            </main>
            <SiteFooter />
        </>
    );
}
