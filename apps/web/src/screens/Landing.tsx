// Landing screen. Visuals live in screens.css.
// Contract: render a hero and call onGetStarted / onGuest. Keep these props stable.
export function Landing({
  onGetStarted,
  onGuest,
}: {
  onGetStarted: () => void;
  onGuest: () => void;
}) {
  return (
    <main className="screen landing">
      {/* Faux-map backdrop: routes, a river and drifting pins behind the glass. */}
      <div className="landing-map" aria-hidden="true">
        <svg className="landing-map-svg" viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="np-river" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(66,133,156,0.55)" />
              <stop offset="1" stopColor="rgba(147,191,195,0.55)" />
            </linearGradient>
          </defs>
          <path className="lm-river" d="M-40 250 C 120 200, 160 360, 320 320 S 480 430, 460 520" />
          <path className="lm-route" d="M30 120 C 140 150, 180 250, 300 240" />
          <path className="lm-route" d="M80 560 C 180 540, 220 470, 360 500" />
          <path className="lm-route lm-route-faint" d="M-10 420 C 90 400, 150 480, 250 450" />
        </svg>
        <span className="lm-pin lm-pin-a">
          <PinGlyph />
        </span>
        <span className="lm-pin lm-pin-b">
          <PinGlyph />
        </span>
        <span className="lm-pin lm-pin-c">
          <PinGlyph />
        </span>
      </div>

      <div className="screen-card landing-card glass-panel">
        <span className="screen-badge screen-badge--brand">
          <img className="screen-badge-logo" src="/logo.svg" alt="Old Haunts" />
        </span>
        <h1 className="landing-title">
          History happens <em>where you're standing.</em>
        </h1>
        <p className="landing-lede">
          Walk up to a real place and hear its story — written for the person who
          made it famous and narrated in a voice, right where it happened. Then keep
          a sticker of every spot you unlock.
        </p>

        <ul className="landing-bullets">
          <li>
            <span className="lb-dot" /> Stories written for the ground you're on
          </li>
          <li>
            <span className="lb-dot" /> Narrated in a voice you can hear
          </li>
          <li>
            <span className="lb-dot" /> A photo challenge becomes a memory
          </li>
        </ul>

        <div className="screen-actions">
          <button className="primary-button" type="button" onClick={onGetStarted}>
            Get started
          </button>
          <button className="secondary-button" type="button" onClick={onGuest}>
            Explore as guest
          </button>
        </div>
      </div>
    </main>
  );
}

function PinGlyph({ small = false }: { small?: boolean }) {
  const s = small ? 13 : 18;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        fill="currentColor"
      />
      <circle cx="12" cy="10" r="2.6" fill="#ece8dc" />
    </svg>
  );
}
