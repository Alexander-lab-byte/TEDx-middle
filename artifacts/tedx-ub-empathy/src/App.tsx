import { type CSSProperties, type FormEvent, type MouseEvent, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Mail, MapPin, Send, X } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { LiveMap } from '@/components/live-map';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

type Lang = 'en' | 'mn';
type Bilingual = { en: string; mn: string };
const b = (en: string, mn: string): Bilingual => ({ en, mn });
const queryClient = new QueryClient();
const media = `${import.meta.env.BASE_URL}media/`;

// Dynamic photo asset helpers — drop a file into public/media/speakers/ or
// public/media/team/ and reference it here. Nothing in the card/modal layout
// needs to change: a member or speaker with no `photo` just falls back to
// their initials, so photos can be swapped or added at any time.
const speakerPhoto = (file: string) => `${media}speakers/${file}`;
const teamPhoto = (file: string) => `${media}team/${file}`;

const LangContext = createContext<{ lang: Lang; toggle: () => void; tx: (value: Bilingual) => string }>({
  lang: 'en',
  toggle: () => undefined,
  tx: (value) => value.en,
});
function useLang() { return useContext(LangContext); }

function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const navItems = [
  { href: '/#about', label: b('About', 'Бидний тухай') },
  { href: '/#seats', label: b('Seats', 'Суудал') },
  { href: '/#speakers', label: b('Speakers', 'Илтгэгчид') },
  { href: '/library', label: b('Talks', 'Илтгэлүүд') },
  { href: '/team', label: b('Team', 'Баг') },
  { href: '/apply', label: b('Apply', 'Бүртгүүлэх'), accent: true },
  { href: '/#contact', label: b('Contact', 'Холбоо барих') },
];

function Brand() {
  return <Link href="/" className="brand" data-testid="link-brand" aria-label="TEDx Ulaanbaatar Empathy School Youth">
    <img className="brand-logo-image" src={`${media}tedx-ub-empathy-white.png`} alt="TEDx Ulaanbaatar Empathy School Youth" />
  </Link>;
}

function Nav({ heroMode = false }: { heroMode?: boolean }) {
  const { lang, toggle, tx } = useLang();
  const [open, setOpen] = useState(false);
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => {
    if (!heroMode) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [heroMode]);
  const goToSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.includes('#')) return;
    event.preventDefault();
    const id = href.split('#')[1];
    const scrollToSection = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/#${id}`);
    };
    if (location.split('#')[0] === '/') {
      scrollToSection();
    } else {
      navigate('/');
      window.setTimeout(scrollToSection, 120);
    }
  };
  return <>
    {open && <button className="drawer-shade" onClick={close} aria-label="Close navigation" data-testid="button-close-drawer" />}
    <header className={`nav ${heroMode && !scrolled ? 'hero-nav' : ''}`}>
      <div className="wrap nav-inner">
        <Brand />
        <button className={`menu-button ${open ? 'open' : ''}`} onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open} data-testid="button-toggle-menu">
          <span /><span /><span />
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Primary navigation">
          {navItems.map((item) => {
            const routeBase = location.split('#')[0];
            const active = item.href.startsWith('/#') ? routeBase === '/' : routeBase === item.href;
            return <Link key={item.href} href={item.href} onClick={(event) => { close(); goToSection(event, item.href); }} className={`nav-link ${item.accent ? 'apply' : ''} ${active ? 'active' : ''}`} data-testid={`link-nav-${item.label.en.toLowerCase().replaceAll(' ', '-')}`}>
              {tx(item.label)}
            </Link>;
          })}
          <div className="nav-actions">
            <button className="lang-btn" onClick={toggle} aria-label="Switch language" data-testid="button-language">
              <b>{lang === 'en' ? 'EN' : 'MN'}</b><span> / {lang === 'en' ? 'MN' : 'EN'}</span>
            </button>
            <Link className="button small" href="/#seats" onClick={(event) => { close(); goToSection(event, '/#seats'); }} data-testid="link-reserve-seat">{tx(b('Reserve Seat', 'Суудал захиалах'))}</Link>
          </div>
        </nav>
      </div>
    </header>
  </>;
}

function Footer({ showMap = false }: { showMap?: boolean }) {
  const { tx } = useLang();
  const mapLabels = {
    shareButton: tx(b('Share my location', 'Байршлаа харуулах')),
    sharing: tx(b('Locating…', 'Байршил тогтоож байна…')),
    granted: (km: string) => tx(b(`You're about ${km} km from the venue.`, `Та арга хэмжээний газраас ойролцоогоор ${km} км зайтай байна.`)),
    denied: tx(b('Location permission was denied.', 'Байршлын зөвшөөрөл олгогдсонгүй.')),
    unsupported: tx(b("This browser doesn't support location sharing.", 'Таны хөтөч байршил илрүүлэхийг дэмждэггүй.')),
    positionError: tx(b("Couldn't determine your location.", 'Таны байршлыг тогтоож чадсангүй.')),
    mapError: tx(b('The map failed to load.', 'Газрын зураг ачаалагдсангүй.')),
    schoolPopup: tx(b('MONTE Ballroom', 'МОНТЕ Боллрум')),
    userPopup: tx(b('You are here', 'Та энд байна')),
  };
  return <>
    {showMap && <section className="map-section">
      <div className="wrap map-frame reveal">
        <div className="map-frame-head">
          <span className="eyebrow">{tx(b('Find us', 'Бидний байршил'))}</span>
          <h3>{tx(b('MONTE Ballroom', 'МОНТЕ Боллрум'))}</h3>
          <p className="map-frame-sub">{tx(b('Allow location access to see how far you are from the venue.', 'Байршлын зөвшөөрөл олгосноор та арга хэмжээний газраас хэр зайд байгаагаа харах боломжтой.'))}</p>
        </div>
        <div className="map-embed-wrap">
          <LiveMap labels={mapLabels} />
        </div>
      </div>
    </section>}
    <footer className="footer">
      <div className="wrap footer-inner">
        <div><Brand /><p style={{ marginTop: 14 }}>{tx(b('This independent TEDx event is operated under license from TED.', 'Энэхүү бие даасан TEDx арга хэмжээ нь TED-ийн тусгай зөвшөөрлийн дагуу зохион байгуулагдаж байна.'))}</p></div>
        <p><strong>TEDxUlaanbaatar Empathy School Youth © 2026</strong><br />{tx(b('Ideas worth spreading, from Ulaanbaatar.', 'Түгээх үнэ цэнэтэй санаанууд, Улаанбаатараас.'))}</p>
      </div>
    </footer>
  </>;
}

function Countdown() {
  const { tx } = useLang();
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date('2026-10-25T08:00:00+08:00').getTime() - Date.now()));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, new Date('2026-10-25T08:00:00+08:00').getTime() - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const units = useMemo(() => {
    if (!remaining) return [];
    return [
      [Math.floor(remaining / 86400000), b('Days', 'Өдөр')],
      [Math.floor((remaining / 3600000) % 24), b('Hours', 'Цаг')],
      [Math.floor((remaining / 60000) % 60), b('Mins', 'Минут')],
      [Math.floor((remaining / 1000) % 60), b('Secs', 'Секунд')],
    ] as [number, Bilingual][];
  }, [remaining]);
  if (!remaining) return <div className="countdown countdown-live"><span>{tx(b('Event is live today', 'Арга хэмжээ өнөөдөр болж байна'))}</span></div>;
  return <div className="countdown" aria-label="Event countdown" data-testid="status-countdown">
    {units.map(([number, label]) => <div className="time-block" key={label.en}><strong>{String(number).padStart(2, '0')}</strong><label>{tx(label)}</label></div>)}
  </div>;
}

