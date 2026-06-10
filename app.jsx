// resume/ — the main interactive editor prototype.

function AppChrome({ children, activeTab = "editor", onTab }) {
  const tabs = [
    { id: "editor", label: "Editor" },
    { id: "tailor", label: "Tailor" },
    { id: "templates", label: "Templates" },
    { id: "versions", label: "Versions" },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bone)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--sans)' }}>
      {/* top bar */}
      <div style={{ height: 48, background: 'var(--paper)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
          <Logo size={22} />
          <span>resume<span style={{ color: 'var(--accent)' }}>/</span></span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginLeft: 4, letterSpacing: 0.6 }}>v0.1</span>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 32 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTab && onTab(t.id)}
              style={{
                border: 'none', background: activeTab === t.id ? 'var(--bone-2)' : 'transparent',
                padding: '6px 12px', borderRadius: 5, fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? 'var(--ink)' : 'var(--ink-3)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rb-tag ok" title="All data stays in your browser">
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor', display: 'inline-block' }} />
            LOCAL
          </span>
          <button className="rb-btn ghost">Import</button>
          <button className="rb-btn primary">Download PDF</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="14" height="18" rx="1.5" fill="var(--ink)" />
      <rect x="7" y="6" width="6" height="1" fill="var(--paper)" />
      <rect x="7" y="9" width="4" height="1" fill="var(--paper)" />
      <path d="M12 14 L20 14 L15 22 Z" fill="var(--accent)" />
    </svg>
  );
}

/* ───────── EDITOR ───────── */

function EditorView() {
  const [data, setData] = React.useState(SAMPLE);
  const [open, setOpen] = React.useState('exp-0');
  const [aiFor, setAiFor] = React.useState(null); // {expIdx, bulIdx}

  const update = (path, v) => {
    setData(d => {
      const next = structuredClone(d);
      let cur = next; const keys = path.split('.');
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = v;
      return next;
    });
  };
  const updateBullet = (eIdx, bIdx, v) => {
    setData(d => {
      const next = structuredClone(d);
      next.experience[eIdx].bullets[bIdx] = v;
      return next;
    });
  };

  return (
    <>
      {/* left — sections sidebar */}
      <div style={{ width: 200, background: 'var(--paper)', borderRight: '1px solid var(--line)', padding: '12px 8px', flexShrink: 0, overflowY: 'auto' }} className="rb-scroll">
        <div className="rb-label" style={{ padding: '4px 8px' }}>Sections</div>
        {[
          { id: 'basics', name: 'Basics', n: 1 },
          { id: 'summary', name: 'Summary', n: 1 },
          { id: 'experience', name: 'Experience', n: 3 },
          { id: 'education', name: 'Education', n: 1 },
          { id: 'skills', name: 'Skills', n: 7 },
          { id: 'projects', name: 'Projects', n: 0, muted: true },
          { id: 'awards', name: 'Awards', n: 0, muted: true },
        ].map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 5, cursor: 'pointer', opacity: s.muted ? 0.5 : 1, background: s.id === 'experience' ? 'var(--bone-2)' : 'transparent' }}>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ color: 'var(--ink-4)' }}><circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/><circle cx="2" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="2" cy="10" r="1"/><circle cx="6" cy="10" r="1"/></svg>
            <span style={{ fontSize: 13, flex: 1, fontWeight: s.id === 'experience' ? 600 : 400 }}>{s.name}</span>
            {s.n > 0 && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.n}</span>}
          </div>
        ))}
        <button className="rb-btn ghost" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 6, fontSize: 12, color: 'var(--ink-3)' }}>
          <span style={{ fontSize: 14 }}>+</span> Add section
        </button>

        <div style={{ marginTop: 24, padding: '0 8px' }}>
          <div className="rb-label">ATS check</div>
          <ATSMeter score={86} />
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            2 suggestions →
          </div>
        </div>
      </div>

      {/* middle — form */}
      <div style={{ width: 440, borderRight: '1px solid var(--line)', background: 'var(--paper)', overflowY: 'auto', flexShrink: 0 }} className="rb-scroll">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div className="rb-label">Basics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="rb-input" value={data.name} onChange={e => update('name', e.target.value)} />
            <input className="rb-input" value={data.title} onChange={e => update('title', e.target.value)} />
            <input className="rb-input" value={data.email} onChange={e => update('email', e.target.value)} />
            <input className="rb-input" value={data.phone} onChange={e => update('phone', e.target.value)} />
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div className="rb-label">Summary</div>
          <textarea className="rb-textarea" value={data.summary} onChange={e => update('summary', e.target.value)} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="rb-btn" style={{ fontSize: 11, padding: '5px 10px' }}>
              <SparkIcon /> Rewrite with AI
            </button>
            <button className="rb-btn ghost" style={{ fontSize: 11, padding: '5px 10px', color: 'var(--ink-3)' }}>Shorten</button>
          </div>
        </div>

        <div style={{ padding: '12px 20px 20px' }}>
          <div className="rb-label" style={{ marginBottom: 8 }}>Experience</div>
          {data.experience.map((e, i) => (
            <ExpCard
              key={i} idx={i} exp={e}
              open={open === `exp-${i}`}
              onToggle={() => setOpen(open === `exp-${i}` ? null : `exp-${i}`)}
              onBulletChange={(bi, v) => updateBullet(i, bi, v)}
              onRewriteBullet={(bi) => setAiFor({ expIdx: i, bulIdx: bi })}
            />
          ))}
          <button className="rb-btn ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8, borderStyle: 'dashed', borderColor: 'var(--line)' }}>+ Add role</button>
        </div>
      </div>

      {/* right — preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: 'var(--bone)' }} className="rb-scroll">
        <div style={{ position: 'relative' }}>
          <ResumePaper data={data} scale={0.78} template="classic" />
          <div style={{ position: 'absolute', top: -22, left: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
            <span className="mono">Letter · 8.5 × 11 in</span>
            <span>·</span>
            <span>1 page</span>
          </div>
        </div>
      </div>

      {/* AI rewrite popover */}
      {aiFor && (
        <AIRewriteModal
          original={data.experience[aiFor.expIdx].bullets[aiFor.bulIdx]}
          onClose={() => setAiFor(null)}
          onAccept={(v) => { updateBullet(aiFor.expIdx, aiFor.bulIdx, v); setAiFor(null); }}
        />
      )}
    </>
  );
}

