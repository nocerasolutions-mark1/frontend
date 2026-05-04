import { ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

type Props = {
  previewUrl: string;
  contentTypeIcon: string;
};

type EmbedInfo = {
  embedUrl: string | null;
  blocked: boolean;
  platform: "instagram" | "facebook" | "tiktok" | "x" | "youtube" | null;
};

function getEmbedInfo(url: string): EmbedInfo {
  if (!url) return { embedUrl: null, blocked: false, platform: null };
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const videoId = host.includes("youtu.be")
        ? parsed.pathname.slice(1).split("?")[0]
        : parsed.searchParams.get("v");
      if (videoId)
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
          blocked: false,
          platform: "youtube",
        };
    }
    if (host.includes("instagram.com"))
      return { embedUrl: null, blocked: true, platform: "instagram" };
    if (host.includes("facebook.com") || host.includes("fb.com"))
      return { embedUrl: null, blocked: true, platform: "facebook" };
    if (host.includes("tiktok.com"))
      return { embedUrl: null, blocked: true, platform: "tiktok" };
    if (host.includes("twitter.com") || host.includes("x.com"))
      return { embedUrl: null, blocked: true, platform: "x" };

    return { embedUrl: url, blocked: false, platform: null };
  } catch {
    return { embedUrl: url, blocked: false, platform: null };
  }
}

function extractHandle(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[0] ? `@${parts[0]}` : url;
  } catch {
    return url;
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const PLATFORM_META: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  instagram: {
    label: "Instagram",
    icon: "📸",
    color: "#c13584",
    bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
  },
  facebook: {
    label: "Facebook",
    icon: "👤",
    color: "#1877f2",
    bg: "#1877f2",
  },
  tiktok: {
    label: "TikTok",
    icon: "🎵",
    color: "#000000",
    bg: "#000000",
  },
  x: {
    label: "X (Twitter)",
    icon: "🐦",
    color: "#000000",
    bg: "#000000",
  },
};

export function PhonePreview({ previewUrl, contentTypeIcon }: Props) {
  const embed = getEmbedInfo(previewUrl);
  const meta = embed.platform ? PLATFORM_META[embed.platform] : null;
  const [loading, setLoading] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  useEffect(() => {
    const info = getEmbedInfo(previewUrl);
    if (previewUrl && !info.blocked && info.embedUrl) {
      setLoading(true);
      setIframeBlocked(false);
    } else {
      setLoading(false);
      setIframeBlocked(false);
    }
  }, [previewUrl]);

  function handleIframeLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    try {
      const doc = e.currentTarget.contentDocument;
      // null doc or empty body = browser blocked the frame (X-Frame-Options / CSP)
      if (!doc || doc.body.childNodes.length === 0) {
        setIframeBlocked(true);
      } else {
        setIframeBlocked(false);
      }
    } catch {
      // SecurityError: cross-origin iframe loaded successfully — not blocked
      setIframeBlocked(false);
    }
    setLoading(false);
  }

  const showIframe = previewUrl && !embed.blocked && embed.embedUrl;
  const domain = getDomain(previewUrl);

  return (
    <div className="phone-mockup">
      {/* Status bar */}
      <div className="phone-status-bar">
        <ExternalLink size={11} color="var(--muted)" />
        <span className="phone-url-text">{previewUrl || "Enter a URL above"}</span>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="phone-open-btn">
            ↗
          </a>
        )}
      </div>

      {/* Screen */}
      <div className="phone-screen">
        {/* No URL yet */}
        {!previewUrl && (
          <div className="phone-placeholder">
            <span className="phone-type-icon">{contentTypeIcon}</span>
            <span>Enter a URL to see the preview</span>
          </div>
        )}

        {/* Known blocked platform (Instagram, TikTok, etc.) */}
        {previewUrl && embed.blocked && meta && (
          <div className="phone-platform-card">
            <div className="phone-platform-banner" style={{ background: meta.bg }} />
            <div className="phone-platform-avatar">{meta.icon}</div>
            <div className="phone-platform-handle">{extractHandle(previewUrl)}</div>
            <div className="phone-platform-name">{meta.label} Profile</div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="phone-platform-link"
            >
              Open on {meta.label} ↗
            </a>
          </div>
        )}

        {/* Generic site that blocked embedding (detected via onLoad) */}
        {iframeBlocked && !embed.blocked && (
          <div className="phone-platform-card">
            <div className="phone-platform-banner" style={{ background: "var(--surface-2)" }} />
            <div className="phone-platform-avatar" style={{ fontSize: 30 }}>🌐</div>
            <div className="phone-platform-handle">{domain}</div>
            <div className="phone-platform-name">This site blocks previews</div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="phone-platform-link"
            >
              Open in browser ↗
            </a>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="phone-loading">
            <span>Loading preview…</span>
          </div>
        )}

        {/* Iframes — kept in DOM so onLoad fires; hidden via opacity when loading/blocked */}

        {showIframe && embed.platform === "youtube" && (
          <iframe
            key={embed.embedUrl}
            src={embed.embedUrl!}
            title="YouTube preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoading(false)}
            style={{ opacity: loading ? 0 : 1 }}
          />
        )}

        {showIframe && embed.platform === null && (
          <iframe
            key={embed.embedUrl}
            src={embed.embedUrl!}
            title="Page preview"
            onLoad={handleIframeLoad}
            style={{ opacity: loading || iframeBlocked ? 0 : 1, pointerEvents: iframeBlocked ? "none" : "auto" }}
          />
        )}
      </div>

      {/* Footer — only for generic iframes that loaded OK */}
      {previewUrl && !embed.blocked && !iframeBlocked && !loading && (
        <div className="phone-note">
          Some sites block embedding.{" "}
          <a href={previewUrl} target="_blank" rel="noreferrer">
            Open in browser ↗
          </a>
        </div>
      )}
    </div>
  );
}