type SpeakerCategory = 'internal' | 'external-student' | 'guest';

interface SpeakerInfo {
  category: SpeakerCategory;
  type: Bilingual;
  name?: string;
  photo?: string;
  desc: Bilingual;
}

const speakerCategoryLabel: Record<SpeakerCategory, Bilingual> = {
  internal: b('Internal Student Speaker', 'Дотоод сурагч илтгэгч'),
  'external-student': b('External Student Speaker', 'Гадаад сурагч илтгэгч'),
  guest: b('Guest Speaker', 'Зочин илтгэгч'),
};

const announcedSoon = b('Speaker to be announced.', 'Илтгэгч тун удахгүй зарлагдана.');

// 12 speakers across three groups: 4 school students, 4 visiting students,
// and 4 guest speakers. Only confirmed speakers carry a name/photo/bio —
// the rest render as "to be announced" placeholders until finalized.
const speakers: SpeakerInfo[] = [
  {
    category: 'internal',
    type: speakerCategoryLabel.internal,
    name: 'Dalai Davaadorj',
    photo: speakerPhoto('dalai-davaadorj.jpg'),
    desc: b(
      "A student at Ulaanbaatar Empathy School, content creator, and aspiring psychology student who enjoys documenting life and connecting with others — always chasing new challenges that push outside the comfort zone.",
      'Улаанбаатар Эмпати Сургуулийн сурагч, контент бүтээгч, сэтгэл судлалын чиглэлээр суралцахыг хүсдэг. Амьдралаа баримтжуулж, хүмүүстэй харилцахдаа дуртай бөгөөд тав тухаа орхиж шинэ сорилтуудыг эрэлхийлдэг.',
    ),
  },
  {
    category: 'internal',
    type: speakerCategoryLabel.internal,
    name: 'Gan-Udram Ganbat',
    photo: speakerPhoto('gan-udram-ganbat.jpg'),
    desc: b(
      'Pianist of nearly 10 years with a strong interest in astronomy and astrophysics.',
      'Бараг 10 жилийн турш төгөлдөр хуур тоглодог бөгөөд одон орон судлал, астрофизикт сонирхолтой.',
    ),
  },
  {
    category: 'internal',
    type: speakerCategoryLabel.internal,
    name: 'Anarsaikhan',
    photo: speakerPhoto('anarsaikhan.jpg'),
    desc: b(
      'A Mongolian high school student passionate about space science, aerospace engineering, science, and technology — learning by building with his own hands through rocketry, electronics, and 3D-printing projects, with the goal of contributing to the growth of Mongolia\'s space technology sector.',
      'Монголын ахлах ангийн сурагч бөгөөд сансар судлал, aerospace инженерчлэл, шинжлэх ухаан, технологид ихээхэн сонирхолтой. Пуужин бүтээх, электроник болон 3D хэвлэлийн төсөл дээр ажиллаж шинэ зүйл туршиж өөрийн гараар бүтээж сурах хүсэл эрмэлзэлтэй. Цаашдаа инженерийн мэдлэг ур чадвараа хөгжүүлж Монголын сансар технологийн салбарын хөгжилд хувь нэмэр оруулна.',
    ),
  },
  { category: 'internal', type: speakerCategoryLabel.internal, desc: announcedSoon },
  {
    category: 'external-student',
    type: speakerCategoryLabel['external-student'],
    name: 'Baatarkhuu Oyunbaatar',
    photo: speakerPhoto('baatarkhuu-oyunbaatar.jpg'),
    desc: b(
      "Competitive mathematician and graph theory practitioner from Ulaanbaatar, specializing in discrete mathematics and network structures. His work explores how vertices and edges map complex systems, turning abstract mathematical concepts into intuitive frameworks and practical solutions.",
      'Улаанбаатар хотын өрсөлдөөнт математикч, граф онолын судлаач бөгөөд дискрет математик, сүлжээний бүтцэд мэргэшсэн. Орой ба ирмэгүүдээр нарийн төвөгтэй системийг зураглан, хийсвэр математикийн ойлголтыг практик шийдэл болгон хувиргах чиглэлээр ажилладаг.',
    ),
  },
  {
    category: 'external-student',
    type: speakerCategoryLabel['external-student'],
    name: 'Mendbayar Byambadorj',
    photo: speakerPhoto('mendbayar-byambadorj.jpg'),
    desc: b(
      "Two-time silver medalist at the International Chemistry Olympiad and International Biology Olympiad qualifier, with gold in the Mongolian National Biology and silver in National Physics. Scored a perfect 100% in MNB's Scientific Quiz Show and 800, 800, 800, and 795 across Mongolia's national entrance exams in Chemistry, Mathematics, Physics, and Biology.",
      'Олон улсын Химийн олимпиадад хоёр удаа мөнгөн медаль хүртэж, Олон улсын Биологийн олимпиадад шалгарсан, Монголын Үндэсний Биологийн олимпиадад алт, Физикт мөнгө хүртсэн. МҮОНТВ-ийн Эрдэм номын аварга тэмцээнд 100%, Химия, Математик, Физик, Биологийн улсын шалгалтад 800, 800, 800, 795 оноо авсан.',
    ),
  },
  {
    category: 'external-student',
    type: speakerCategoryLabel['external-student'],
    name: 'Shijir Davaa',
    photo: speakerPhoto('shijir-davaa.jpg'),
    desc: b(
      'Pianist for 10 years and drummer for 4, with 1st and 3rd place finishes at an international piano competition in Spain and 1st prize as drummer of electronic instruments at the "Asia Vision" international competition. A lifelong astronomy enthusiast who has pursued the subject through numerous science olympiads.',
      'Испанид болсон олон улсын төгөлдөр хуурын тэмцээнд 1, 3-р байр эзэлж, "Asia Vision" олон улсын тэмцээнд цахим хөгжмийн хэрэгслийн бөмбөрчөөр 1-р байр эзэлсэн. 10 жил төгөлдөр хуур, 4 жил бөмбөр тоглосон. Багаасаа одон орон судлалд дуртай бөгөөд олон шинжлэх ухааны олимпиадад оролцсоор ирсэн.',
    ),
  },
  {
    category: 'external-student',
    type: speakerCategoryLabel['external-student'],
    name: 'Amarbat Amarnaran',
    photo: speakerPhoto('amarbat-amarnaran.jpg'),
    desc: b(
      'National Physics & Math Olympiad medalist and merit scholar — a high-achieving STEM student with multiple national and district honors across physics, mathematics, and chemistry.',
      'Үндэсний Физик, Математикийн олимпиадын медальт, тэргүүн шалгуулагч. Физик, математик, химийн чиглэлээр олон улсын болон дүүргийн олон шагнал хүртсэн.',
    ),
  },
  { category: 'guest', type: speakerCategoryLabel.guest, desc: announcedSoon },
  { category: 'guest', type: speakerCategoryLabel.guest, desc: announcedSoon },
  { category: 'guest', type: speakerCategoryLabel.guest, desc: announcedSoon },
  { category: 'guest', type: speakerCategoryLabel.guest, desc: announcedSoon },
];

const formatMnt = (amount: number) => `${amount.toLocaleString('en-US')}₮`;
const ORGANIZER_EMAIL = 'Sergelenmunkhtushig@gmail.com';