function ExpCard({ exp, idx, open, onToggle, onBulletChange, onRewriteBullet }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 6, marginBottom: 8, background: 'var(--paper)', overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer', background: open ? 'var(--bone-2)' : 'transparent' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--ink-3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M3 2l4 3-4 3"/></svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{exp.role}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{exp.company} · {exp.start}–{exp.end}</div>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{exp.bullets.length}</span>
      </div>
      {open && (
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--line-2)' }} className="rb-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            <input className="rb-input" defaultValue={exp.role} placeholder="Role" />
            <input className="rb-input" defaultValue={exp.company} placeholder="Company" />
          </div>
          <div className="rb-label" style={{ marginTop: 4 }}>Bullets</div>
          {exp.bullets.map((b, bi) => (
            <div key={bi} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 10, fontFamily: 'var(--mono)' }}>{bi + 1}</span>
              <textarea className="rb-textarea" style={{ minHeight: 52, fontSize: 12 }} value={b} onChange={e => onBulletChange(bi, e.target.value)} />
              <button className="rb-btn ghost" title="Rewrite with AI" onClick={() => onRewriteBullet(bi)}
                style={{ padding: 6, color: 'var(--accent-ink)', flexShrink: 0 }}>
                <SparkIcon />
              </button>
            </div>
          ))}
          <button className="rb-btn ghost" style={{ fontSize: 11, marginTop: 4, color: 'var(--ink-3)' }}>+ Add bullet</button>
        </div>
      )}
    </div>
  );
}

function SparkIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 1v3M6 8v3M1 6h3M8 6h3M2.5 2.5L4 4M10 10L8.5 8.5M2.5 9.5L4 8M10 2L8.5 3.5"/></svg>;
}

function ATSMeter({ score }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="serif" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>{score}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>/ 100</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--bone-2)', marginTop: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? 'var(--ok)' : score >= 60 ? 'var(--warn)' : 'var(--accent)' }} />
      </div>
    </div>
  );
}

