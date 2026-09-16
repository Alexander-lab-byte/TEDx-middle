import { type CSSProperties, type MouseEvent, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Mail, MapPin, Send, X } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

type Lang = 'en' | 'mn';
type Bilingual = { en: string; mn: string };
const b = (en: string, mn: string): Bilingual => ({ en, mn });
const queryClient = new QueryClient();
const media = `${import.meta.env.BASE_URL}media/`;

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

function Footer() {
  const { tx } = useLang();
  return <>
    <section className="map-section">
      <iframe
        className="map-embed"
        title="Ulaanbaatar Empathy School location"
        src="https://www.google.com/maps?q=Ulaanbaatar+Empathy+School,+Ulaanbaatar,+Mongolia&output=embed"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </section>
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
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date('2026-10-24T08:00:00+08:00').getTime() - Date.now()));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, new Date('2026-10-24T08:00:00+08:00').getTime() - Date.now())), 1000);
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

const speakers = [
  ['Local Teacher Speaker', '12-minute talk exploring interactive learning and critical student thinking.'],
  ['Student Speaker', '6-minute talk on balancing modern digital life with high school growth.'],
  ['External Speaker', '15-minute talk on community resilience and local youth initiatives.'],
  ['Student Speaker', '6-minute talk on creative digital storytelling in modern Mongolia.'],
  ['Local Teacher Speaker', '12-minute talk bridging classroom curiosity with practical life skills.'],
  ['Student Speaker', '5-minute talk on peer empathy, mental strength, and supporting friends.'],
  ['External Speaker', '15-minute talk on tech ethics and building responsible AI tools.'],
  ['Student Speaker', '6-minute talk on youth action for urban sustainability.'],
];

function SeatSelector() {
  const { tx } = useLang();
  const [size, setSize] = useState(23);
  const [selected, setSelected] = useState<number | null>(null);
  const taken = useMemo(() => new Set<number>([]), []);
  const seat = (number: number) => <button key={number} className={`seat ${taken.has(number) ? 'taken' : ''} ${selected === number ? 'selected' : ''}`} disabled={taken.has(number)} onClick={() => setSelected(selected === number ? null : number)} aria-label={`Seat ${number}`} data-testid={`button-seat-${number}`}>{number}</button>;
  const style = { '--seat-size': `${size}px` } as CSSProperties;
  return <div className="seat-panel reveal" id="seats">
    <div className="seat-header">
      <div><h3>{tx(b('Hall Seat Availability', 'Танхимын суудлын мэдээлэл'))}</h3><p>{tx(b('Tap any available seat to reserve your spot.', 'Сул суудал дээр дарж суудлаа захиална уу.'))}</p></div>
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
    {selected && <div className="seat-selected" data-testid="status-selected-seat">{tx(b(`Seat #${selected} selected — message us to complete registration.`, `№${selected} суудал сонгогдлоо — бүртгэлээ дуусгахын тулд бидэнд зурвас илгээнэ үү.`))}</div>}
  </div>;
}

function SpeakerModal({ speaker, close }: { speaker: { index: number; type: string; desc: string } | null; close: () => void }) {
  const { tx } = useLang();
  if (!speaker) return null;
  return <div className="modal-backdrop" onClick={close} role="presentation">
    <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="speaker-modal-title">
      <button className="modal-close" onClick={close} aria-label="Close speaker dialog" data-testid="button-close-speaker"><X /></button>
      <div className="eyebrow">{tx(b(`Speaker #${String(speaker.index).padStart(2, '0')}`, `Илтгэгч #${String(speaker.index).padStart(2, '0')}`))}</div>
      <h2 id="speaker-modal-title">{tx(b('Featured Speaker', 'Онцлох илтгэгч'))} {String(speaker.index).padStart(2, '0')}</h2>
      <p className="speaker-type">{speaker.type}</p>
      <p>{speaker.desc}</p>
    </div>
  </div>;
}

