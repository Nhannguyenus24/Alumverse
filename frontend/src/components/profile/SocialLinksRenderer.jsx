import React from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { MdEmail, MdLink, MdPublic } from "react-icons/md";
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
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
import { normalizeProfileLinks } from "../../utils/profileContactLinks";

const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    domains: ["facebook.com", "fb.com"],
    icon: FaFacebookF,
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
    icon: FaLinkedinIn,
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
      icon: MdPublic,
      color: "#757575",
    }
  );
};

const getPlatformLabel = (platform, t) => {
  if (platform.key === 'other') return t('contact_website', { defaultValue: 'Website' });
  if (platform.key === 'email') return t('contact_email', { defaultValue: 'Email liên hệ' });
  return platform.key.charAt(0).toUpperCase() + platform.key.slice(1);
};

const getLinkHref = (link, platform) => {
  if (platform.key === "email" && !link.startsWith("mailto:")) return `mailto:${link}`;
  if (link.startsWith("http") || link.startsWith("mailto:")) return link;
  return `https://${link}`;
};

const SocialLinksRenderer = ({ linksRaw, includeEmail = false, title }) => {
  const { t } = useTranslation('profile');

  if (!linksRaw) return null;

  const links = normalizeProfileLinks(linksRaw);

  if (!links.length) return null;

  const visibleLinks = links.filter((link) => {
    if (typeof link !== 'string') return false;
    return includeEmail || detectPlatform(link)?.key !== 'email';
  });

  if (!visibleLinks.length) return null;

  const items = visibleLinks.map((link) => {
    const platform = detectPlatform(link);
    return {
      link,
      platform,
      href: getLinkHref(link, platform),
      label: getPlatformLabel(platform, t),
    };
  });

  return (
    <Box
      sx={{
        position: 'relative',
        py: 1.75,
        px: 1,
        borderRadius: 2,
        transition: 'all .25s ease',

        '&::before': {
          content: '""',
          position: 'absolute',
          left: -8,
          top: '15%',
          width: 3,
          height: '70%',
          borderRadius: 999,
          bgcolor: 'primary.main',
          opacity: 0,
          transition: 'all .25s ease',
        },

        '&:hover': {
          transform: 'translateX(4px)',
        },

        '&:hover::before': {
          opacity: 1,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
        <Box
          component={MdLink}
          aria-hidden="true"
          sx={{
            fontSize: 18,
            color: 'primary.main',
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight={600}
        >
          {title || t('social_links', { defaultValue: 'Mạng xã hội' })}
        </Typography>
      </Stack>
      <Box
        sx={{
          ml: 3.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(28px, 32px))',
          gap: 1,
          alignItems: 'center',
          maxWidth: items.length <= 6 ? 232 : '100%',
        }}
      >
        {items.map(({ link, platform, href, label }) => {
          const Icon = platform.icon;

          return (
            <Tooltip key={`${platform.key}-${link}`} title={label} arrow>
              <IconButton
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                sx={{
                  width: 32,
                  height: 32,
                  p: 0.5,
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  opacity: 0.9,
                  transition: 'transform 160ms ease, opacity 160ms ease, color 160ms ease, background-color 160ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    opacity: 1,
                    color: 'primary.main',
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Icon size={21} />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default SocialLinksRenderer;