interface SeatState { taken: Set<number>; price: number | null; online: boolean }

function useSeatAvailability() {
  const [state, setState] = useState<SeatState>({ taken: new Set(), price: null, online: false });
  const refresh = async () => {
    try {
      const res = await fetch('/api/seats', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { taken: number[]; price: number };
      setState({ taken: new Set(data.taken), price: data.price, online: true });
    } catch {
      setState((prev) => ({ ...prev, online: false }));
    }
  };
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, []);
  return { ...state, refresh };
}

const checkoutErrors: Record<string, Bilingual> = {
  seat_taken: b('Sorry — someone just took that seat. Please pick another one.', 'Уучлаарай, энэ суудлыг саяхан өөр хүн авлаа. Өөр суудал сонгоно уу.'),
  invalid_fields: b('Please check the highlighted fields.', 'Тэмдэглэгдсэн талбаруудаа шалгана уу.'),
  default: b('Online payment is unavailable right now. Please try again in a moment.', 'Онлайн төлбөр түр ажиллахгүй байна. Хэсэг хугацааны дараа дахин оролдоно уу.'),
};

function SeatCheckout({ seat, price, onTaken, onCancel }: { seat: number; price: number; onTaken: () => void; onCancel: () => void }) {
  const { tx, lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Bilingual | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(null); setBadFields([]);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat, lang, name: data.get('name'), phone: data.get('phone'), email: data.get('email'), school: data.get('school') }),
      });
      const body = (await res.json().catch(() => ({}))) as { followUpLink?: string; error?: string; fields?: string[] };
      if (res.ok && body.followUpLink) { window.location.href = body.followUpLink; return; }
      if (body.error === 'seat_taken') onTaken();
      setBadFields(body.fields ?? []);
      setError(checkoutErrors[body.error ?? ''] ?? checkoutErrors.default);
    } catch {
      setError(checkoutErrors.default);
    }
    setBusy(false);
  };
  const field = (name: string, label: Bilingual, type: string, placeholder: Bilingual | string, autoComplete: string) => (
    <div className={`form-field ${badFields.includes(name) ? 'invalid' : ''}`}>
      <label htmlFor={`checkout-${name}`}>{tx(label)}</label>
      <input id={`checkout-${name}`} name={name} type={type} required autoComplete={autoComplete} placeholder={typeof placeholder === 'string' ? placeholder : tx(placeholder)} data-testid={`input-checkout-${name}`} />
    </div>
  );
  return <form className="seat-checkout" onSubmit={submit} data-testid="form-seat-checkout">
    <div className="seat-checkout-head">
      <div><span className="eyebrow">{tx(b('Your ticket', 'Таны тасалбар'))}</span><h4>{tx(b(`Seat #${seat}`, `№${seat} суудал`))}</h4></div>
      <strong className="seat-checkout-price">{formatMnt(price)}</strong>
    </div>
    <div className="seat-checkout-grid">
      {field('name', b('Full name', 'Овог нэр'), 'text', b('e.g. Anujin Batbayar', 'Жнь: Батбаярын Анужин'), 'name')}
      {field('phone', b('Phone', 'Утас'), 'tel', '9911 2233', 'tel')}
      {field('email', b('Email', 'И-мэйл'), 'email', 'name@example.com', 'email')}
      {field('school', b('School / class', 'Сургууль / анги'), 'text', b('e.g. Empathy School, 11a', 'Жнь: Эмпати сургууль, 11а'), 'organization')}
    </div>
    {error && <div className="seat-checkout-error" role="alert" data-testid="status-checkout-error">{tx(error)}</div>}
    <div className="seat-checkout-actions">
      <button type="button" className="button ghost small" onClick={onCancel}>{tx(b('Cancel', 'Болих'))}</button>
      <button type="submit" className="button" disabled={busy} data-testid="button-pay-qpay">{busy ? tx(b('Opening payment…', 'Төлбөр нээж байна…')) : tx(b(`Pay ${formatMnt(price)} with QPay`, `QPay-ээр ${formatMnt(price)} төлөх`))}</button>
    </div>
    <p className="seat-checkout-note">{tx(b('Your seat is held for 15 minutes while you pay. You will be taken to the secure Bonum payment page to pay with QPay.', 'Төлбөр төлөх хугацаанд суудал тань 15 минут хадгалагдана. Та Bonum-ийн аюулгүй төлбөрийн хуудас руу шилжиж QPay-ээр төлнө.'))}</p>
  </form>;
}

function SeatSelector() {
  const { tx } = useLang();
  const [size, setSize] = useState(23);
  const [selected, setSelected] = useState<number | null>(null);
  const [lostSeat, setLostSeat] = useState<number | null>(null);
  const { taken, price, online, refresh } = useSeatAvailability();
  useEffect(() => { if (selected !== null && taken.has(selected)) { setLostSeat(selected); setSelected(null); } }, [taken, selected]);
  const seat = (number: number) => <button key={number} className={`seat ${taken.has(number) ? 'taken' : ''} ${selected === number ? 'selected' : ''}`} disabled={taken.has(number)} onClick={() => { setLostSeat(null); setSelected(selected === number ? null : number); }} aria-label={`Seat ${number}`} data-testid={`button-seat-${number}`}>{number}</button>;
  const style = { '--seat-size': `${size}px` } as CSSProperties;
  return <div className="seat-panel reveal" id="seats">
    <div className="seat-header">
      <div><h3>{tx(b('Hall Seat Availability', 'Танхимын суудлын мэдээлэл'))}</h3><p>{price ? tx(b(`Pick a seat and pay ${formatMnt(price)} with QPay to book it.`, `Суудлаа сонгоод QPay-ээр ${formatMnt(price)} төлж захиална уу.`)) : tx(b('Tap any available seat to reserve your spot.', 'Сул суудал дээр дарж суудлаа захиална уу.'))}</p></div>
      <div className="seat-count"><strong>{100 - taken.size}</strong><span>{tx(b('Seats remaining / 100 capacity', 'Үлдсэн суудал / нийт 100'))}</span></div>
    </div>
    <label className="seat-controls">{tx(b('View zoom', 'Томруулах'))}<input aria-label="Seat view zoom" type="range" min="15" max="32" value={size} onChange={(event) => setSize(Number(event.target.value))} data-testid="input-seat-zoom" /></label>
    <div className="stage"><div className="stage-bar" /><span>{tx(b('Main podium / stage', 'Гол тайз'))}</span></div>
    <div className="theater">
      <div className="theater-layout" style={style}>
        <div className="wing left"><div className="wing-title">{tx(b('Left wing (30)', 'Зүүн жигүүр (30)'))}</div><div className="seat-grid wing-grid">{Array.from({ length: 30 }, (_, i) => seat(i + 1))}</div></div>
        <div className="wing"><div className="wing-title">{tx(b('Center main (40)', 'Төв хэсэг (40)'))}</div><div className="seat-grid center-grid">{Array.from({ length: 40 }, (_, i) => seat(i + 31))}</div></div>
        <div className="wing right"><div className="wing-title">{tx(b('Right wing (30)', 'Баруун жигүүр (30)'))}</div><div className="seat-grid wing-grid">{Array.from({ length: 30 }, (_, i) => seat(i + 71))}</div></div>
      </div>
    </div>
    <div className="seat-legend"><span className="legend"><i />{tx(b('Available', 'Боломжтой'))}</span><span className="legend"><i className="red" />{tx(b('Selected', 'Сонгосон'))}</span><span className="legend"><i className="taken" />{tx(b('Taken', 'Захиалагдсан'))}</span></div>
    {lostSeat && !selected && <div className="seat-checkout-error seat-lost" role="alert">{tx(b(`Sorry — seat #${lostSeat} was just taken by someone else. Please pick another seat.`, `Уучлаарай, №${lostSeat} суудлыг саяхан өөр хүн авлаа. Өөр суудал сонгоно уу.`))}</div>}
    {selected && online && price
      ? <SeatCheckout key={selected} seat={selected} price={price} onTaken={() => void refresh()} onCancel={() => setSelected(null)} />
      : selected && <div className="seat-selected" data-testid="status-selected-seat">{tx(b(`Seat #${selected} selected — online booking is unavailable right now, please message us to reserve it.`, `№${selected} суудал сонгогдлоо — онлайн захиалга түр ажиллахгүй байна, бидэнд зурвас илгээж захиална уу.`))}</div>}
  </div>;
}

