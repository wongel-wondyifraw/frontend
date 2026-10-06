import type { LandingMediaItem, LandingPageContent } from "@/types";
import { TENANT } from "@/lib/tenant";

/**
 * Canonical landing CMS keys (persisted in page_contents JSONB):
 * hero | stats | vision | programs | ministries | projects | contact | about | footer
 *
 * Legacy migrations on load:
 * - stored.projects (old ministries) → ministries when ministries missing
 * - stored.homepage_projects → projects
 */

type LegacyLandingBlob = Partial<LandingPageContent> & {
  homepage_projects?: LandingPageContent["projects"];
  /** Pre-rename: projects meant ministries */
  projects?: LandingPageContent["ministries"] | LandingPageContent["projects"];
  updates?: unknown;
};

export const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  hero: {
    enabled: true,
    title: TENANT.name,
    lede: "",
    image_url: null,
    cta_label: "Staff login",
    secondary_cta_label: "Explore the page",
  },
  stats: {
    enabled: true,
    items: [
      { title: "4,500+", text: "Active Church Members" },
      { title: "32", text: "Community Cell Groups" },
      { title: "18", text: "Ongoing Ministry Programs" },
      { title: "99.8%", text: "ChMS System Reliability" },
    ],
  },
  about: {
    enabled: true,
    label: "MISSION",
    title: "Our vision",
    subtitle: "",
    items: [],
  },
  vision: {
    enabled: true,
    title: "Our vision",
    subtitle: "",
    label: "",
    heading: "Our Vision & Core Mandate",
    body: "A biblical congregation dedicated to honoring Jesus Christ and serving our surrounding neighborhoods with genuine Christian love.",
    image_url: null,
    items: [
      {
        title: "Know Christ.",
        text: "Preaching Christ without compromise and reaching every street of Goro through frontline evangelism, campus ministries, and regional missions.",
      },
      {
        title: "Grow in Christ.",
        text: "Equipping believers from salvation to spiritual maturity through systematic biblical instruction, small group fellowships, and pastoral mentoring.",
      },
      {
        title: "Make Him Known.",
        text: "Living out love through proactive benevolence: food distributions for vulnerable widows, free medical check-ups, tutoring centers, and vocational youth empowerment.",
      },
    ],
  },
  ministries: {
    enabled: true,
    title: "Ministries",
    subtitle: "",
    items: [],
  },
  projects: {
    enabled: true,
    title: "Projects",
    subtitle: "",
    items: [],
  },
  programs: {
    enabled: true,
    title: "Programs",
    subtitle: "",
    items: [],
  },
  contact: {
    enabled: true,
    touch_title: "Get in touch",
    touch_body: "",
    location_title: "Sanctuary Location & Gathering Hours",
    location_services_heading: "Weekly Services & Gathering Times",
    location_services: [
      { name: "Sunday Worship", time: "9:00 AM – 12:30 PM" },
      { name: "Tuesday", time: "5:30 PM – 7:30 PM" },
      { name: "Thursday", time: "5:30 PM – 7:30 PM" },
    ],
    office_phone: "+251 11 645 8820",
    map_title: "Goro Full Gospel Church",
    map_subtitle: "Bole Sub-City, Addis Ababa",
    map_note: "Goro-Sefera Station (3 min walk)",
    map_url:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4180.505637180854!2d38.831462852903684!3d8.992677311552113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b9b02753358f5%3A0xda146d8ce451d649!2zR29yby1TZWZlcmEgRnVsbCBHb3NwZWwgQ2h1cmNofCDhjI7hiK4t4Yiw4Y2I4YirIOGImeGIiSDhi4jhipXhjIzhiI0g4Ymk4YmwIOGKreGIreGIteGJsuGLq-GKlQ!5e0!3m2!1sen!2snl!4v1790682743448!5m2!1sen!2snl",
    directions_url: "https://www.google.com/maps?cid=15714397395026925129",
  },
  footer: {
    blurb: "",
  },
};

function mergeSectionItems<T extends { items?: LandingMediaItem[] }>(
  base: T | undefined,
  stored: T | undefined,
): T {
  const merged = {
    ...(base || {}),
    ...(stored || {}),
    items: Array.isArray(stored?.items) ? stored!.items! : base?.items || [],
  } as T & Record<string, unknown>;

  // Drop legacy keys that are not part of the canonical section shape so
  // PATCH validation / saves don't trip on old production JSON.
  const allowed = new Set([
    "enabled",
    "title",
    "subtitle",
    "label",
    "heading",
    "body",
    "image_url",
    "video_url",
    "video_file_url",
    "file_url",
    "file_name",
    "items",
  ]);
  for (const key of Object.keys(merged)) {
    if (!allowed.has(key)) {
      delete merged[key];
    }
  }
  return merged as T;
}

