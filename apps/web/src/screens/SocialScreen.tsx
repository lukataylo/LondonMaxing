import type { ComponentType, SVGProps } from "react";
import {
  Heart as HeartRaw,
  MessageCircle as MessageCircleRaw,
  Play as PlayRaw,
  UsersRound as UsersRoundRaw,
} from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; fill?: string }>;

const Heart = HeartRaw as unknown as IconComponent;
const MessageCircle = MessageCircleRaw as unknown as IconComponent;
const Play = PlayRaw as unknown as IconComponent;
const UsersRound = UsersRoundRaw as unknown as IconComponent;

const SOCIAL_POSTS = [
  {
    id: "dock-morning",
    type: "image",
    author: "Mina",
    platform: "Old Haunts",
    title: "Morning route by the river",
    src: "/pins/places/coffee.png",
    stats: "128",
  },
  {
    id: "soho-walk",
    type: "video",
    author: "Alex",
    platform: "Creator post",
    title: "A quick Soho stop sequence",
    src: "/pins/places/theatre.png",
    stats: "84",
  },
  {
    id: "bookshop-detail",
    type: "image",
    author: "Nora",
    platform: "Old Haunts",
    title: "Bookshop margin notes",
    src: "/pins/places/bookshop.png",
    stats: "63",
  },
  {
    id: "south-bank",
    type: "video",
    author: "Sam",
    platform: "Creator post",
    title: "South Bank light after rain",
    src: "/pins/places/shakespeares-globe.png",
    stats: "96",
  },
];

export function SocialScreen() {
  return (
    <main className="shell-screen social-screen">
      <section className="shell-panel social-panel" aria-labelledby="social-title">
        <div className="shell-heading">
          <span className="shell-kicker">
            <UsersRound size={16} />
            Social
          </span>
          <h1 id="social-title">People and platform posts.</h1>
        </div>

        <div className="social-grid">
          {SOCIAL_POSTS.map((post) => (
            <article className="social-card" key={post.id}>
              <div className="social-media">
                <img src={post.src} alt="" />
                {post.type === "video" ? (
                  <span className="social-play" aria-label="Video">
                    <Play size={16} fill="currentColor" />
                  </span>
                ) : null}
              </div>
              <div className="social-copy">
                <p>{post.platform}</p>
                <h2>{post.title}</h2>
                <div>
                  <span>{post.author}</span>
                  <span>
                    <Heart size={14} /> {post.stats}
                  </span>
                  <span>
                    <MessageCircle size={14} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