type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'conflict';

function PaymentStatus() {
  const { tx } = useLang();
  const txId = useMemo(() => new URLSearchParams(window.location.search).get('tx') ?? '', []);
  const [order, setOrder] = useState<{ seat: number; status: OrderStatus; name: string; amount: number } | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/order?tx=${encodeURIComponent(txId)}`, { cache: 'no-store' });
        if (res.status === 404) { setMissing(true); return; }
        if (res.ok) {
          const data = (await res.json()) as { seat: number; status: OrderStatus; name: string; amount: number };
          setOrder(data);
          if (data.status !== 'pending') return;
        }
      } catch { /* retry below */ }
      // Bonum confirms payments by webhook, which can take a few seconds.
      if (!stopped && attempts < 60) window.setTimeout(() => void check(), 3000);
    };
    void check();
    return () => { stopped = true; };
  }, [txId]);

  let title: Bilingual; let body: Bilingual; let tone = '';
  if (missing) {
    title = b('Order not found', 'Захиалга олдсонгүй'); tone = 'warn';
    body = b('We could not find this payment. If money left your account, please email us.', 'Энэ төлбөр олдсонгүй. Хэрэв таны данснаас мөнгө гарсан бол бидэнд и-мэйл бичнэ үү.');
  } else if (!order || order.status === 'pending') {
    title = b('Confirming your payment…', 'Төлбөрийг шалгаж байна…');
    body = b('This usually takes a few seconds. Keep this page open.', 'Ихэвчлэн хэдхэн секунд болно. Энэ хуудсыг хаалгүй хүлээнэ үү.');
  } else if (order.status === 'paid') {
    title = b(`Seat #${order.seat} is yours!`, `№${order.seat} суудал таных боллоо!`); tone = 'ok';
    body = b(`Thank you, ${order.name}. Your payment of ${formatMnt(order.amount)} was received and your seat is booked for October 25.`, `Баярлалаа, ${order.name}. Таны ${formatMnt(order.amount)} төлбөр орж, 10-р сарын 25-ны суудал тань баталгаажлаа.`);
  } else if (order.status === 'conflict') {
    title = b('Payment received — we will contact you', 'Төлбөр орсон — бид тантай холбогдоно'); tone = 'warn';
    body = b(`Your payment arrived after your 15-minute hold ended, and seat #${order.seat} had already been sold. We will contact you to give you another seat or a refund.`, `Таны төлбөр 15 минутын хугацаа дууссаны дараа орсон бөгөөд №${order.seat} суудал аль хэдийн зарагдсан байна. Бид тантай холбогдож өөр суудал эсвэл буцаан олголт хийнэ.`);
  } else {
    title = b('Payment not completed', 'Төлбөр хийгдээгүй'); tone = 'warn';
    body = b(`The payment was not completed, so seat #${order.seat} was released. You can pick a seat and try again.`, `Төлбөр хийгдээгүй тул №${order.seat} суудлыг чөлөөллөө. Дахин суудал сонгож оролдоно уу.`);
  }

  return <><Nav /><main className="page-main"><div className="wrap">
    <div className={`payment-status ${tone}`} data-testid="status-payment">
      <div className="eyebrow">{tx(b('Ticket payment', 'Тасалбарын төлбөр'))}</div>
      <h1>{tx(title)}</h1>
      <p>{tx(body)}</p>
      {txId && <p className="payment-ref">{tx(b('Reference', 'Лавлах дугаар'))}: <code>{txId.slice(0, 8).toUpperCase()}</code></p>}
      <div className="hero-row">
        <a href="/#seats" className="button">{tx(b(order?.status === 'paid' ? 'Back to the event' : 'Choose a seat', order?.status === 'paid' ? 'Нүүр хуудас руу буцах' : 'Суудал сонгох'))}</a>
        {tone === 'warn' && <a className="button ghost" href={`mailto:${ORGANIZER_EMAIL}?subject=${encodeURIComponent(`TEDx ticket payment ${txId.slice(0, 8).toUpperCase()}`)}`}><Mail size={14} />{tx(b('Email organizers', 'Зохион байгуулагчид бичих'))}</a>}
      </div>
    </div>
  </div></main><Footer /></>;
}

