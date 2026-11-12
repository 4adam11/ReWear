import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Download, Copy, Check, X, Heart, ShoppingBag, Search, CalendarDays, Truck, ShieldCheck,
  MessageCircle, Sparkles, Camera, Sun, Shirt, Ban, Play,
} from "lucide-react";

import tailwindConfig from "../../tailwind.config.js";
import API from "../utils/api";
import { LogoMark } from "../components/ui/Logo";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import { CATEGORIES } from "../utils/catalog";
import { cardImage, PLACEHOLDER_IMAGE } from "../utils/image";
import { contrast, textRating } from "../utils/contrast";
import { playMilestone } from "../components/ui/Milestone";
import { toast } from "../utils/feedback";
import usePageTitle from "../hooks/usePageTitle";

// The colours come straight from tailwind.config.js, so this page always shows what the site uses
const C = tailwindConfig.theme.extend.colors;

const SECTIONS = [
  ["essence", "Essence"],
  ["logo", "Logo"],
  ["colour", "Colour"],
  ["type", "Type"],
  ["components", "Components"],
  ["motion", "Motion"],
  ["photography", "Photography"],
  ["icons", "Icons"],
  ["voice", "Voice"],
];

const CORE = [
  ["Ink", "ink", C.ink.DEFAULT, "Text, primary buttons, the header"],
  ["Espresso", "brand", C.brand.DEFAULT, "Links, focus ring, logo tile"],
  ["Caramel", "caramel", C.caramel, "Stars, rentals, chart fills"],
  ["Gold", "gold", C.gold, "Highlights on dark only"],
  ["Accent", "accent", C.accent, "Small warm labels"],
];
const SURFACES = [
  ["Paper", "paper", C.paper, "Page background"],
  ["Cream", "cream", C.cream, "Hover rows, quiet fills"],
  ["Sand", "sand", C.sand, "Alternate sections"],
  ["Night", "night", C.night.DEFAULT, "Dark bands"],
  ["Line", "line", C.line.DEFAULT, "Borders and rules"],
  ["Field", "field", C.field, "Input borders"],
  ["Muted", "muted", C.muted, "Secondary text"],
];
const STATUS = [
  ["Sage", "success", "Live, delivered, saved", "live"],
  ["Neel", "info", "Confirmed, verified", "confirmed"],
  ["Haldi", "warning", "In review, flagged", "pending"],
  ["Sindoor", "danger", "Errors, rejected", "rejected"],
];

