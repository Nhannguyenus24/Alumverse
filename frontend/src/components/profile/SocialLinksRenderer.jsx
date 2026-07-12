import { useState } from "react";
import { MdEmail, MdLink } from "react-icons/md";
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaDiscord,
  FaTelegram,
  FaWhatsapp,
  FaReddit,
  FaPinterest,
  FaMedium,
  FaTiktok,
  FaTwitch,
  FaSnapchat,
  FaPaypal,
  FaSpotify,
  FaSteam,
  FaSoundcloud,
  FaBehance,
  FaDribbble,
  FaStackOverflow,
  FaQuora,
  FaVimeo,
  FaTumblr,
  FaVk,
  FaSlack,
  FaLine,
  FaWeixin,
  FaPatreon,
  FaGoodreads,
  FaSkype,
  FaViber,
} from "react-icons/fa";

import {
  SiX,
  SiThreads,
  SiBluesky,
  SiMastodon,
  SiGitlab,
  SiBitbucket,
  SiHashnode,
  SiDevdotto,
  SiFigma,
  SiNotion,
  SiSubstack,
  SiKofi,
  SiBuymeacoffee,
  SiReplit,
  SiKaggle,
} from "react-icons/si";

const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    domains: ["facebook.com", "fb.com"],
    icon: FaFacebook,
    color: "#1877F2",
  },
  {
    key: "github",
    domains: ["github.com"],
    icon: FaGithub,
    color: "#333",
  },
  {
    key: "gitlab",
    domains: ["gitlab.com"],
    icon: SiGitlab,
    color: "#FC6D26",
  },
  {
    key: "bitbucket",
    domains: ["bitbucket.org"],
    icon: SiBitbucket,
    color: "#0052CC",
  },
  {
    key: "instagram",
    domains: ["instagram.com"],
    icon: FaInstagram,
    color: "#E4405F",
  },
  {
    key: "linkedin",
    domains: ["linkedin.com"],
    icon: FaLinkedin,
    color: "#0A66C2",
  },
  {
    key: "twitter",
    domains: ["twitter.com", "x.com"],
    icon: SiX,
    color: "#000",
  },
  {
    key: "threads",
    domains: ["threads.net"],
    icon: SiThreads,
    color: "#000",
  },
  {
    key: "youtube",
    domains: ["youtube.com", "youtu.be"],
    icon: FaYoutube,
    color: "#FF0000",
  },
  {
    key: "tiktok",
    domains: ["tiktok.com"],
    icon: FaTiktok,
    color: "#000",
  },
  {
    key: "discord",
    domains: ["discord.gg", "discord.com"],
    icon: FaDiscord,
    color: "#5865F2",
  },
  {
    key: "telegram",
    domains: ["telegram.me", "t.me"],
    icon: FaTelegram,
    color: "#26A5E4",
  },
  {
    key: "whatsapp",
    domains: ["whatsapp.com", "wa.me"],
    icon: FaWhatsapp,
    color: "#25D366",
  },
  {
    key: "reddit",
    domains: ["reddit.com"],
    icon: FaReddit,
    color: "#FF4500",
  },
  {
    key: "pinterest",
    domains: ["pinterest.com"],
    icon: FaPinterest,
    color: "#E60023",
  },
  {
    key: "medium",
    domains: ["medium.com"],
    icon: FaMedium,
    color: "#000",
  },
  {
    key: "devto",
    domains: ["dev.to"],
    icon: SiDevdotto,
    color: "#000",
  },
  {
    key: "hashnode",
    domains: ["hashnode.com"],
    icon: SiHashnode,
    color: "#2962FF",
  },
  {
    key: "figma",
    domains: ["figma.com"],
    icon: SiFigma,
    color: "#F24E1E",
  },
  {
    key: "notion",
    domains: ["notion.so", "notion.site"],
    icon: SiNotion,
    color: "#000",
  },
  {
    key: "replit",
    domains: ["replit.com"],
    icon: SiReplit,
    color: "#F26207",
  },
  {
    key: "kaggle",
    domains: ["kaggle.com"],
    icon: SiKaggle,
    color: "#20BEFF",
  },
  {
    key: "behance",
    domains: ["behance.net"],
    icon: FaBehance,
    color: "#1769FF",
  },
  {
    key: "dribbble",
    domains: ["dribbble.com"],
    icon: FaDribbble,
    color: "#EA4C89",
  },
  {
    key: "spotify",
    domains: ["spotify.com"],
    icon: FaSpotify,
    color: "#1DB954",
  },
  {
    key: "soundcloud",
    domains: ["soundcloud.com"],
    icon: FaSoundcloud,
    color: "#FF5500",
  },
  {
    key: "steam",
    domains: ["steamcommunity.com", "store.steampowered.com"],
    icon: FaSteam,
    color: "#171A21",
  },
  {
    key: "paypal",
    domains: ["paypal.com", "paypal.me"],
    icon: FaPaypal,
    color: "#00457C",
  },
  {
    key: "substack",
    domains: ["substack.com"],
    icon: SiSubstack,
    color: "#FF6719",
  },
  {
    key: "kofi",
    domains: ["ko-fi.com"],
    icon: SiKofi,
    color: "#29ABE0",
  },
  {
    key: "buymeacoffee",
    domains: ["buymeacoffee.com"],
    icon: SiBuymeacoffee,
    color: "#FFDD00",
  },
  {
    key: "mastodon",
    domains: ["mastodon.social"],
    icon: SiMastodon,
    color: "#6364FF",
  },
  {
    key: "bluesky",
    domains: ["bsky.app"],
    icon: SiBluesky,
    color: "#1185FE",
  },
  {
    key: "snapchat",
    domains: ["snapchat.com"],
    icon: FaSnapchat,
    color: "#FFFC00",
  },
  {
    key: "twitch",
    domains: ["twitch.tv"],
    icon: FaTwitch,
    color: "#9146FF",
  },
  {
    key: "stackoverflow",
    domains: ["stackoverflow.com"],
    icon: FaStackOverflow,
    color: "#F58025",
  },
  {
    key: "quora",
    domains: ["quora.com"],
    icon: FaQuora,
    color: "#B92B27",
  },
  {
    key: "vimeo",
    domains: ["vimeo.com"],
    icon: FaVimeo,
    color: "#1AB7EA",
  },
  {
    key: "tumblr",
    domains: ["tumblr.com"],
    icon: FaTumblr,
    color: "#36465D",
  },
  {
    key: "vk",
    domains: ["vk.com"],
    icon: FaVk,
    color: "#4680C2",
  },
  {
    key: "slack",
    domains: ["slack.com"],
    icon: FaSlack,
    color: "#4A154B",
  },
  {
    key: "line",
    domains: ["line.me"],
    icon: FaLine,
    color: "#00C300",
  },
  {
    key: "wechat",
    domains: ["wechat.com", "weixin.qq.com"],
    icon: FaWeixin,
    color: "#7BB32E",
  },
  {
    key: "patreon",
    domains: ["patreon.com"],
    icon: FaPatreon,
    color: "#FF424D",
  },
  {
    key: "goodreads",
    domains: ["goodreads.com"],
    icon: FaGoodreads,
    color: "#372213",
  },
  {
    key: "skype",
    domains: ["skype.com"],
    icon: FaSkype,
    color: "#00AFF0",
  },
  {
    key: "viber",
    domains: ["viber.com"],
    icon: FaViber,
    color: "#7360F2",
  },
];

