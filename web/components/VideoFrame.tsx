"use client";

import { useState } from "react";

const TITLE = "Démonstration de DealDraft en vidéo";

export function VideoFrame({ youtubeId }: { youtubeId: string }) {
    const [playing, setPlaying] = useState(false);

    if (!youtubeId) {
        return (
            <div className="video-frame video-empty" role="img" aria-label={TITLE}>
                <span className="play-icon" aria-hidden="true" />
                <span className="video-caption">Démonstration en vidéo, 2 minutes</span>
            </div>
        );
    }

    if (playing) {
        return (
            <div className="video-frame">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                    title={TITLE}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            </div>
        );
    }

    // The YouTube player loads only on demand: the page stays light and sets no third-party cookie before a click.
    return (
        <button type="button" className="video-frame video-poster" onClick={() => setPlaying(true)} aria-label={`Lire : ${TITLE}`}>
            <img src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`} alt="" loading="eager" />
            <span className="play-icon" aria-hidden="true" />
        </button>
    );
}