function SpeakerModal({ speaker, close }: { speaker: { index: number; type: string; name?: string; photo?: string; desc: string } | null; close: () => void }) {
  const { tx } = useLang();
  if (!speaker) return null;
  const label = speaker.name ?? tx(b(`Speaker #${String(speaker.index).padStart(2, '0')}`, `Илтгэгч #${String(speaker.index).padStart(2, '0')}`));
  return <div className="modal-backdrop" onClick={close} role="presentation">
    <div className={`modal ${speaker.photo ? 'has-photo' : ''}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="speaker-modal-title">
      <button className="modal-close" onClick={close} aria-label="Close speaker dialog" data-testid="button-close-speaker"><X /></button>
      {speaker.photo ? <img className="modal-photo" src={speaker.photo} alt={label} /> : null}
      <div className="modal-body">
        <div className="eyebrow">{tx(b(`Speaker #${String(speaker.index).padStart(2, '0')}`, `Илтгэгч #${String(speaker.index).padStart(2, '0')}`))}</div>
        <h2 id="speaker-modal-title">{label}</h2>
        <p className="speaker-type">{speaker.type}</p>
        <p>{speaker.desc}</p>
      </div>
    </div>
  </div>;
}

function Home() {
  const { tx } = useLang();
  useScrollReveal();
  const speakerRef = useRef<HTMLDivElement>(null);
  const [speaker, setSpeaker] = useState<{ index: number; type: string; name?: string; photo?: string; desc: string } | null>(null);
  const [openSession, setOpenSession] = useState<number | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  const scrollSpeakers = (offset: number) => speakerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `/#${id}`);
  };
  const sessions = [
    [b('Morning Doors & Rehearsal', 'Өглөөний бүртгэл & бэлтгэл'), '08:00 AM – 10:15 AM', [['08:00 AM – 09:00 AM', b('Team & Speaker Preparation', 'Баг болон илтгэгчдийн бэлтгэл')], ['09:30 AM – 10:15 AM', b('Registration & Check-In', 'Бүртгэл & хүлээн авалт')]]],
    [b('SESSION 1 — Local Roots & Discovery', 'ХЭСЭГ 1 — Орон нутгийн үнэ цэнэ'), '10:15 AM – 11:21 AM', [['10:15 AM', b('Opening & Welcome', 'Нээлтийн үйл ажиллагаа')], ['10:20 AM – 11:20 AM', b('Speaker Block 1 (Coming Soon)', 'Илтгэгчид 1 (тун удахгүй)')]]],
    [b('SESSION 2 — Science, Technology & Systems', 'ХЭСЭГ 2 — Шинжлэх ухаан, технологи'), '12:00 PM – 01:12 PM', [['12:00 PM – 01:12 PM', b('Speaker Block 2 (Coming Soon)', 'Илтгэгчид 2 (тун удахгүй)')]]],
    [b('SESSION 3 — Mind, Culture & Society', 'ХЭСЭГ 3 — Оюун ухаан, соёл, нийгэм'), '02:15 PM – 03:18 PM', [['02:15 PM – 03:18 PM', b('Speaker Block 3 (Coming Soon)', 'Илтгэгчид 3 (тун удахгүй)')]]],
  ] as [Bilingual, string, [string, Bilingual][]][];
  return (
    <>
      <Nav heroMode />
      <main>
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <video autoPlay muted loop playsInline preload="metadata" poster={`${media}school-campus-cinematic.png`}>
              <source src={`${media}school-hero.mp4`} type="video/mp4" />
            </video>
          </div>
          <div className="wrap hero-content">
            <h1 className="hero-opening-title">{tx(b('TEDx Ulaanbaatar Empathy School Youth 2026', 'TEDx Улаанбаатар Эмпати Сургуулийн Залуус 2026'))}</h1>
            <div className="hero-center-mark reveal"><img src={`${media}tedx-ub-empathy-white.png`} alt="TEDx Ulaanbaatar Empathy School Youth" /></div>
            <p className="hero-intro reveal delay-1">{tx(b('12 voices. 100 seats. One day of live student ideas, teacher perspectives, and youth-led innovation in Ulaanbaatar.', '12 дуу хоолой. 100 суудал. Улаанбаатар хотын сурагчдын идэвхи санаачилга, багш нарын үзэл бодол, залуусын инновацийг түгээх нэг өдөр.'))}</p>
            <Countdown />
            <div className="hero-row reveal delay-2"><Link href="/#seats" onClick={(event) => scrollToSection(event, 'seats')} className="button" data-testid="link-hero-reserve">{tx(b('Reserve your seat', 'Суудлаа захиалах'))}</Link><Link href="/#speakers" onClick={(event) => scrollToSection(event, 'speakers')} className="button ghost" data-testid="link-hero-speakers">{tx(b('Meet the speakers', 'Илтгэгчидтэй танилцах'))}</Link></div>
            <div className="hero-meta reveal delay-3"><span>{tx(b('Sunday, October 25, 2026', '2026 оны 10-р сарын 25, Ням гараг'))}</span><b>•</b>{tx(b('MONTE Ballroom, Ulaanbaatar', 'МОНТЕ Боллрум, Улаанбаатар'))}</div>
          </div>
        </section>
        <section className="section overview" id="about">
          <div className="wrap reveal">
            <div className="eyebrow">{tx(b('01 / Event Overview', '01 / Үйл ажиллагааны тухай'))}</div><h2 className="section-title">{tx(b('Ideas Worth Spreading', 'Үнэ цэнэтэй санаануудыг түгээх'))}</h2>
            <div className="intro-grid"><div className="quote">“Empathy isn't just something you feel. <span>It's the willingness to stop, listen, and see the world through someone else's eyes.”</span></div><div className="body-copy"><p>{tx(b('We are a team of student organizers at Ulaanbaatar Empathy School creating a platform where youth voices, young innovators, and passionate educators take center stage.', 'Бид Улаанбаатар Эмпати Сургуулийн сурагчдын зохион байгуулсан баг бөгөөд залуусын дуу хоолой, шинийг санаачлагчид, хүсэл тэмүүлэлтэй сурган хүмүүжүүлэгчдийг тайзан дээр гаргах платформыг бүрдүүлж байна.'))}</p><p>{tx(b('On Sunday, October 25, 2026, MONTE Ballroom will bring together 100 attendees for a day of live presentations, curated TEDTalks videos, and deep conversations.', '2026 оны 10-р сарын 25-ны Ням гарагт МОНТЕ Боллрумд 100 оролцогч цугларч, амьд илтгэлүүд, сонгомол TEDTalks бичлэгүүд үзэж, гүн гүнзгий хэлэлцүүлэг өрнүүлэх болно.'))}</p></div></div>
             <div className="compliance"><h3>{tx(b('What is TEDx?', 'TEDx гэж юу вэ?'))}</h3><p>{tx(b('In the spirit of ideas worth spreading, TED has created a program called TEDx. TEDx is a program of local, self-organized events that bring people together to share a TED-like experience. Our event is called TEDxUlaanbaatar Empathy School Youth, where x = independently organized TED event. TEDTalks video and live speakers combine to spark deep discussion and connection in a small group.', 'Түгээх үнэ цэнэтэй санааг дэмжих зорилгоор TED нь TEDx хэмээх хөтөлбөрийг бий болгосон. TEDx бол орон нутгийн түвшинд бие даан зохион байгуулагддаг, хүмүүсийг нэгтгэн TED-тэй ижил туршлагыг хуваалцах хөтөлбөр юм. Бидний арга хэмжээ TEDxUlaanbaatar Empathy School Youth бөгөөд x нь бие даан зохион байгуулагдсан TED арга хэмжээ гэсэн үг. TEDTalks бичлэгүүд болон амьд илтгэгчид хосолж, гүнзгий хэлэлцүүлэг, холбоо үүсгэнэ.'))}</p><p>{tx(b('Learn more about the global ', 'Олон улсын '))}<a href="https://www.ted.com/tedx" target="_blank" rel="noopener noreferrer">TEDx Program →</a></p></div>
             <div className="venue"><div><h3>{tx(b('Venue: MONTE Ballroom', 'Байршил: МОНТЕ Боллрум'))}</h3><p>{tx(b('Our event takes place at MONTE Ballroom, equipped with modern audiovisual systems, a stage, and an interactive horseshoe-style arrangement designed to spark connection between speakers and audience members.', 'Манай арга хэмжээ МОНТЕ Боллрумд, орчин үеийн дуу дүрсний системтэй, тайзтай, илтгэгч болон үзэгчдийн хооронд харилцаа үүсгэхэд зориулагдсан тах хэлбэрийн зохион байгуулалттай танхимд болно.'))}</p><span className="location"><MapPin size={14} />{tx(b('HUD, 11th khoroo, Khan-Uul District, Ulaanbaatar 17023', 'ХУД, 11-р хороо, Хан-Уул дүүрэг, Улаанбаатар 17023'))}</span></div><div className="venue-art"><img src={`${media}school-campus.jpg`} alt="MONTE Ballroom venue" /></div></div>
             <SeatSelector />
           </div>
         </section>
          <section className="section" id="speakers"><div className="wrap reveal"><div className="eyebrow">{tx(b('02 / On Stage', '02 / Тайзнаа'))}</div><h2 className="section-title">{tx(b('12 Live Speakers', '12 Илтгэгч'))}</h2><div className="speakers-head"><div className="pills"><span className="pill"><b>4</b>{tx(b('Internal Students', 'Дотоод сурагчид'))}</span><span className="pill"><b>4</b>{tx(b('External Students', 'Гадаад сурагчид'))}</span><span className="pill"><b>4</b>{tx(b('Guest Speakers', 'Зочин илтгэгчид'))}</span></div><div className="scroll-buttons"><button className="icon-button" onClick={() => scrollSpeakers(-260)} aria-label="Scroll speakers left" data-testid="button-speakers-left"><ArrowLeft size={16} /></button><button className="icon-button" onClick={() => scrollSpeakers(260)} aria-label="Scroll speakers right" data-testid="button-speakers-right"><ArrowRight size={16} /></button></div></div><div className="speaker-scroll" ref={speakerRef}>{speakers.map((info, index) => { const type = tx(info.type); const desc = tx(info.desc); const displayName = info.name ?? tx(b(`Speaker #${String(index + 1).padStart(2, '0')}`, `Илтгэгч #${String(index + 1).padStart(2, '0')}`)); return <button className="speaker-card" key={`${type}-${index}`} onClick={() => setSpeaker({ index: index + 1, type, name: info.name, photo: info.photo, desc })} data-testid={`button-speaker-${index + 1}`}><div className={`speaker-avatar ${info.photo ? 'has-photo' : ''}`}>{info.photo ? <img src={info.photo} alt={info.name ?? ''} /> : '?'}<div className="speaker-avatar-overlay"><p className="speaker-avatar-desc">{desc}</p><span className="speaker-avatar-cta">{tx(b('View full profile', 'Дэлгэрэнгүй харах'))}</span></div></div><div className="speaker-type">{type}</div><div className="speaker-name">{displayName}</div><p className="speaker-desc">{desc}</p></button>; })}</div></div></section>
         <section className="section schedule" id="schedule"><div className="wrap reveal"><div className="eyebrow">{tx(b('03 / Timetable', '03 / Цагийн хуваарь'))}</div><h2 className="section-title">{tx(b('Event Schedule (Coming Soon)', 'Арга хэмжээний хөтөлбөр (Тун удахгүй)'))}</h2><p className="muted">{tx(b('Click on a session below to view details.', 'Доорх хэсэгт дарж дэлгэрэнгүй хуваарийг харна уу.'))}</p><div className="schedule-list">{sessions.map(([title, time, rows], index) => <div className={`session ${openSession === index ? 'open' : ''}`} key={title.en}><button className="session-header" onClick={() => setOpenSession(openSession === index ? null : index)} aria-expanded={openSession === index} data-testid={`button-schedule-${index}`}><div><h3>{tx(title)}</h3><span className="session-badge">{time}</span></div><span className="toggle">{openSession === index ? '−' : '+'}</span></button><div className="session-items">{rows.map(([rowTime, event]) => <div className="schedule-row" key={rowTime}><div className="time">{rowTime}</div><div className="event">{tx(event)}</div></div>)}</div></div>)}</div></div></section>
          <section className="section" id="contact"><div className="wrap reveal"><div className="eyebrow">{tx(b('04 / Get In Touch', '04 / Холбоо барих'))}</div><h2 className="section-title">{tx(b('Reach Out to Our Team', 'Бидэнтэй холбогдох'))}</h2><div className="contact-grid"><div className="info-card"><h3>{tx(b('Organizers', 'Зохион байгуулагчид'))}</h3><div className="organizer"><div><strong>Munkhtushig Sergelen</strong><p>{tx(b('Organizer / strategic operations', 'Зохион байгуулагч / стратеги'))}</p></div><span>01</span></div><div className="organizer"><div><strong>G. Munkh-Erdene</strong><p>{tx(b('Co-organizer / venue execution', 'Хамтран зохион байгуулагч / талбай'))}</p></div><span>02</span></div><div className="socials"><a href="mailto:hello@tedxubempathy.school"><Mail size={14} />Email</a></div></div><div className="form-card"><h3>{tx(b('Send a Message', 'Зурвас илгээх'))}</h3><form onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const name = String(data.get('fullName') ?? '');
              const emailAddress = String(data.get('emailAddress') ?? '');
              const message = String(data.get('message') ?? '');
              const subject = encodeURIComponent(`TEDx Ulaanbaatar website message from ${name}`);
              const body = encodeURIComponent(`Name: ${name}\nEmail: ${emailAddress}\n\nMessage:\n${message}`);
              window.location.href = `mailto:${ORGANIZER_EMAIL}?subject=${subject}&body=${body}`;
              setMessageSent(true);
              form.reset();
              window.setTimeout(() => setMessageSent(false), 4500);
            }}><div className="form-field"><label htmlFor="fullName">{tx(b('Your Name', 'Таны нэр'))}</label><input id="fullName" name="fullName" required placeholder={tx(b('e.g. Anujin Batbayar', 'Жнь: Анужин Батбаяр'))} data-testid="input-full-name" /></div><div className="form-field"><label htmlFor="emailAddress">{tx(b('Email Address', 'И-мэйл хаяг'))}</label><input id="emailAddress" name="emailAddress" type="email" required placeholder="name@example.com" data-testid="input-email" /></div><div className="form-field"><label htmlFor="message">{tx(b('Message / Question', 'Таны зурвас'))}</label><textarea id="message" name="message" rows={4} required placeholder={tx(b('How can we help you?', 'Бид танд хэрхэн туслах вэ?'))} data-testid="input-message" /></div><button className="button" type="submit" data-testid="button-send-message"><Send size={15} />{tx(b('Send Message', 'Илгээх'))}</button>{messageSent && <div className="form-success" data-testid="status-message-sent"><Check size={15} /> {tx(b("Message received! We'll reply shortly.", 'Зурвас хүлээн авлаа! Бид удахгүй хариу өгөх болно.'))}</div>}</form></div></div></div></section>
       </main>
      <Footer showMap />
      <SpeakerModal speaker={speaker} close={() => setSpeaker(null)} />
    </>
  );
}