function Home() {
  const { tx } = useLang();
  useScrollReveal();
  const speakerRef = useRef<HTMLDivElement>(null);
  const [speaker, setSpeaker] = useState<{ index: number; type: string; desc: string } | null>(null);
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
            <p className="hero-intro reveal delay-1">{tx(b('8 voices. 100 seats. One day of live student ideas, teacher perspectives, and youth-led innovation in Ulaanbaatar.', '8 дуу хоолой. 100 суудал. Улаанбаатар хотын сурагчдын идэвхи санаачилга, багш нарын үзэл бодол, залуусын инновацийг түгээх нэг өдөр.'))}</p>
            <Countdown />
            <div className="hero-row reveal delay-2"><Link href="/#seats" onClick={(event) => scrollToSection(event, 'seats')} className="button" data-testid="link-hero-reserve">{tx(b('Reserve your seat', 'Суудлаа захиалах'))}</Link><Link href="/#speakers" onClick={(event) => scrollToSection(event, 'speakers')} className="button ghost" data-testid="link-hero-speakers">{tx(b('Meet the speakers', 'Илтгэгчидтэй танилцах'))}</Link></div>
            <div className="hero-meta reveal delay-3"><span>{tx(b('Saturday, October 24, 2026', '2026 оны 10-р сарын 24, Бямба гараг'))}</span><b>•</b>{tx(b('Ulaanbaatar Empathy School, Mongolia', 'Улаанбаатар Эмпати Сургууль, Монгол'))}</div>
          </div>
        </section>
        <section className="section overview" id="about">
          <div className="wrap reveal">
            <div className="eyebrow">{tx(b('01 / Event Overview', '01 / Үйл ажиллагааны тухай'))}</div><h2 className="section-title">{tx(b('Ideas Worth Spreading', 'Үнэ цэнэтэй санаануудыг түгээх'))}</h2>
            <div className="intro-grid"><div className="quote">“Empathy isn't just something you feel. <span>It's the willingness to stop, listen, and see the world through someone else's eyes.”</span></div><div className="body-copy"><p>{tx(b('We are a team of student organizers at Ulaanbaatar Empathy School creating a platform where youth voices, young innovators, and passionate educators take center stage.', 'Бид Улаанбаатар Эмпати Сургуулийн сурагчдын зохион байгуулсан баг бөгөөд залуусын дуу хоолой, шинийг санаачлагчид, хүсэл тэмүүлэлтэй сурган хүмүүжүүлэгчдийг тайзан дээр гаргах платформыг бүрдүүлж байна.'))}</p><p>{tx(b('On Saturday, October 24, 2026, our school assembly hall will bring together 100 attendees for a day of live presentations, curated TEDTalks videos, and deep conversations.', '2026 оны 10-р сарын 24-ний Бямба гарагт манай сургуулийн урлаг зааланд 100 оролцогч цугларч, амьд илтгэлүүд, сонгомол TEDTalks бичлэгүүд үзэж, гүн гүнзгий хэлэлцүүлэг өрнүүлэх болно.'))}</p></div></div>
             <div className="compliance"><h3>{tx(b('What is TEDx?', 'TEDx гэж юу вэ?'))}</h3><p>{tx(b('In the spirit of ideas worth spreading, TED has created a program called TEDx. TEDx is a program of local, self-organized events that bring people together to share a TED-like experience. Our event is called TEDxUlaanbaatar Empathy School Youth, where x = independently organized TED event. TEDTalks video and live speakers combine to spark deep discussion and connection in a small group.', 'Түгээх үнэ цэнэтэй санааг дэмжих зорилгоор TED нь TEDx хэмээх хөтөлбөрийг бий болгосон. TEDx бол орон нутгийн түвшинд бие даан зохион байгуулагддаг, хүмүүсийг нэгтгэн TED-тэй ижил туршлагыг хуваалцах хөтөлбөр юм. Бидний арга хэмжээ TEDxUlaanbaatar Empathy School Youth бөгөөд x нь бие даан зохион байгуулагдсан TED арга хэмжээ гэсэн үг. TEDTalks бичлэгүүд болон амьд илтгэгчид хосолж, гүнзгий хэлэлцүүлэг, холбоо үүсгэнэ.'))}</p><p>{tx(b('Learn more about the global ', 'Олон улсын '))}<a href="https://www.ted.com/tedx" target="_blank" rel="noopener noreferrer">TEDx Program →</a></p></div>
             <div className="venue"><div><h3>{tx(b('Venue: Ulaanbaatar Empathy School Assembly Hall', 'Байршил: Улаанбаатар Эмпати Сургуулийн Урлаг Заал'))}</h3><p>{tx(b('Our event takes place in the main multi-purpose assembly hall of Ulaanbaatar Empathy School, equipped with modern audiovisual systems, a stage, and an interactive horseshoe-style arrangement designed to spark connection between speakers and audience members.', 'Манай арга хэмжээ Улаанбаатар Эмпати Сургуулийн орчин үеийн дуу дүрсний системтэй, тайзтай, илтгэгч болон үзэгчдийн хооронд харилцаа үүсгэхэд зориулагдсан тах хэлбэрийн зохион байгуулалттай урлаг зааланд болно.'))}</p><span className="location"><MapPin size={14} />{tx(b('Bayanzurkh District, Ulaanbaatar, Mongolia', 'Монгол Улс, Улаанбаатар хот, Баянзүрх дүүрэг'))}</span></div><div className="venue-art"><img src={`${media}school-campus.jpg`} alt="Ulaanbaatar Empathy School campus" /></div></div>
             <div className="vision-strip"><img src={`${media}ideas-change-people.png`} alt="Ideas change people. People change the world." /><div className="vision-strip-copy"><span className="eyebrow">{tx(b('The reason we gather', 'Бидний цугларах шалтгаан'))}</span><strong>{tx(b('One room. Many perspectives.', 'Нэг танхим. Олон үзэл бодол.'))}</strong></div><video autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src={`${media}tedx-motion.mp4`} type="video/mp4" /></video></div>
            <SeatSelector />
           </div>
         </section>
          <section className="section" id="speakers"><div className="wrap reveal"><div className="eyebrow">{tx(b('02 / On Stage', '02 / Тайзнаа'))}</div><h2 className="section-title">{tx(b('8 Live Speakers', '8 Илтгэгч'))}</h2><div className="speakers-head"><div className="pills"><span className="pill"><b>4</b>{tx(b('Student Speakers', 'Сурагч илтгэгч'))}</span><span className="pill"><b>2</b>{tx(b('Local Teachers', 'Багш нар'))}</span><span className="pill"><b>2</b>{tx(b('External Speakers', 'Зочин илтгэгч'))}</span></div><div className="scroll-buttons"><button className="icon-button" onClick={() => scrollSpeakers(-260)} aria-label="Scroll speakers left" data-testid="button-speakers-left"><ArrowLeft size={16} /></button><button className="icon-button" onClick={() => scrollSpeakers(260)} aria-label="Scroll speakers right" data-testid="button-speakers-right"><ArrowRight size={16} /></button></div></div><div className="speaker-scroll" ref={speakerRef}>{speakers.map(([type, desc], index) => <button className="speaker-card" key={`${type}-${index}`} onClick={() => setSpeaker({ index: index + 1, type, desc })} data-testid={`button-speaker-${index + 1}`}><div className="speaker-avatar">?</div><div className="speaker-type">{type}</div><div className="speaker-name">{tx(b(`Speaker #${String(index + 1).padStart(2, '0')}`, `Илтгэгч #${String(index + 1).padStart(2, '0')}`))}</div><p className="speaker-desc">{desc}</p></button>)}</div></div></section>
         <section className="section schedule" id="schedule"><div className="wrap reveal"><div className="eyebrow">{tx(b('03 / Timetable', '03 / Цагийн хуваарь'))}</div><h2 className="section-title">{tx(b('Event Schedule (Coming Soon)', 'Арга хэмжээний хөтөлбөр (Тун удахгүй)'))}</h2><p className="muted">{tx(b('Click on a session below to view details.', 'Доорх хэсэгт дарж дэлгэрэнгүй хуваарийг харна уу.'))}</p><div className="schedule-list">{sessions.map(([title, time, rows], index) => <div className={`session ${openSession === index ? 'open' : ''}`} key={title.en}><button className="session-header" onClick={() => setOpenSession(openSession === index ? null : index)} aria-expanded={openSession === index} data-testid={`button-schedule-${index}`}><div><h3>{tx(title)}</h3><span className="session-badge">{time}</span></div><span className="toggle">{openSession === index ? '−' : '+'}</span></button><div className="session-items">{rows.map(([rowTime, event]) => <div className="schedule-row" key={rowTime}><div className="time">{rowTime}</div><div className="event">{tx(event)}</div></div>)}</div></div>)}</div></div></section>
          <section className="section" id="contact"><div className="wrap reveal"><div className="eyebrow">{tx(b('04 / Get In Touch', '04 / Холбоо барих'))}</div><h2 className="section-title">{tx(b('Reach Out to Our Team', 'Бидэнтэй холбогдох'))}</h2><div className="contact-grid"><div className="info-card"><h3>{tx(b('Organizers', 'Зохион байгуулагчид'))}</h3><div className="organizer"><div><strong>Munkhtushig</strong><p>{tx(b('Organizer / strategic operations', 'Зохион байгуулагч / стратеги'))}</p></div><span>01</span></div><div className="organizer"><div><strong>Munkherdene</strong><p>{tx(b('Co-organizer / venue execution', 'Хамтран зохион байгуулагч / талбай'))}</p></div><span>02</span></div><div className="socials"><a href="mailto:hello@tedxubempathy.school"><Mail size={14} />Email</a></div></div><div className="form-card"><h3>{tx(b('Send a Message', 'Зурвас илгээх'))}</h3><form onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const name = String(data.get('fullName') ?? '');
              const emailAddress = String(data.get('emailAddress') ?? '');
              const message = String(data.get('message') ?? '');
              const subject = encodeURIComponent(`TEDx Ulaanbaatar website message from ${name}`);
              const body = encodeURIComponent(`Name: ${name}\nEmail: ${emailAddress}\n\nMessage:\n${message}`);
              window.location.href = `mailto:Sergelenmunkhtushig@gmail.com?subject=${subject}&body=${body}`;
              setMessageSent(true);
              form.reset();
              window.setTimeout(() => setMessageSent(false), 4500);
            }}><div className="form-field"><label htmlFor="fullName">{tx(b('Your Name', 'Таны нэр'))}</label><input id="fullName" name="fullName" required placeholder={tx(b('e.g. Anujin Batbayar', 'Жнь: Анужин Батбаяр'))} data-testid="input-full-name" /></div><div className="form-field"><label htmlFor="emailAddress">{tx(b('Email Address', 'И-мэйл хаяг'))}</label><input id="emailAddress" name="emailAddress" type="email" required placeholder="name@example.com" data-testid="input-email" /></div><div className="form-field"><label htmlFor="message">{tx(b('Message / Question', 'Таны зурвас'))}</label><textarea id="message" name="message" rows={4} required placeholder={tx(b('How can we help you?', 'Бид танд хэрхэн туслах вэ?'))} data-testid="input-message" /></div><button className="button" type="submit" data-testid="button-send-message"><Send size={15} />{tx(b('Send Message', 'Илгээх'))}</button>{messageSent && <div className="form-success" data-testid="status-message-sent"><Check size={15} /> {tx(b("Message received! We'll reply shortly.", 'Зурвас хүлээн авлаа! Бид удахгүй хариу өгөх болно.'))}</div>}</form></div></div></div></section>
       </main>
      <Footer />
      <SpeakerModal speaker={speaker} close={() => setSpeaker(null)} />
    </>
  );
}