/** Prefer CMS values; migrate legacy keys; never re-inject sample list content when CMS arrays are empty. */
export function mergeLandingContent(
  stored: LegacyLandingBlob | null | undefined,
): LandingPageContent {
  const base = DEFAULT_LANDING_CONTENT;
  if (!stored || typeof stored !== "object") return { ...base };

  const raw = stored as LegacyLandingBlob & {
    ministries?: LandingPageContent["ministries"];
    homepage_projects?: LandingPageContent["projects"];
  };

  const isNewShape = raw.ministries != null;
  const isDualLegacy = raw.homepage_projects != null;

  let ministriesSrc: LandingPageContent["ministries"] | undefined;
  let projectsSrc: LandingPageContent["projects"] | undefined;

  if (isNewShape) {
    ministriesSrc = raw.ministries;
    projectsSrc = raw.projects as LandingPageContent["projects"] | undefined;
  } else if (isDualLegacy) {
    ministriesSrc = raw.projects as
      LandingPageContent["ministries"] | undefined;
    projectsSrc = raw.homepage_projects;
  } else {
    // Oldest shape: `projects` held ministry cards only
    ministriesSrc = raw.projects as
      LandingPageContent["ministries"] | undefined;
    projectsSrc = undefined;
  }

  return {
    hero: pickHero(base.hero, stored.hero),
    stats: mergeSectionItems(base.stats, stored.stats),
    about: mergeSectionItems(base.about, stored.about),
    vision: mergeSectionItems(base.vision, stored.vision),
    ministries: mergeSectionItems(base.ministries, ministriesSrc),
    projects: mergeSectionItems(base.projects, projectsSrc),
    programs: mergeSectionItems(base.programs, stored.programs),
    contact: pickContact(base.contact, stored.contact),
    footer: pickFooter(base.footer, stored.footer),
  };
}

function pickHero(
  base: LandingPageContent["hero"],
  stored: LandingPageContent["hero"] | undefined,
): LandingPageContent["hero"] {
  return {
    enabled: stored?.enabled ?? base?.enabled,
    kicker: stored?.kicker ?? base?.kicker,
    title: stored?.title ?? base?.title,
    lede: stored?.lede ?? base?.lede,
    image_url: stored?.image_url !== undefined ? stored.image_url : base?.image_url,
    video_url: stored?.video_url !== undefined ? stored.video_url : base?.video_url,
    video_file_url:
      stored?.video_file_url !== undefined
        ? stored.video_file_url
        : base?.video_file_url,
    file_url: stored?.file_url !== undefined ? stored.file_url : base?.file_url,
    file_name:
      stored?.file_name !== undefined ? stored.file_name : base?.file_name,
    cta_label: stored?.cta_label ?? base?.cta_label,
    secondary_cta_label:
      stored?.secondary_cta_label ?? base?.secondary_cta_label,
    verse_ref: stored?.verse_ref ?? base?.verse_ref,
    verse_text: stored?.verse_text ?? base?.verse_text,
  };
}

function pickContact(
  base: LandingPageContent["contact"],
  stored: LandingPageContent["contact"] | undefined,
): LandingPageContent["contact"] {
  const legacy = stored as
    | (LandingPageContent["contact"] & {
        visit_lines?: string[];
        visit_title?: string;
        title?: string;
        subtitle?: string;
      })
    | undefined;

  let touchBody = stored?.touch_body ?? base?.touch_body ?? "";
  if (
    !String(touchBody || "").trim() &&
    Array.isArray(legacy?.visit_lines) &&
    legacy.visit_lines.length
  ) {
    touchBody = legacy.visit_lines
      .map((line) => String(line || "").trim())
      .filter(Boolean)
      .join("\n\n");
  }

  return {
    enabled: stored?.enabled ?? base?.enabled,
    touch_title:
      stored?.touch_title ||
      legacy?.visit_title ||
      legacy?.subtitle ||
      base?.touch_title,
    touch_body: touchBody,
    location_title: stored?.location_title ?? base?.location_title,
    location_services_heading:
      stored?.location_services_heading ?? base?.location_services_heading,
    location_services: Array.isArray(stored?.location_services)
      ? stored!.location_services!
      : base?.location_services || [],
    office_phone: stored?.office_phone ?? base?.office_phone,
    map_title: stored?.map_title ?? base?.map_title,
    map_subtitle: stored?.map_subtitle ?? base?.map_subtitle,
    map_note: stored?.map_note ?? base?.map_note,
    map_url: stored?.map_url ?? base?.map_url,
    directions_url: stored?.directions_url ?? base?.directions_url,
  };
}