function Library() {
  const { tx } = useLang();
  useScrollReveal();
  return <><Nav /><main className="page-main talks-page"><div className="wrap"><div className="coming-soon-wrapper reveal"><h1 className="aesthetic-text">{tx(b('Coming Soon', 'Тун удахгүй'))}</h1><p className="coming-soon-sub">{tx(b('The full library of live ideas, student talks, and inspiration will be unlocked right here after the event concludes.', 'Арга хэмжээ дууссаны дараа сурагчдын болон зочдын бүх илтгэлийн бичлэгүүд энд байрших болно.'))}</p></div></div></main><Footer /></>;
}

interface TeamMemberInfo {
  dept: string;
  role: Bilingual;
  // Full names (including family/surname) are supported here — this is a
  // plain string, so nothing about the layout or initials logic below
  // assumes a single-word name.
  name: string;
  photo?: string;
  bio: Bilingual;
}

const teamMembers: TeamMemberInfo[] = [
  { dept: 'leadership', role: b('Licensee & Lead Organizer', 'Франчайз эзэмшигч ба ахлах зохион байгуулагч'), name: 'Munkhtushig Sergelen', photo: teamPhoto('munkhtushig.jpg'), bio: b('Directing strategic operations, licensing compliance, and overarching vision for the event.', 'Арга хэмжээний стратеги, франчайз зөвшөөрөл болон ерөнхий чиглэлийг удирдан чиглүүлэгч.') },
  { dept: 'leadership', role: b('Co-Organizer', 'Хамтран зохион байгуулагч'), name: 'G. Munkh-Erdene', photo: teamPhoto('munkherdene.jpg'), bio: b('Coordinating department workflows, operational planning, and venue execution.', 'Албадын үйл ажиллагаа, операци төлөвлөлт болон талбайн зохион байгуулалтыг зохицуулагч.') },
  { dept: 'technical-stage', role: b('Stage & Technical Lead', 'Тайз, техникийн ахлагч'), name: 'Anar Bayanjargal', photo: teamPhoto('anar.jpg'), bio: b('Leading technical production — stage systems, audiovisual setup, and live-event technical direction from rehearsal through showtime.', 'Тайзны систем, дуу дүрсний тохиргоо болон амьд үзүүлбэрийн техникийн удирдлагыг бэлтгэлээс эхлэн тайзны үйл ажиллагаа хүртэл хариуцагч.') },
  { dept: 'technical-stage', role: b('Stage & Technical Team', 'Тайз, техникийн баг'), name: 'Gan-Erdene Boldbaatar', bio: b('Supporting stage setup, audiovisual systems, and live technical operations.', 'Тайзны бэлтгэл, дуу дүрсний систем болон техникийн үйл ажиллагааг дэмжигч.') },
  { dept: 'curation', role: b('Curation Team Lead', 'Куратор багийн ахлагч'), name: 'Ariunjargal Mergenbayar', photo: teamPhoto('ariunjargal.jpg'), bio: b('Team member to be revealed soon.', 'Багийн гишүүн удахгүй зарлагдана.') },
  { dept: 'curation', role: b('Curation Team', 'Куратор баг'), name: 'Nandin-Erdene Bayartsogt', photo: teamPhoto('nandin-erdene.jpg'), bio: b('Helping select, shape, and prepare the talks and ideas shared on stage.', 'Тайзнаа хуваалцах илтгэл, санааг сонгох, бэлтгэхэд оролцогч.') },
  { dept: 'marketing', role: b('Marketing Lead', 'Маркетингийн ахлагч'), name: 'Munkhjin Chinbatbold', photo: teamPhoto('munkhjin.jpg'), bio: b('Directing visual branding, digital media assets, stage production aesthetics, and creative direction.', 'Арга хэмжээний визуал брэнд, дижитал контент, тайзны дизайн болон бүтээлч чиглэлийг хариуцагч.') },
  { dept: 'marketing', role: b('Marketing Team', 'Маркетингийн баг'), name: 'Khuslen Baigalimurun', bio: b('Supporting promotion, social media, and outreach for the event.', 'Арга хэмжээний сурталчилгаа, сошиал медиа болон түгээлтийг дэмжигч.') },
  { dept: 'logistics', role: b('Logistics Lead', 'Логистикийн ахлагч'), name: 'Munkhtushig Sergelen', photo: teamPhoto('munkhtushig.jpg'), bio: b('Also leading logistics planning and on-the-ground operations for the event.', 'Арга хэмжээний логистик төлөвлөлт болон газар дээрх үйл ажиллагааг давхар хариуцагч.') },
  { dept: 'logistics', role: b('Logistics Team', 'Логистикийн баг'), name: 'Emuujin Mungunshagai', photo: teamPhoto('emuujin.jpg'), bio: b('Supporting logistics planning and on-the-day operations for the event.', 'Арга хэмжээний логистик төлөвлөлт болон тухайн өдрийн үйл ажиллагааг дэмжигч.') },
  { dept: 'finance', role: b('Finance Manager', 'Санхүүгийн менежер'), name: 'Y. Namuunzaya', photo: teamPhoto('namuunzaya.jpg'), bio: b('Team member to be revealed soon.', 'Багийн гишүүн удахгүй зарлагдана.') },
];