function Library() {
  const { tx } = useLang();
  useScrollReveal();
  return <><Nav /><main className="page-main talks-page"><div className="wrap"><div className="coming-soon-wrapper reveal"><h1 className="aesthetic-text">{tx(b('Coming Soon', 'Тун удахгүй'))}</h1><p className="coming-soon-sub">{tx(b('The full library of live ideas, student talks, and inspiration will be unlocked right here after the event concludes.', 'Арга хэмжээ дууссаны дараа сурагчдын болон зочдын бүх илтгэлийн бичлэгүүд энд байрших болно.'))}</p></div></div></main><Footer /></>;
}

const teamMembers = [
  { dept: 'leadership', role: b('Organizer', 'Зохион байгуулагч'), name: 'Munkhtushig', bio: b('Directing strategic operations, licensing compliance, and overarching vision for the event.', 'Арга хэмжээний стратеги, франчайз зөвшөөрөл болон ерөнхий чиглэлийг удирдан чиглүүлэгч.') },
  { dept: 'leadership', role: b('Co-Organizer', 'Хамтран зохион байгуулагч'), name: 'Munkherdene', bio: b('Coordinating department workflows, operational planning, and venue execution.', 'Албадын үйл ажиллагаа, операци төлөвлөлт болон талбайн зохион байгуулалтыг зохицуулагч.') },
  { dept: 'curation', role: b('Curation Lead', 'Куратор багийн ахлагч'), name: 'Anar', bio: b('Leading speaker discovery, talk shaping, and editorial coaching for the stage.', 'Илтгэгчдийг сонгон шалгаруулах, илтгэл бэлтгэх болон зөвлөн чиглүүлэх баг.') },
  { dept: 'curation', role: b('Curation Team', 'Куратор баг'), name: '?', bio: b('Team member to be revealed soon.', 'Багийн гишүүн удахгүй зарлагдана.') },
  { dept: 'media-design', role: b('Designer', 'Дизайнер'), name: 'Munkhjin', bio: b('Directing visual branding, digital media assets, stage production aesthetics, and creative direction.', 'Арга хэмжээний визуал брэнд, дижитал контент, тайзны дизайн болон бүтээлч чиглэлийг хариуцагч.') },
  { dept: 'media-design', role: b('Media & Design', 'Медиа ба Дизайн'), name: '?', bio: b('Team member to be revealed soon.', 'Багийн гишүүн удахгүй зарлагдана.') },
  { dept: 'logistics', role: b('Logistics', 'Логистик'), name: '?', bio: b('Team member to be revealed soon.', 'Багийн гишүүн удахгүй зарлагдана.') },
  { dept: 'logistics', role: b('Operations', 'Үйл ажиллагаа'), name: '?', bio: b('Team member to be revealed soon.', 'Багийн гишүүн удахгүй зарлагдана.') },
];