function AIRewriteModal({ original, onClose, onAccept }) {
  const options = [
    "Led the end-to-end redesign of Figma's Plugin API v3, now adopted by 14,000+ developers and active in 9M+ files within 12 months of launch.",
    "Shipped Plugin API v3, driving adoption to 14,000 developers and surfacing the platform across 9M Figma files in year one.",
    "Designed Plugin API v3 from research through launch; 14,000 developers adopted it and it's now surfaced in 9M+ files.",
  ];
  const [picked, setPicked] = React.useState(1);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(24,20,16,0.4)', backdropFilter: 'blur(4px)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="rb-fade-in" style={{ width: 520, background: 'var(--paper)', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.3)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SparkIcon />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Rewrite bullet</div>
          <span className="rb-tag" style={{ marginLeft: 'auto' }}>impact-first</span>
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--bone-2)', borderBottom: '1px solid var(--line)' }}>
          <div className="rb-label">Original</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{original}</div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <div className="rb-label" style={{ marginBottom: 8 }}>Suggestions · pick one</div>
          {options.map((o, i) => (
            <div key={i} onClick={() => setPicked(i)}
              style={{ padding: '10px 12px', border: `1.5px solid ${picked === i ? 'var(--accent)' : 'var(--line)'}`, background: picked === i ? 'var(--accent-tint)' : 'var(--paper)', borderRadius: 5, marginBottom: 6, cursor: 'pointer', fontSize: 12, lineHeight: 1.5, transition: 'all .12s' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{String.fromCharCode(65 + i)}</div>
                <div>{o}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="rb-btn ghost" style={{ fontSize: 11 }}>More concise</button>
            <button className="rb-btn ghost" style={{ fontSize: 11 }}>Add a metric</button>
            <button className="rb-btn ghost" style={{ fontSize: 11 }}>Different angle</button>
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bone)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>⌘⏎ accept · esc cancel</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="rb-btn" onClick={onClose}>Cancel</button>
            <button className="rb-btn accent" onClick={() => onAccept(options[picked])}>Use this</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── TAILOR ───────── */

function TailorView() {
  const [jd, setJd] = React.useState(SAMPLE_JD);
  const [analyzed, setAnalyzed] = React.useState(true);

  return (
    <div style={{ width: '100%', display: 'flex' }}>
      <div style={{ width: 380, background: 'var(--paper)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <div className="rb-label">Job description</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Senior Product Designer · Vercel</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>vercel.com/careers · Remote · Pasted 2m ago</div>
        </div>
        <textarea className="rb-textarea rb-scroll" value={jd} onChange={e => setJd(e.target.value)}
          style={{ flex: 1, border: 'none', borderRadius: 0, padding: '14px 18px', fontSize: 12, lineHeight: 1.55, fontFamily: 'var(--sans)' }} />
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--line)', background: 'var(--bone)', display: 'flex', gap: 6 }}>
          <button className="rb-btn accent" style={{ flex: 1, justifyContent: 'center' }}>
            <SparkIcon /> Re-tailor resume
          </button>
        </div>
      </div>

      <div style={{ width: 340, background: 'var(--bone)', borderRight: '1px solid var(--line)', overflowY: 'auto', padding: 18 }} className="rb-scroll">
        <div className="rb-label">Analysis</div>

        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>MATCH SCORE</div>
            <span className="rb-tag ok">+14 vs base</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span className="serif" style={{ fontSize: 52, letterSpacing: '-0.02em', lineHeight: 1 }}>82</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/ 100</span>
          </div>
          <div style={{ height: 5, background: 'var(--bone-2)', borderRadius: 3, marginTop: 10, overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', width: '68%', background: 'var(--ink-4)' }} />
            <div style={{ position: 'absolute', left: '68%', top: 0, height: '100%', width: '14%', background: 'var(--accent)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
            <span>Base 68</span><span>+14 from tailoring</span>
          </div>
        </div>

        <div className="rb-label">Keywords</div>
        <KeywordRow label="design systems" match />
        <KeywordRow label="platform" match />
        <KeywordRow label="prototyping" match />
        <KeywordRow label="developer experience" match />
        <KeywordRow label="api design" missing weight="high" />
        <KeywordRow label="serverless" missing weight="low" />
        <KeywordRow label="edge functions" missing weight="low" />
        <KeywordRow label="figma" match />

        <div className="rb-label" style={{ marginTop: 18 }}>Suggested edits</div>
        <Suggestion kicker="BULLET 2 · FIGMA" title="Mention API design explicitly">
          Your Plugin API work is API design. JD lists it 3×. Add the phrase.
        </Suggestion>
        <Suggestion kicker="SUMMARY" title="Lead with 'platform'">
          JD opens with &ldquo;platform team&rdquo;. Reorder your summary to match.
        </Suggestion>
        <Suggestion kicker="SKILLS" title="Swap 'Swift' for 'TypeScript'">
          Nothing in JD asks for Swift. TS matters here.
        </Suggestion>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }} className="rb-scroll">
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: -22, left: 0, display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
            <span className="rb-tag accent">TAILORED DRAFT</span>
            <span className="mono">Maya Chen → Vercel · v2</span>
          </div>
          <ResumePaper data={TAILORED} scale={0.78} template="classic"
            highlight={["design systems", "platform", "prototyping", "Plugin API", "developer experience", "API design"]} />
        </div>
      </div>
    </div>
  );
}

function KeywordRow({ label, match, missing, weight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: match ? 'oklch(0.92 0.07 150)' : 'oklch(0.93 0.06 35)', color: match ? 'oklch(0.4 0.12 150)' : 'oklch(0.45 0.14 35)', fontSize: 9 }}>
        {match ? '✓' : '−'}
      </span>
      <span style={{ flex: 1, color: match ? 'var(--ink-2)' : 'var(--ink-3)' }}>{label}</span>
      {missing && weight && <span className="mono" style={{ fontSize: 9, color: weight === 'high' ? 'var(--accent)' : 'var(--ink-4)' }}>{weight}</span>}
    </div>
  );
}

function Suggestion({ kicker, title, children }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 5, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--accent-ink)', letterSpacing: 0.6, marginBottom: 2 }}>{kicker}</div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>{children}</div>
    </div>
  );
}

const SAMPLE_JD = `About the role
We're building the platform team at Vercel. You'll own the design of our developer-facing platform surfaces — dashboards, deployment flows, and the design system that powers them.

What you'll do
· Design end-to-end for the platform team, owning dashboards, settings, and deployment flows
· Partner with engineers on API design and developer experience
· Evolve our design system, patterns, and prototyping culture
· Ship continuously — we prefer iterating in production

What we look for
· 5+ years designing developer tools or complex B2B platforms
· Strong prototyping skills; familiarity with code is a bonus
· Experience evolving a design system at scale
· A portfolio that shows both craft and systems thinking`;

const TAILORED = {
  ...SAMPLE,
  summary: "Platform product designer with 7 years shipping tools for developers. Led design for Figma's Plugin API (API design + developer experience) and built Linear's first design system. Prototype-heavy; comfortable in code.",
  experience: [
    {
      ...SAMPLE.experience[0],
      bullets: [
        "Led end-to-end design for the Plugin API v3 — an exercise in API design and developer experience — adopted by 14,000+ developers and surfaced across 9M files in year one.",
        "Redesigned the plugin platform surfaces (dashboards, settings, install flows), lifting install-through rate 38% and author retention 22%.",
        "Evolved the platform design system — 120+ components used by 6 product teams.",
      ],
    },
    SAMPLE.experience[1],
    SAMPLE.experience[2],
  ],
};

/* ───────── TEMPLATES ───────── */

function TemplatesView() {
  const templates = [
    { id: 'classic', name: 'Kraft', style: 'Classic', desc: 'Single-column, centered. The safe default.', ats: 98 },
    { id: 'editorial', name: 'Folio', style: 'Editorial', desc: 'Serif headings, quiet confidence.', ats: 94 },
    { id: 'technical', name: 'Monolith', style: 'Technical', desc: 'Monospace accents, GitHub-adjacent.', ats: 91 },
    { id: 'classic', name: 'Letter', style: 'Classic', desc: 'A stricter take on Kraft. No color.', ats: 99 },
    { id: 'editorial', name: 'Masthead', style: 'Editorial', desc: 'Big name, small everything else.', ats: 90 },
    { id: 'technical', name: 'README', style: 'Technical', desc: 'Literal markdown vibes.', ats: 89 },
  ];
  const [picked, setPicked] = React.useState(0);

  return (
    <div style={{ width: '100%', overflow: 'auto', padding: '28px 40px', background: 'var(--bone)' }} className="rb-scroll">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 40, margin: 0, letterSpacing: '-0.015em' }}>Eight templates.</h1>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>All ATS-safe. All free. Switch any time — your content comes along.</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="rb-btn">Classic</button>
          <button className="rb-btn ghost">Editorial</button>
          <button className="rb-btn ghost">Technical</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32 }}>
        {templates.map((t, i) => (
          <div key={i} onClick={() => setPicked(i)} style={{ cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '612/792', background: '#fff', border: picked === i ? '2px solid var(--ink)' : '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,.04)' }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                <div style={{ transform: 'scale(0.48)', transformOrigin: 'top left' }}>
                  <ResumePaper scale={1} template={t.id} />
                </div>
              </div>
              {picked === i && <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--ink)', color: 'var(--paper)', padding: '2px 8px', fontSize: 10, fontFamily: 'var(--mono)', borderRadius: 3, letterSpacing: 0.6 }}>SELECTED</div>}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="serif" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>{t.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.5 }}>{t.style.toUpperCase()}</div>
              <div style={{ flex: 1 }} />
              <span className="rb-tag ok">ATS {t.ats}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── VERSIONS ───────── */

function VersionsView() {
  const versions = [
    { id: 1, name: "Maya Chen — base", ver: "v1", updated: "2m ago", tags: ["base"], status: "draft", jd: null, score: 68 },
    { id: 2, name: "→ Vercel · Sr. Product Designer", ver: "v2", updated: "just now", tags: ["tailored"], status: "applied", jd: "vercel.com", score: 82 },
    { id: 3, name: "→ Linear · Design Lead", ver: "v3", updated: "2d ago", tags: ["tailored"], status: "interview", jd: "linear.app", score: 88 },
    { id: 4, name: "→ Anthropic · Product Designer", ver: "v2", updated: "5d ago", tags: ["tailored"], status: "applied", jd: "anthropic.com", score: 79 },
    { id: 5, name: "→ Stripe · Staff Designer", ver: "v1", updated: "1w ago", tags: ["tailored"], status: "rejected", jd: "stripe.com", score: 71 },
    { id: 6, name: "→ Ramp · Senior Designer", ver: "v2", updated: "2w ago", tags: ["tailored"], status: "offer", jd: "ramp.com", score: 85 },
  ];
  const statusColor = { draft: '', applied: 'accent', interview: 'ok', rejected: '', offer: 'ok' };
  const statusDot = { draft: 'var(--ink-4)', applied: 'var(--accent)', interview: 'var(--ok)', rejected: 'var(--ink-4)', offer: 'var(--ok)' };

  return (
    <div style={{ width: '100%', padding: '28px 40px', overflow: 'auto', background: 'var(--paper)' }} className="rb-scroll">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <h1 className="serif" style={{ fontSize: 40, margin: 0, letterSpacing: '-0.015em' }}>One resume. Many forks.</h1>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>Every application gets its own branch. Edit freely — the base resume is untouched.</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="rb-btn ghost">Export all</button>
          <button className="rb-btn primary">+ New tailor</button>
        </div>
      </div>

      <div style={{ marginTop: 28, border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 90px 100px 110px 1fr 70px 70px', padding: '10px 16px', background: 'var(--bone)', borderBottom: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', letterSpacing: 0.8 }}>
          <div>RESUME</div><div>VER</div><div>STATUS</div><div>UPDATED</div><div>JOB POST</div><div style={{ textAlign: 'right' }}>MATCH</div><div />
        </div>
        {versions.map((v, i) => (
          <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 90px 100px 110px 1fr 70px 70px', padding: '14px 16px', borderBottom: i < versions.length - 1 ? '1px solid var(--line-2)' : 'none', alignItems: 'center', fontSize: 13, background: i === 0 ? 'var(--bone)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 34, background: '#fff', border: '1px solid var(--line)', borderRadius: 2, flexShrink: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 2, background: 'var(--ink-2)' }} />
                <div style={{ position: 'absolute', top: 10, left: 4, right: 10, height: 1, background: 'var(--ink-4)' }} />
                <div style={{ position: 'absolute', top: 15, left: 4, right: 6, height: 1, background: 'var(--ink-4)' }} />
                <div style={{ position: 'absolute', top: 20, left: 4, right: 8, height: 1, background: 'var(--ink-4)' }} />
              </div>
              <div style={{ fontWeight: v.tags.includes('base') ? 600 : 400 }}>{v.name}</div>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.ver}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: statusDot[v.status] }} />
              <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v.status}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.updated}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.jd || '—'}</div>
            <div style={{ textAlign: 'right' }}>
              <span className="serif" style={{ fontSize: 18 }}>{v.score}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="rb-btn ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Open</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 14, textAlign: 'center' }}>
        6 versions · all local · exportable as JSON Resume
      </div>
    </div>
  );
}

Object.assign(window, { AppChrome, EditorView, TailorView, TemplatesView, VersionsView, Logo });