function TeamModal({ member, deptLabel, close }: { member: TeamMemberInfo | null; deptLabel: string; close: () => void }) {
  const { tx } = useLang();
  if (!member) return null;
  const initials = member.name === '?' ? '?' : member.name.slice(0, 1);
  return <div className="modal-backdrop" onClick={close} role="presentation">
    <div className={`modal ${member.photo ? 'has-photo' : ''}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="team-modal-title">
      <button className="modal-close" onClick={close} aria-label="Close member dialog" data-testid="button-close-member"><X /></button>
      {member.photo ? <img className="modal-photo" src={member.photo} alt={member.name} /> : <div className="modal-avatar" aria-hidden="true">{initials}</div>}
      <div className="modal-body">
        <div className="eyebrow">{deptLabel}</div>
        <h2 id="team-modal-title">{member.name === '?' ? tx(b('To be announced', 'Тун удахгүй зарлагдана')) : member.name}</h2>
        <p className="speaker-type">{tx(member.role)}</p>
        <p>{tx(member.bio)}</p>
      </div>
    </div>
  </div>;
}

const teamDepartments: [string, Bilingual][] = [
  ['leadership', b('Leadership', 'Удирдлага')],
  ['logistics', b('Logistics', 'Логистик')],
  ['technical-stage', b('Technical and Stage Management', 'Техник ба тайзны менежмент')],
  ['marketing', b('Marketing', 'Маркетинг')],
  ['finance', b('Finance', 'Санхүү')],
  ['curation', b('Curation', 'Куратор')],
];

function Team() {
  const { tx } = useLang();
  const [filter, setFilter] = useState('all');
  const [activeMember, setActiveMember] = useState<TeamMemberInfo | null>(null);
  useScrollReveal([filter]);
  const visible = filter === 'all' ? teamMembers : teamMembers.filter((member) => member.dept === filter);
  const activeDeptLabel = activeMember ? tx(teamDepartments.find(([id]) => id === activeMember.dept)?.[1] ?? b('', '')) : '';
  return <>
    <Nav />
    <main className="page-main team-page">
      <section className="team-hero">
        <div className="wrap team-hero-grid reveal">
          <div className="team-hero-copy">
            <div className="eyebrow">{tx(b('Behind the Stage', 'Тайзны ард'))}</div>
            <h1>{tx(b('Meet the ', 'Зохион байгуулах багтай '))}<em>{tx(b('visionaries.', 'танилц.'))}</em></h1>
            <p>{tx(b('The dedicated team working behind the scenes to make this event happen.', 'Энэхүү эвэнтэд зориулан тайзны ард ажиллаж буй манай баг хамт олон.'))}</p>
          </div>
          <aside className="team-hero-note">
            <div className="team-note-index">01 — 06</div>
            <div className="team-note-line" />
            <p>{tx(b('A student-led crew building a room for ideas, one detail at a time.', 'Санаа бүрт зориулсан орон зайг нарийн ширийн зүйл бүрээр бүтээж буй сурагчдын баг.'))}</p>
            <div className="team-note-meta"><span>TEDx Ulaanbaatar</span><strong>Empathy School Youth</strong></div>
          </aside>
        </div>
        <div className="wrap">
          <div className="stats">
            <div className="stat"><strong>{new Set(teamMembers.filter((m) => m.name !== '?').map((m) => m.name)).size + teamMembers.filter((m) => m.name === '?').length}</strong><span>{tx(b('Total members', 'Нийт гишүүд'))}</span></div>
            <div className="stat"><strong>06</strong><span>{tx(b('Departments', 'Албадууд'))}</span></div>
            <div className="stat"><strong>100%</strong><span>{tx(b('Volunteer driven', 'Сайн дурын баг'))}</span></div>
            <div className="stat"><strong>2026</strong><span>{tx(b('Edition team', '2026 оны баг'))}</span></div>
          </div>
        </div>
      </section>
      <div className="filter-bar">
        <div className="wrap">
          <div className="filters">
            <button className={`filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} data-testid="button-filter-all">{tx(b('All Departments', 'Бүх алба'))}</button>
            {teamDepartments.map(([id, label]) => <button key={id} className={`filter ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)} data-testid={`button-filter-${id}`}>{tx(label)}</button>)}
          </div>
        </div>
      </div>
      <div className="wrap team-content">
        <div className="team-intro-row">
          <div className="eyebrow">{tx(b('Organizing core', 'Зохион байгуулах баг'))}</div>
          <p>{tx(b('Meet the people turning one shared idea into a full day of voices, movement, and connection. Tap a member to read more.', 'Нэг санааг дуу хоолой, хөдөлгөөн, харилцаагаар дүүрэн бүтэн өдөр болгон хувиргаж буй хүмүүстэй танилцаарай. Дэлгэрэнгүй мэдээлэл авахын тулд гишүүн дээр дарна уу.'))}</p>
        </div>
        {teamDepartments.filter(([id]) => filter === 'all' || id === filter).map(([id, label]) => {
          const members = visible.filter((member) => member.dept === id);
          if (!members.length) return null;
          return <section className="dept" key={id}>
            <div className="dept-heading"><h2>{tx(label)}</h2><i /><span>{members.length} {tx(b('Members', 'Гишүүн'))}</span></div>
            <div className="roster-list">
              {members.map((member, index) => <button type="button" className="roster-member" key={`${id}-${index}`} onClick={() => setActiveMember(member)} data-testid={`button-member-${id}-${index}`}>
                <div className="roster-index">{String(index + 1).padStart(2, '0')}</div>
                <div className={`roster-initials ${member.photo ? 'has-photo' : ''}`} aria-hidden="true">{member.photo ? <img src={member.photo} alt={member.name} /> : (member.name === '?' ? '?' : member.name.slice(0, 1))}</div>
                <div className="roster-person"><div className="member-role">{tx(member.role)}</div><h3>{member.name === '?' ? tx(b('To be announced', 'Тун удахгүй зарлагдана')) : member.name}</h3></div>
                <p className="roster-bio">{tx(member.bio)}</p>
                <span className="roster-arrow" aria-hidden="true">↗</span>
              </button>)}
            </div>
          </section>;
        })}
      </div>
    </main>
    <Footer />
    <TeamModal member={activeMember} deptLabel={activeDeptLabel} close={() => setActiveMember(null)} />
  </>;
}

// Application deadline for speaker & team recruitment forms.
// Edit this single line to move the deadline — everything else (badge,
// countdown, date text) recalculates automatically.
const APPLICATION_DEADLINE = new Date('2026-10-14T23:59:00+08:00');

function ApplyDeadline() {
  const { tx, lang } = useLang();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = APPLICATION_DEADLINE.getTime() - now;
  const closed = remaining <= 0;
  const warn = !closed && remaining <= 3 * 86400000;
  const statusClass = closed ? 'closed' : warn ? 'warn' : 'open';
  const statusLabel = closed
    ? b('Closed', 'Хаагдсан')
    : warn
    ? b('Closing soon', 'Удахгүй хаагдана')
    : b('Open', 'Нээлттэй');

  const dateText = APPLICATION_DEADLINE.toLocaleDateString(lang === 'mn' ? 'mn-MN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const countdown = useMemo(() => {
    if (closed) return null;
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining / 3600000) % 24);
    const mins = Math.floor((remaining / 60000) % 60);
    return b(
      `${days}d ${hours}h ${mins}m left`,
      `${days} өдөр ${hours} цаг ${mins} минут үлдлээ`,
    );
  }, [remaining, closed]);

  return (
    <div className="deadline-card reveal" data-testid="card-apply-deadline">
      <div className="deadline-info">
        <span className={`deadline-badge ${statusClass}`} data-testid="status-deadline-badge">
          {tx(statusLabel)}
        </span>
        <div className="deadline-text">
          <span className="deadline-label">{tx(b('Application deadline', 'Анкет хүлээн авах эцсийн хугацаа'))}</span>
          <span className="deadline-date">{dateText}</span>
        </div>
      </div>
      {countdown && (
        <span className="deadline-countdown" data-testid="status-deadline-countdown">
          {tx(countdown)}
        </span>
      )}
    </div>
  );
}

function Apply() {
  const { tx } = useLang();
  useScrollReveal();
  return <><Nav /><main className="page-main"><section className="page-hero"><div className="wrap reveal"><div className="eyebrow">{tx(b('Applications & Recruitment', 'Илтгэгч ба багийн бүртгэл'))}</div><h1>{tx(b('Put your idea in the room.', 'Санаагаа танхимд авчир.'))}</h1><p>{tx(b('Choose an application below to apply as a speaker or join the organizing team for 2026.', '2026 оны TEDx арга хэмжээнд илтгэгчээр оролцох эсвэл зохион байгуулах багт нэгдэх анкет.'))}</p><ApplyDeadline /></div></section><section className="section" style={{ paddingTop: 25 }}><div className="wrap"><div className="apply-grid"><article className="apply-card"><div><span className="badge">{tx(b('Stage call', 'Илтгэгчийн урилга'))}</span><h2>{tx(b('Speaker Application', 'Илтгэгчийн анкет'))}</h2><p>{tx(b('Have an idea worth spreading? We are looking for student leaders, educators, and visionaries to share ideas live on stage.', 'Та залууст хүргэх үнэ цэнэтэй санаатай юу? Тайзан дээр илтгэл тавих сурагчид, багш нар болон зочдыг урьж байна.'))}</p></div><a className="button" href="https://docs.google.com/forms/d/e/1FAIpQLSeDVXkHyLZ36OvnBQ0OesNOzop77LhwibkIZZxv4QJeupXg6w/viewform?usp=header" target="_blank" rel="noopener noreferrer" data-testid="link-apply-speaker">{tx(b('Apply as Speaker', 'Илтгэгчээр бүртгүүлэх'))}<ArrowRight size={15} /></a></article><article className="apply-card"><div><span className="badge">{tx(b('Organizing core', 'Зохион байгуулах баг'))}</span><h2>{tx(b('Team Recruitment', 'Багийн гишүүний анкет'))}</h2><p>{tx(b('Join our student team across Media & Design, Stage & Technical, and Logistics departments to bring TEDx to life.', 'Медиа, Дизайн, Техник болон Ложистикийн багт нэгдэж TEDx арга хэмжээг хамтдаа бүтээгээрэй.'))}</p></div><a className="button" href="https://docs.google.com/forms/d/e/1FAIpQLSfuZkbisjE0HeH8m-O9R7mwU2li7bBOOlNYU4jC1OtDca1U9Q/viewform?usp=header" target="_blank" rel="noopener noreferrer" data-testid="link-apply-team">{tx(b('Join the Team', 'Багт нэгдэх'))}<ArrowRight size={15} /></a></article></div><div className="footer-cta"><h2>{tx(b('Ready to leave your mark?', 'Өөрийн мөрийг үлдээхэд бэлэн үү?'))}</h2><p>{tx(b('Whether you have an idea worth spreading or want to help build the event behind the scenes, we want you on board.', 'Та тайзан дээр илтгэл тавих эсвэл зохион байгуулах багт нэгдэхийг хүссэн ч бид таныг урьж байна.'))}</p></div></div></section></main><Footer /></>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/library" component={Library} /><Route path="/team" component={Team} /><Route path="/apply" component={Apply} /><Route path="/payment" component={PaymentStatus} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  const [lang, setLang] = useState<Lang>('en');
  const toggle = () => setLang((value) => value === 'en' ? 'mn' : 'en');
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><LangContext.Provider value={{ lang, toggle, tx: (value) => value[lang] }}><Router /></LangContext.Provider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;