function Team() {
  const { tx } = useLang();
  const [filter, setFilter] = useState('all');
  useScrollReveal([filter]);
  const departments: [string, Bilingual][] = [['leadership', b('Leadership', 'Удирдлага')], ['curation', b('Curation', 'Куратор')], ['media-design', b('Media & Design', 'Медиа ба Дизайн')], ['logistics', b('Logistics', 'Логистик')]];
  const visible = filter === 'all' ? teamMembers : teamMembers.filter((member) => member.dept === filter);
  return <><Nav /><main className="page-main team-page"><section className="team-hero"><div className="wrap team-hero-grid reveal"><div className="team-hero-copy"><div className="eyebrow">{tx(b('Behind the Stage', 'Тайзны ард'))}</div><h1>{tx(b('Meet the ', 'Зохион байгуулах багтай '))}<em>{tx(b('visionaries.', 'танилц.'))}</em></h1><p>{tx(b('The dedicated team working behind the scenes to make this event happen.', 'Энэхүү эвэнтэд зориулан тайзны ард ажиллаж буй манай баг хамт олон.'))}</p></div><aside className="team-hero-note"><div className="team-note-index">01 — 04</div><div className="team-note-line" /><p>{tx(b('A student-led crew building a room for ideas, one detail at a time.', 'Санаа бүрт зориулсан орон зайг нарийн ширийн зүйл бүрээр бүтээж буй сурагчдын баг.'))}</p><div className="team-note-meta"><span>TEDx Ulaanbaatar</span><strong>Empathy School Youth</strong></div></aside></div><div className="wrap"><div className="stats"><div className="stat"><strong>?</strong><span>{tx(b('Total members', 'Нийт гишүүд'))}</span></div><div className="stat"><strong>04</strong><span>{tx(b('Departments', 'Албадууд'))}</span></div><div className="stat"><strong>100%</strong><span>{tx(b('Volunteer driven', 'Сайн дурын баг'))}</span></div><div className="stat"><strong>2026</strong><span>{tx(b('Edition team', '2026 оны баг'))}</span></div></div></div></section><div className="filter-bar"><div className="wrap"><div className="filters"><button className={`filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} data-testid="button-filter-all">{tx(b('All Departments', 'Бүх алба'))}</button>{departments.map(([id, label]) => <button key={id} className={`filter ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)} data-testid={`button-filter-${id}`}>{tx(label)}</button>)}</div></div></div><div className="wrap team-content"><div className="team-intro-row"><div className="eyebrow">{tx(b('Organizing core', 'Зохион байгуулах баг'))}</div><p>{tx(b('Meet the people turning one shared idea into a full day of voices, movement, and connection.', 'Нэг санааг дуу хоолой, хөдөлгөөн, харилцаагаар дүүрэн бүтэн өдөр болгон хувиргаж буй хүмүүстэй танилцаарай.'))}</p></div>{departments.filter(([id]) => filter === 'all' || id === filter).map(([id, label]) => { const members = visible.filter((member) => member.dept === id); return <section className="dept" key={id}><div className="dept-heading"><h2>{tx(label)}</h2><i /><span>{members.length} {tx(b('Members', 'Гишүүн'))}</span></div><div className="roster-list">{members.map((member, index) => <article className="roster-member" key={`${id}-${index}`}><div className="roster-index">{String(index + 1).padStart(2, '0')}</div><div className="roster-initials" aria-hidden="true">{member.name === '?' ? '?' : member.name.slice(0, 1)}</div><div className="roster-person"><div className="member-role">{tx(member.role)}</div><h3>{member.name}</h3></div><p className="roster-bio">{tx(member.bio)}</p><span className="roster-arrow" aria-hidden="true">↗</span></article>)}</div></section>; })}</div></main><Footer /></>;
}