function pickFooter(
  base: LandingPageContent["footer"],
  stored: LandingPageContent["footer"] | undefined,
): LandingPageContent["footer"] {
  return {
    blurb: stored?.blurb ?? base?.blurb,
  };
}

export function youtubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (
    /youtube\.com\/embed\//i.test(trimmed) ||
    /player\.vimeo\.com\//i.test(trimmed)
  ) {
    return trimmed;
  }
  const yt =
    trimmed.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    ) || trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return null;
  return null;
}

export function isDirectVideoFile(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url.trim());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value?: string | null): boolean {
  return Boolean(value && ISO_DATE.test(value.trim()));
}

/** Format stored start/end dates for public display (supports legacy free-text). */
export function formatLandingDateRange(item: {
  event_date?: string;
  event_date_end?: string;
}): string {
  const start = item.event_date?.trim();
  if (!start) return "";
  if (!isIsoDate(start)) return start;

  const startDate = new Date(`${start}T12:00:00`);
  const end = item.event_date_end?.trim();
  if (!end || !isIsoDate(end) || end === start) {
    return startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const endDate = new Date(`${end}T12:00:00`);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startLabel = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

/** Format HH:mm (or legacy) time for public display. */
export function formatLandingTime(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return raw;
  const hour = Number(match[1]);
  const minute = match[2];
  if (Number.isNaN(hour) || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${minute} ${period}`;
}

/** Prefer ministers[]; fall back to legacy lead string. */
export function formatLandingLead(item: {
  lead?: string;
  ministers?: string[];
}): string {
  if (Array.isArray(item.ministers) && item.ministers.length) {
    return item.ministers
      .map((m) => m.trim())
      .filter(Boolean)
      .join(", ");
  }
  return item.lead?.trim() || "";
}

export type LandingSectionErrorKey =
  | "hero"
  | "stats"
  | "vision"
  | "programs"
  | "ministries"
  | "projects"
  | "contact"
  | "mission"
  | "footer";

export type LandingValidationIssue = {
  section: LandingSectionErrorKey;
  message: string;
};

function itemTitleIssues(
  section: LandingSectionErrorKey,
  label: string,
  items: LandingMediaItem[] | undefined,
): LandingValidationIssue[] {
  if (!items?.length) return [];
  const issues: LandingValidationIssue[] = [];
  items.forEach((item, i) => {
    if (!item.title?.trim()) {
      issues.push({ section, message: `${label} card ${i + 1} needs a title` });
    }
  });
  return issues;
}

/** Lightweight client-side checks before PATCH. */
export function validateLandingContent(
  content: LandingPageContent,
): LandingValidationIssue[] {
  const issues: LandingValidationIssue[] = [];

  if (content.hero?.enabled !== false && !content.hero?.title?.trim()) {
    issues.push({
      section: "hero",
      message: "Hero title is required when the section is on",
    });
  }

  issues.push(
    ...itemTitleIssues(
      "stats",
      "Stats",
      content.stats?.items?.filter((item) => item.title?.trim() || item.text?.trim()),
    ),
  );
  issues.push(...itemTitleIssues("vision", "Vision", content.vision?.items));
  issues.push(
    ...itemTitleIssues("programs", "Program", content.programs?.items),
  );
  issues.push(
    ...itemTitleIssues("ministries", "Ministry", content.ministries?.items),
  );
  issues.push(
    ...itemTitleIssues("projects", "Project", content.projects?.items),
  );
  issues.push(...itemTitleIssues("mission", "Mission", content.about?.items));

  const services = content.contact?.location_services;
  if (services?.length) {
    services.forEach((row, i) => {
      if ((row.name || row.time) && (!row.name?.trim() || !row.time?.trim())) {
        issues.push({
          section: "contact",
          message: `Service time row ${i + 1} needs both a name and hours`,
        });
      }
    });
  }

  return issues;
}