const detectPlatform = (url) => {
  if (!url) return null;

  const lower = url.toLowerCase();

  if (
    lower.startsWith("mailto:") ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)
  ) {
    return {
      icon: MdEmail,
      color: "#D44638",
      key: "email",
    };
  }

  const found = SOCIAL_PLATFORMS.find((item) =>
    item.domains.some((domain) => lower.includes(domain))
  );

  return (
    found || {
      key: "other",
      icon: MdLink,
      color: "#757575",
    }
  );
};

const SocialLinksRenderer = ({ linksRaw }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  if (!linksRaw) return null;

  let links = [];

  try {
    links =
      typeof linksRaw === "string"
        ? JSON.parse(linksRaw)
        : linksRaw;
  } catch {
    links = [];
  }

  if (!Array.isArray(links) || !links.length) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleClick}
        endIcon={<MdKeyboardArrowDown />}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          borderColor: 'divider',
          color: 'text.secondary',
          '&:hover': {
            borderColor: 'primary.main',
            color: 'primary.main',
            bgcolor: 'transparent'
          }
        }}
      >
        Mạng xã hội ({links.length})
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        {links.map((link, index) => {
          if (typeof link !== "string") return null;

          const platform = detectPlatform(link);
          const Icon = platform.icon;

          const href =
            platform.key === "email" && !link.startsWith("mailto:")
              ? `mailto:${link}`
              : link.startsWith("http") || link.startsWith("mailto:")
              ? link
              : `https://${link}`;

          return (
            <MenuItem
              key={index}
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              sx={{ py: 1.5, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icon size={22} color={platform.color} />
              </ListItemIcon>
              <ListItemText
                primary={platform.key === 'other' ? 'Link' : platform.key.charAt(0).toUpperCase() + platform.key.slice(1)}
                secondary={platform.key === 'email' && link.startsWith('mailto:') ? link.replace('mailto:', '') : link}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                secondaryTypographyProps={{ noWrap: true, sx: { maxWidth: 200, fontSize: '0.8rem' } }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default SocialLinksRenderer;