const Section = ({ id, kicker, title, intro, children }) => (
  <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-40 py-12 border-t border-line first:border-t-0 first:pt-0">
    <p className="kicker text-accent">{kicker}</p>
    <h2 id={`${id}-h`} className="mt-2 text-2xl sm:text-[28px] font-bold uppercase tracking-[0.04em]">{title}</h2>
    {intro && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{intro}</p>}
    <div className="mt-8">{children}</div>
  </section>
);

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${text}`);
  } catch {
    toast.error("Your browser didn't allow copying. Select the value instead.");
  }
};

const Swatch = ({ name, token, hex, use }) => {
  const onWhite = contrast(hex, "#ffffff");
  const dark = contrast(hex, "#ffffff") > contrast(hex, C.ink.DEFAULT);
  return (
    <div className="panel overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={() => copy(hex)}
        className="group relative h-24 text-left px-3 py-2 photo-edge"
        style={{ background: hex, color: dark ? "#fff" : C.ink.DEFAULT }}
        aria-label={`Copy ${name} ${hex}`}
      >
        <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <Copy size={15} aria-hidden="true" />
        </span>
        <span className="absolute left-3 bottom-2 font-mono text-xs nums">{hex}</span>
      </button>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold">{name}</p>
        <p className="font-mono text-xs text-muted">{token}</p>
        <p className="text-xs text-muted leading-snug">{use}</p>
        <p className="mt-auto pt-1.5 text-[11px] text-faint nums">
          {onWhite.toFixed(1)}:1 on white · {textRating(onWhite)}
        </p>
      </div>
    </div>
  );
};

const LogoTile = ({ bg, label, children, dark }) => (
  <figure className="flex flex-col gap-2">
    <div className={`h-40 rounded-sm flex items-center justify-center photo-edge ${bg}`}>{children}</div>
    <figcaption className={`text-xs ${dark ? "text-muted" : "text-muted"}`}>{label}</figcaption>
  </figure>
);

const Dont = ({ label, children }) => (
  <figure className="flex flex-col gap-2">
    <div className="relative h-28 rounded-sm bg-white border border-line flex items-center justify-center overflow-hidden">
      {children}
      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center" aria-hidden="true">
        <X size={14} strokeWidth={3} />
      </span>
    </div>
    <figcaption className="text-xs text-muted">{label}</figcaption>
  </figure>
);

const TypeRow = ({ role, spec, children }) => (
  <div className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)] items-baseline py-5 border-b border-line-soft last:border-b-0">
    <div>
      <p className="text-sm font-semibold">{role}</p>
      <p className="text-xs text-muted">{spec}</p>
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);

const DoDont = ({ good, children }) => (
  <li className="flex items-start gap-2.5 text-sm leading-relaxed">
    {good ? (
      <Check size={17} className="mt-0.5 flex-shrink-0 text-success" aria-label="Do" />
    ) : (
      <Ban size={17} className="mt-0.5 flex-shrink-0 text-danger" aria-label="Don't" />
    )}
    <span>{children}</span>
  </li>
);

const Brand = () => {
  usePageTitle("Brand kit");
  const [photos, setPhotos] = useState([]);
  const [swept, setSwept] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/products/home`)
      .then(({ data }) => setPhotos((data.fresh || []).filter((p) => p.images?.[0]).slice(0, 3)))
      .catch(() => {});
  }, []);

  const demoSweep = () => playMilestone(() => setSwept((s) => !s));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Masthead */}
      <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-end pb-10">
        <div>
          <p className="kicker text-accent enter">ReWear brand kit</p>
          <h1 className="enter enter-2 mt-3 font-display text-[44px] sm:text-[64px] leading-[0.95] font-bold uppercase tracking-[0.02em]">
            Wear it again.
          </h1>
          <p className="enter enter-3 mt-5 max-w-xl text-[15px] sm:text-base leading-relaxed text-ink-soft">
            How ReWear looks, moves and talks. Use it for every screen, post, poster and slide, so a shopper always knows it's us.
            The same rules live in <code className="font-mono text-[13px] bg-cream px-1.5 py-0.5 rounded-sm">DESIGN.md</code> for anyone building the site.
          </p>
        </div>
        <div className="panel p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold">Logo files</p>
          {[
            ["rewear-logo.svg", "Logo, light backgrounds"],
            ["rewear-logo-ondark.svg", "Logo, dark backgrounds"],
            ["rewear-mark.svg", "Mark"],
            ["rewear-mark-reversed.svg", "Mark, reversed"],
            ["rewear-mark-mono.svg", "Mark, one colour"],
          ].map(([file, label]) => (
            <a key={file} href={`/brand/${file}`} download className="flex items-center justify-between gap-3 text-sm text-brand font-medium hover:underline">
              {label}
              <Download size={15} aria-hidden="true" />
            </a>
          ))}
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
        {/* On this page */}
        <nav aria-label="Brand kit sections" className="mb-6 lg:mb-0 lg:sticky lg:top-[150px] lg:self-start">
          <ul className="scroll-row flex lg:flex-col gap-1 overflow-x-auto">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block whitespace-nowrap rounded-sm px-3 py-2 text-sm text-muted hover:text-ink hover:bg-cream transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Section id="essence" kicker="01" title="Essence" intro="ReWear is a marketplace for pre-loved Indian fashion. People buy outfits to keep, or rent them for a wedding, a sangeet, Diwali or a college fest.">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-sm bg-ink text-paper p-6 flex flex-col gap-2 sm:col-span-2">
                <p className="kicker text-gold">Promise</p>
                <p className="font-display text-2xl sm:text-3xl font-semibold leading-tight">Every outfit has another celebration in it.</p>
              </div>
              <div className="panel p-6 flex flex-col gap-3">
                <p className="kicker text-muted">We are</p>
                <p className="font-display text-lg font-semibold leading-snug">Warm · Trustworthy · Festive · Practical</p>
                <p className="kicker text-muted mt-2">We aren't</p>
                <p className="text-sm text-muted">Snobbish, discount-shouty, cutesy or cold</p>
              </div>
            </div>
          </Section>

          <Section id="logo" kicker="02" title="Logo" intro="A thrift price tag on a string, with a caramel heart for pre-loved, on a rounded Espresso tile. The wordmark is ReWear in Jost Bold: capital R, capital W.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LogoTile bg="bg-paper" label="Primary, on Paper">
                <span className="inline-flex items-center gap-3">
                  <LogoMark size={52} />
                  <span className="font-display text-[30px] font-bold tracking-tight">ReWear</span>
                </span>
              </LogoTile>
              <LogoTile bg="bg-ink" label="On Ink">
                <span className="inline-flex items-center gap-3">
                  <LogoMark size={52} />
                  <span className="font-display text-[30px] font-bold tracking-tight text-paper">ReWear</span>
                </span>
              </LogoTile>
              <LogoTile bg="bg-brand" label="Reversed, on Espresso">
                <img src="/brand/rewear-mark-reversed.svg" alt="" width="64" height="64" />
              </LogoTile>
              <LogoTile bg="bg-sand" label="One colour, for stamps and print">
                <img src="/brand/rewear-mark-mono.svg" alt="" width="64" height="64" className="opacity-90" />
              </LogoTile>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="panel p-6 flex flex-col gap-4">
                <p className="text-sm font-semibold">Clear space and size</p>
                <div className="self-center p-4 border border-dashed border-caramel">
                  <div className="p-[13px] bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(192,131,79,0.15)_4px,rgba(192,131,79,0.15)_8px)]">
                    <LogoMark size={52} />
                  </div>
                </div>
                <ul className="text-sm text-ink-soft flex flex-col gap-1.5">
                  <li>Keep a quarter of the mark's width clear on every side.</li>
                  <li>Smallest mark: 20px. Smallest full logo: 96px wide.</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Dont label="Don't stretch it">
                  <span style={{ transform: "scaleX(1.6)" }}><LogoMark size={44} /></span>
                </Dont>
                <Dont label="Don't recolour the tile">
                  <span style={{ filter: "hue-rotate(160deg) saturate(2)" }}><LogoMark size={44} /></span>
                </Dont>
                <Dont label="Don't rotate it">
                  <span style={{ transform: "rotate(25deg)" }}><LogoMark size={44} /></span>
                </Dont>
                <Dont label="Don't change the font">
                  <span className="font-serif italic text-xl">rewear</span>
                </Dont>
              </div>
            </div>
          </Section>

          <Section id="colour" kicker="03" title="Colour" intro="Warm coffee tones on cream. The interface stays mostly Paper, white and Ink, so the clothes carry the colour. Click a swatch to copy it.">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Core</h3>
            <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {CORE.map(([name, token, hex, use]) => (
                <Swatch key={token} name={name} token={token} hex={hex} use={use} />
              ))}
            </div>

            <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.08em] text-muted">Surfaces, lines and text</h3>
            <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              {SURFACES.map(([name, token, hex, use]) => (
                <Swatch key={token} name={name} token={token} hex={hex} use={use} />
              ))}
            </div>

            <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.08em] text-muted">Status, named after Indian dyes</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATUS.map(([name, role, use, sample]) => {
                const c = C[role];
                return (
                  <div key={role} className="panel overflow-hidden">
                    <div className="flex h-16">
                      {[c.DEFAULT, c.strong, c.line, c.tint].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => copy(hex)}
                          aria-label={`Copy ${hex}`}
                          className="flex-1 photo-edge"
                          style={{ background: hex }}
                        />
                      ))}
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <p className="text-sm font-semibold">
                        {name} <span className="font-mono text-xs font-normal text-muted">{role}</span>
                      </p>
                      <p className="text-xs text-muted">{use}</p>
                      <StatusBadge status={sample} className="self-start" />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">Each status always comes with a word, never colour alone.</p>

            <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.08em] text-muted">Occasions</h3>
            <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => copy(c.color)}
                  className="rounded-sm p-4 text-left flex flex-col gap-6 transition-[translate] hover:-translate-y-0.5"
                  style={{ background: c.tint }}
                >
                  <span className="w-8 h-8 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                  <span>
                    <span className="block font-display font-semibold uppercase tracking-[0.06em] text-sm" style={{ color: c.color }}>
                      {c.label}
                    </span>
                    <span className="block font-mono text-xs text-muted">{c.color}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section id="type" kicker="04" title="Type" intro="Jost, a geometric face, for headings, labels and buttons. Inter for everything you read. Prices use tabular figures so they line up.">
            <div className="panel px-5">
              <TypeRow role="Display" spec="Jost 700 · 44 to 72px · uppercase">
                <p className="font-display text-[40px] sm:text-[56px] font-bold uppercase leading-none tracking-[0.02em] truncate">Wear it again</p>
              </TypeRow>
              <TypeRow role="Page title" spec="Jost 700 · 26 to 30px · bar under">
                <p className="page-title">Your orders</p>
              </TypeRow>
              <TypeRow role="Section heading" spec="Jost 700 · 18 to 20px">
                <p className="font-display text-xl font-bold uppercase tracking-[0.04em]">The wedding edit</p>
              </TypeRow>
              <TypeRow role="Label" spec="Jost 600 · 12px · tracked 0.2em">
                <p className="kicker">Pre-loved Indian fashion</p>
              </TypeRow>
              <TypeRow role="Body" spec="Inter 400 · 15px · line height 1.6">
                <p className="text-[15px] leading-relaxed max-w-xl">
                  Worn once at a cousin's sangeet. Hand-embroidered zari on the blouse, dupatta included. Dry cleaned and ready to wear again.
                </p>
              </TypeRow>
              <TypeRow role="Price" spec="Inter 700 · tabular figures">
                <p className="text-2xl font-bold nums">₹2,400 <span className="text-sm font-medium text-muted">· rent ₹450/day</span></p>
              </TypeRow>
            </div>
          </Section>

          <Section id="components" kicker="05" title="Components" intro="One radius (2px) for everything you tap or read in a box; pills only for chips, counters and avatars. Shadows for depth, borders for structure.">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="panel p-5 flex flex-col gap-4">
                <p className="text-sm font-semibold">Buttons</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-dark">Add to bag</button>
                  <button type="button" className="btn btn-outline">Make an offer</button>
                  <button type="button" className="btn btn-danger btn-sm">Delete listing</button>
                  <button type="button" className="btn btn-dark btn-sm" disabled>Sold</button>
                </div>
                <div className="rounded-sm bg-ink p-4 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-light">Shop to rent</button>
                </div>
                <p className="text-xs text-muted">Press and hold one: it settles to 96%. Say what happens: "Place order", never "Submit".</p>
              </div>

              <div className="panel p-5 flex flex-col gap-4">
                <p className="text-sm font-semibold">Fields</p>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Pincode
                  <input className="field" placeholder="452010" inputMode="numeric" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Occasion
                  <select className="field" defaultValue="wedding">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="panel p-5 flex flex-col gap-4">
                <p className="text-sm font-semibold">Status and trust</p>
                <div className="flex flex-wrap gap-2">
                  {["live", "pending", "confirmed", "shipped", "delivered", "completed", "cancelled", "paused"].map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
                <VerifiedBadge label />
              </div>

              <div className="panel p-5 flex flex-col gap-4">
                <p className="text-sm font-semibold">Tabs and chips</p>
                <div className="tab-bar">
                  <span className="tab tab-active">New</span>
                  <span className="tab">To ship</span>
                  <span className="tab">Shipped</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(0, 4).map((c) => (
                    <span key={c.value} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-3 py-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section id="motion" kicker="06" title="Motion" intro="Motion marks a moment; it doesn't decorate. Everyday changes are quick and quiet. Only two moments get the brand sweep: placing an order, and sending a listing for review.">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="rounded-sm bg-ink text-paper p-6 flex flex-col gap-4">
                <p className="kicker text-gold">The milestone sweep</p>
                <p className="text-sm leading-relaxed text-ondark">
                  A band in Gold, Caramel and Accent crosses the screen and the next page appears behind it. Built with glimm, loaded only
                  when it plays, and skipped for anyone who has reduced motion turned on.
                </p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={demoSweep} className="btn btn-light">
                    <Play size={16} aria-hidden="true" />
                    Play it
                  </button>
                  <span className="text-sm text-ondark-muted" aria-live="polite">
                    {swept ? "Order placed" : "Ready"}
                  </span>
                </div>
              </div>
              <dl className="panel p-5 grid gap-4 text-sm">
                {[
                  ["State changes", "150ms, ease-out, colour or opacity only"],
                  ["Press", "Buttons scale to 0.96 while held"],
                  ["First load", "Fade, 4px blur and 12px rise, staggered 100ms"],
                  ["Reduced motion", "No movement, scale or blur; the sweep is skipped"],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Section>

          <Section id="photography" kicker="07" title="Photography" intro="Real garments from real wardrobes. The clothes are the subject; every listing photo is 3:4 portrait and passes an automatic check and an admin review.">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="grid grid-cols-3 gap-3">
                {(photos.length ? photos : [null, null, null]).map((p, i) => (
                  <figure key={p?._id || i} className="flex flex-col gap-1.5">
                    <div className="aspect-[3/4] rounded-sm overflow-hidden bg-sand photo-edge">
                      {p && (
                        <img
                          src={cardImage(p.images[0], 300) || PLACEHOLDER_IMAGE}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {p && <figcaption className="text-xs text-muted truncate">{p.title}</figcaption>}
                  </figure>
                ))}
              </div>
              <div className="grid gap-4">
                <ul className="flex flex-col gap-2.5">
                  <DoDont good><Sun size={14} className="inline mr-1 text-caramel" aria-hidden="true" />Daylight or warm indoor light</DoDont>
                  <DoDont good><Shirt size={14} className="inline mr-1 text-caramel" aria-hidden="true" />The whole outfit first, then embroidery, fabric and any flaw</DoDont>
                  <DoDont good><Camera size={14} className="inline mr-1 text-caramel" aria-hidden="true" />3:4 portrait, garment filling the frame</DoDont>
                </ul>
                <ul className="flex flex-col gap-2.5">
                  <DoDont>Stock photos, collages or watermarks</DoDont>
                  <DoDont>Heavy filters that change the colour of the fabric</DoDont>
                  <DoDont>A photo of a different item, or a wedding saree in Party</DoDont>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="icons" kicker="08" title="Icons" intro="One set (Lucide), outline by default, filled for the active state. 2px stroke beside bold text, 1.5px beside regular.">
            <div className="panel p-5 flex flex-wrap gap-x-8 gap-y-5">
              {[
                [Search, "Search"], [Heart, "Wishlist"], [ShoppingBag, "Bag"], [CalendarDays, "Rent dates"],
                [Truck, "Delivery"], [ShieldCheck, "Checked"], [MessageCircle, "Messages"], [Sparkles, "New"],
              ].map(([Icon, label]) => (
                <span key={label} className="flex flex-col items-center gap-2 w-16 text-center">
                  <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                  <span className="text-xs text-muted">{label}</span>
                </span>
              ))}
              <span className="flex flex-col items-center gap-2 w-16 text-center">
                <Heart size={24} strokeWidth={1.75} className="fill-ink" aria-hidden="true" />
                <span className="text-xs text-muted">Saved</span>
              </span>
            </div>
          </Section>

          <Section id="voice" kicker="09" title="Voice" intro="Plain Indian English, short sentences, the way a helpful friend who sells clothes would talk. Say what happened and what happens next.">
            <div className="panel overflow-hidden">
              <div className="grid grid-cols-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted border-b border-line">
                <p className="px-4 py-3 flex items-center gap-1.5"><Check size={14} className="text-success" aria-hidden="true" />Say</p>
                <p className="px-4 py-3 flex items-center gap-1.5 border-l border-line"><Ban size={14} className="text-danger" aria-hidden="true" />Not</p>
              </div>
              {[
                ["Rent it for your sangeet, send it back after.", "Unlock limitless fashion possibilities!"],
                ["₹2,400 · Like new · Size M", "Amazing deal!!! Grab now"],
                ["Your order is confirmed. The seller has 2 days to accept it.", "Success!"],
                ["You've already reported this listing. An admin will look at it.", "Error 409"],
                ["Pay cash on delivery. UPI and card payments are coming soon.", "Pay any way you like (when only cash works)"],
              ].map(([good, bad]) => (
                <div key={good} className="grid grid-cols-2 text-sm border-b border-line-soft last:border-b-0">
                  <p className="px-4 py-3">{good}</p>
                  <p className="px-4 py-3 border-l border-line-soft text-muted line-through decoration-danger/50">{bad}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-ink-soft">
              Ready to use it?{" "}
              <Link to="/sell" className="font-semibold text-brand hover:underline">List something</Link> or{" "}
              <Link to="/explore" className="font-semibold text-brand hover:underline">start shopping</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Brand;