function Apply() {
  const { tx } = useLang();
  useScrollReveal();
  return <><Nav /><main className="page-main"><section className="page-hero"><div className="wrap reveal"><div className="eyebrow">{tx(b('Applications & Recruitment', 'Илтгэгч ба багийн бүртгэл'))}</div><h1>{tx(b('Put your idea in the room.', 'Санаагаа танхимд авчир.'))}</h1><p>{tx(b('Choose an application below to apply as a speaker or join the organizing team for 2026.', '2026 оны TEDx арга хэмжээнд илтгэгчээр оролцох эсвэл зохион байгуулах багт нэгдэх анкет.'))}</p></div></section><section className="section" style={{ paddingTop: 25 }}><div className="wrap"><div className="apply-grid"><article className="apply-card"><div><span className="badge">{tx(b('Stage call', 'Илтгэгчийн урилга'))}</span><h2>{tx(b('Speaker Application', 'Илтгэгчийн анкет'))}</h2><p>{tx(b('Have an idea worth spreading? We are looking for student leaders, educators, and visionaries to share ideas live on stage.', 'Та залууст хүргэх үнэ цэнэтэй санаатай юу? Тайзан дээр илтгэл тавих сурагчид, багш нар болон зочдыг урьж байна.'))}</p></div><a className="button" href="https://docs.google.com/forms/d/e/1FAIpQLSeDVXkHyLZ36OvnBQ0OesNOzop77LhwibkIZZxv4QJeupXg6w/viewform?usp=header" target="_blank" rel="noopener noreferrer" data-testid="link-apply-speaker">{tx(b('Apply as Speaker', 'Илтгэгчээр бүртгүүлэх'))}<ArrowRight size={15} /></a></article><article className="apply-card"><div><span className="badge">{tx(b('Organizing core', 'Зохион байгуулах баг'))}</span><h2>{tx(b('Team Recruitment', 'Багийн гишүүний анкет'))}</h2><p>{tx(b('Join our student team across Media & Design, Stage & Technical, and Logistics departments to bring TEDx to life.', 'Медиа, Дизайн, Техник болон Ложистикийн багт нэгдэж TEDx арга хэмжээг хамтдаа бүтээгээрэй.'))}</p></div><a className="button" href="https://docs.google.com/forms/d/e/1FAIpQLSfuZkbisjE0HeH8m-O9R7mwU2li7bBOOlNYU4jC1OtDca1U9Q/viewform?usp=header" target="_blank" rel="noopener noreferrer" data-testid="link-apply-team">{tx(b('Join the Team', 'Багт нэгдэх'))}<ArrowRight size={15} /></a></article></div><div className="footer-cta"><h2>{tx(b('Ready to leave your mark?', 'Өөрийн мөрийг үлдээхэд бэлэн үү?'))}</h2><p>{tx(b('Whether you have an idea worth spreading or want to help build the event behind the scenes, we want you on board.', 'Та тайзан дээр илтгэл тавих эсвэл зохион байгуулах багт нэгдэхийг хүссэн ч бид таныг урьж байна.'))}</p></div></div></section></main><Footer /></>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/library" component={Library} /><Route path="/team" component={Team} /><Route path="/apply" component={Apply} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  const [lang, setLang] = useState<Lang>('en');
  const toggle = () => setLang((value) => value === 'en' ? 'mn' : 'en');
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><LangContext.Provider value={{ lang, toggle, tx: (value) => value[lang] }}><Router /></LangContext.Provider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;