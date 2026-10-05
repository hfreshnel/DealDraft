import { useEffect, useState, type ReactNode } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { loadAllFonts } from "../fonts";

// Text layout is measured on the real fonts, so nothing renders before they are loaded.
export function FontGate({ children }: { children: ReactNode }) {
    const [handle] = useState(() => delayRender("Loading the film fonts"));
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let alive = true;
        loadAllFonts()
            .then(() => {
                if (alive) {
                    setReady(true);
                }
            })
            .catch((error: unknown) => {
                console.error("Font loading failed", error);
                cancelRender(error instanceof Error ? error : new Error(String(error)));
            });
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (ready) {
            continueRender(handle);
        }
    }, [ready, handle]);

    return ready ? <>{children}</> : null;
}
