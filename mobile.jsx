// resume/ — mobile views, designed for iPhone (402×874).
// Uses tokens from styles.css and ResumePaper from data.jsx.

/* ── shared bits ── */
const M = {
  bone: '#f6f2ea',
  paper: '#fbf9f4',
  ink: '#18140f',
  ink2: '#3a332a',
  ink3: '#6b6358',
  ink4: '#9a9286',
  line: '#d9d2c4',
  line2: '#e6dfd0',
  bone2: '#ede7db',
  accent: 'oklch(0.62 0.17 35)',
  accentInk: 'oklch(0.35 0.12 35)',
  accentTint: 'oklch(0.95 0.03 35)',
  ok: 'oklch(0.62 0.14 150)',
  serif: "'Instrument Serif', serif",
  sans: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

function MTopBar({ title, kicker, right, accent }) {
  return (
    <div style={{ padding: '12px 16px 14px', borderBottom: `1px solid ${M.line}`, background: M.paper, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        {kicker && <div style={{ fontFamily: M.mono, fontSize: 9.5, color: accent ? M.accentInk : M.ink3, letterSpacing: 0.8, marginBottom: 3, textTransform: 'uppercase' }}>◆ {kicker}</div>}
        <div style={{ fontFamily: M.serif, fontSize: 26, letterSpacing: '-0.015em', color: M.ink, lineHeight: 1.05 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function MTabBar({ active = 'editor', onTab }) {
  const tabs = [
    { id: 'editor', label: 'Edit', icon: <path d="M3 14V4l9 9H3z M14 3l3 3-1.5 1.5-3-3L14 3z" fill="currentColor" fillRule="evenodd"/> },
    { id: 'tailor', label: 'Tailor', icon: <path d="M10 2v3M10 15v3M2 10h3M15 10h3M5 5l2 2M13 13l2 2M5 15l2-2M13 7l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/> },
    { id: 'templates', label: 'Designs', icon: <path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" fill="none" stroke="currentColor" strokeWidth="1.6"/> },
    { id: 'versions', label: 'Versions', icon: <path d="M5 3v14M5 3l4 4M5 3L1 7M14 7v10M14 17l4-4M14 17l-4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/> },
    { id: 'beyond', label: 'More', icon: <><circle cx="5" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/></> },
  ];
  return (
    <div style={{ borderTop: `0.5px solid ${M.line}`, background: 'rgba(251,249,244,0.92)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-around', padding: '6px 4px 8px', flexShrink: 0 }}>
      {tabs.map(t => (
        <div key={t.id} onClick={() => onTab && onTab(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '4px 0', color: active === t.id ? M.ink : M.ink4, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 20 20">{t.icon}</svg>
          <div style={{ fontSize: 9.5, fontFamily: M.sans, fontWeight: active === t.id ? 600 : 400, letterSpacing: 0.1 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function MShell({ children, tab = 'editor' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: M.bone, fontFamily: M.sans }}>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="rb-scroll">{children}</div>
      <MTabBar active={tab} />
    </div>
  );
}

/* ── 1. Editor (mobile) ── */
function MEditor() {
  return (
    <MShell tab="editor">
      <MTopBar
        kicker="Maya Chen · base resume"
        title="Editor"
        right={<button className="rb-btn primary" style={{ fontSize: 11, padding: '6px 10px' }}>Export</button>}
      />
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 6 }}>SECTIONS</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['Basics', 'done'], ['Summary', 'done'], ['Experience', 'edit'],
            ['Education', 'done'], ['Skills', 'done'], ['Projects', 'empty'],
          ].map(([l, s]) => (
            <span key={l} style={{
              fontSize: 11.5, padding: '4px 10px', borderRadius: 14,
              background: s === 'edit' ? M.ink : s === 'done' ? M.bone2 : 'transparent',
              color: s === 'edit' ? M.paper : s === 'done' ? M.ink2 : M.ink4,
              border: s === 'empty' ? `1px dashed ${M.line}` : `1px solid transparent`,
              fontWeight: s === 'edit' ? 600 : 400,
            }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ background: M.paper, padding: '14px 16px 8px', borderTop: `1px solid ${M.line}`, borderBottom: `1px solid ${M.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: M.serif, fontSize: 22, letterSpacing: '-0.01em' }}>Experience</div>
          <span style={{ fontFamily: M.mono, fontSize: 10, color: M.ink3 }}>3 roles · 7 bullets</span>
        </div>

        <MExpCard role="Senior Product Designer, Platform" company="Figma" dates="2022 – Now" expanded
          bullets={[
            { score: 92, text: "Led end-to-end design for the Plugin API v3, adopted by 14,000+ developers and surfaced across 9M files in the first year." },
            { score: 88, text: "Ran a cross-functional redesign of the plugin store, lifting install-through rate 38% and author retention 22%." },
            { score: 76, text: "Built the internal design system for platform surfaces — 120+ components used by 6 product teams." },
          ]}
        />
        <MExpCard role="Product Designer" company="Linear" dates="2019 – 2022" />
        <MExpCard role="Interaction Designer" company="IDEO" dates="2017 – 2019" />

        <button className="rb-btn ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8, borderStyle: 'dashed', borderColor: M.line, fontSize: 12 }}>+ Add role</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 8 }}>LIVE PREVIEW · LETTER</div>
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 22px rgba(0,0,0,.08)', overflow: 'hidden', borderRadius: 4, height: 220, position: 'relative' }}>
          <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', width: 612 }}>
            <ResumePaper scale={1} template="classic" />
          </div>
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: M.ink, color: M.paper, padding: '3px 7px', fontFamily: M.mono, fontSize: 9, borderRadius: 3 }}>1 of 1</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="rb-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Open preview</button>
          <button className="rb-btn ghost" style={{ fontSize: 12 }}>Switch design</button>
        </div>
      </div>
    </MShell>
  );
}

function MExpCard({ role, company, dates, bullets, expanded }) {
  return (
    <div style={{ border: `1px solid ${M.line}`, borderRadius: 8, marginBottom: 8, background: M.paper, overflow: 'hidden' }}>
      <div style={{ padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 8, background: expanded ? M.bone2 : 'transparent' }}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: M.ink3, transform: expanded ? 'rotate(90deg)' : 'none' }}><path d="M3 2l3 2.5L3 7"/></svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{role}</div>
          <div style={{ fontSize: 11, color: M.ink3 }}>{company} · {dates}</div>
        </div>
        {bullets && <span style={{ fontFamily: M.mono, fontSize: 10, color: M.ink4 }}>{bullets.length}</span>}
      </div>
      {expanded && bullets && (
        <div style={{ padding: '6px 12px 12px', borderTop: `1px solid ${M.line2}` }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < bullets.length - 1 ? `1px solid ${M.line2}` : 'none', display: 'flex', gap: 8 }}>
              <div style={{ fontFamily: M.mono, fontSize: 10, color: b.score >= 90 ? M.ok : b.score >= 80 ? M.ink2 : M.ink4, marginTop: 2, minWidth: 22 }}>{b.score}</div>
              <div style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: M.ink2 }}>{b.text}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="rb-btn" style={{ fontSize: 11, padding: '4px 8px' }}>✦ Rewrite</button>
            <button className="rb-btn ghost" style={{ fontSize: 11, padding: '4px 8px' }}>+ Bullet</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 2. Tailor (mobile) ── */
function MTailor() {
  return (
    <MShell tab="tailor">
      <MTopBar kicker="Tailor to JD" title="Vercel" accent
        right={<span className="rb-tag accent" style={{ fontSize: 9 }}>v2 · TAILORED</span>} />

      <div style={{ padding: '14px 16px', background: M.paper, borderBottom: `1px solid ${M.line}` }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 6 }}>MATCH SCORE · +14 vs base</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: M.serif, fontSize: 56, letterSpacing: '-0.025em', lineHeight: 1 }}>82</span>
          <span style={{ fontSize: 13, color: M.ink3 }}>/ 100</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: M.mono, fontSize: 10, color: M.ok }}>▲ +14</span>
        </div>
        <div style={{ height: 5, background: M.bone2, marginTop: 10, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '68%', background: M.ink4 }} />
          <div style={{ position: 'absolute', left: '68%', top: 0, bottom: 0, width: '14%', background: M.accent }} />
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 8 }}>JOB DESCRIPTION · COLLAPSED</div>
        <div style={{ background: M.paper, border: `1px solid ${M.line}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.55, color: M.ink2, position: 'relative', maxHeight: 80, overflow: 'hidden' }}>
          <strong style={{ color: M.ink }}>Sr. Product Designer · Platform.</strong> We're building the platform team at Vercel. You'll own design of our developer-facing surfaces — dashboards, deployment flows, and the design system that powers them…
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: `linear-gradient(transparent, ${M.paper})` }} />
        </div>

        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, margin: '16px 0 8px' }}>KEYWORDS · 5 OF 8</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            ['design systems', 1], ['platform', 1], ['prototyping', 1], ['developer experience', 1], ['figma', 1],
            ['api design', 0], ['serverless', 0], ['edge functions', 0],
          ].map(([k, hit]) => (
            <span key={k} style={{
              fontFamily: M.mono, fontSize: 10.5, padding: '3px 7px', borderRadius: 3,
              background: hit ? M.ink : 'transparent', color: hit ? M.paper : M.ink4,
              border: `1px solid ${hit ? M.ink : M.line}`,
              textDecoration: hit ? 'none' : 'line-through',
            }}>{k}</span>
          ))}
        </div>

        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, margin: '16px 0 8px' }}>SUGGESTIONS · 3</div>
        {[
          { kicker: 'BULLET 2 · FIGMA', title: "Add 'API design' explicitly" },
          { kicker: 'SUMMARY', title: "Lead with 'platform'" },
          { kicker: 'SKILLS', title: "Swap Swift for TypeScript" },
        ].map((s, i) => (
          <div key={i} style={{ background: M.paper, border: `1px solid ${M.line}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: M.mono, fontSize: 9, color: M.accentInk, letterSpacing: 0.6 }}>{s.kicker}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{s.title}</div>
            </div>
            <button className="rb-btn accent" style={{ fontSize: 11, padding: '4px 10px' }}>Apply</button>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button className="rb-btn primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13 }}>
          ✦ Re-tailor with all suggestions
        </button>
      </div>
    </MShell>
  );
}

/* ── 3. Templates (mobile) ── */
function MTemplates() {
  const tpls = [
    { id: 'classic', name: 'Kraft', sub: 'Classic · 98', tpl: 'classic' },
    { id: 'editorial', name: 'Folio', sub: 'Editorial · 94', tpl: 'editorial' },
    { id: 'technical', name: 'Monolith', sub: 'Technical · 91', tpl: 'technical' },
    { id: 'classic2', name: 'Letter', sub: 'Classic · 99', tpl: 'classic' },
    { id: 'editorial2', name: 'Masthead', sub: 'Editorial · 90', tpl: 'editorial' },
    { id: 'technical2', name: 'README', sub: 'Technical · 89', tpl: 'technical' },
  ];

  return (
    <MShell tab="templates">
      <MTopBar kicker="6 of 8 · all free" title="Designs"
        right={<button className="rb-btn ghost" style={{ fontSize: 11, padding: '6px 8px' }}>Filter</button>} />
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {tpls.map((t, i) => (
            <div key={t.id}>
              <div style={{ width: '100%', aspectRatio: '612/792', background: '#fff', border: i === 1 ? `2px solid ${M.ink}` : `1px solid ${M.line}`, borderRadius: 4, overflow: 'hidden', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <div style={{ transform: 'scale(0.27)', transformOrigin: 'top left' }}>
                  <ResumePaper scale={1} template={t.tpl} />
                </div>
                {i === 1 && <div style={{ position: 'absolute', top: 6, right: 6, background: M.ink, color: M.paper, padding: '2px 6px', fontFamily: M.mono, fontSize: 9, borderRadius: 2 }}>SELECTED</div>}
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontFamily: M.serif, fontSize: 16, letterSpacing: '-0.005em' }}>{t.name}</div>
                <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3 }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MShell>
  );
}

/* ── 4. Versions (mobile) ── */
function MVersions() {
  const versions = [
    { name: "Maya Chen — base", ver: "v1", updated: "2m ago", status: 'draft', dot: M.ink4, score: 68, tag: 'BASE' },
    { name: "→ Vercel · Sr. Product Designer", ver: "v2", updated: "now", status: 'applied', dot: M.accent, score: 82 },
    { name: "→ Linear · Design Lead", ver: "v3", updated: "2d", status: 'interview', dot: M.ok, score: 88 },
    { name: "→ Anthropic · Product Designer", ver: "v2", updated: "5d", status: 'applied', dot: M.accent, score: 79 },
    { name: "→ Stripe · Staff Designer", ver: "v1", updated: "1w", status: 'rejected', dot: M.ink4, score: 71 },
    { name: "→ Ramp · Senior Designer", ver: "v2", updated: "2w", status: 'offer', dot: M.ok, score: 85 },
  ];

  return (
    <MShell tab="versions">
      <MTopBar kicker="6 versions · all local" title="Versions"
        right={<button className="rb-btn primary" style={{ fontSize: 11, padding: '6px 10px' }}>+ Tailor</button>} />
      <div style={{ padding: 16 }}>
        {versions.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < versions.length - 1 ? `1px solid ${M.line2}` : 'none' }}>
            <div style={{ width: 30, height: 40, background: '#fff', border: `1px solid ${M.line}`, borderRadius: 2, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 5, left: 4, right: 4, height: 2, background: M.ink2 }} />
              <div style={{ position: 'absolute', top: 11, left: 4, right: 10, height: 1, background: M.ink4 }} />
              <div style={{ position: 'absolute', top: 16, left: 4, right: 6, height: 1, background: M.ink4 }} />
              <div style={{ position: 'absolute', top: 21, left: 4, right: 9, height: 1, background: M.ink4 }} />
              <div style={{ position: 'absolute', top: 26, left: 4, right: 7, height: 1, background: M.ink4 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: v.tag ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: v.dot }} />
                <span style={{ fontSize: 11, color: M.ink3, textTransform: 'capitalize' }}>{v.status}</span>
                <span style={{ fontFamily: M.mono, fontSize: 10, color: M.ink4 }}>· {v.ver} · {v.updated}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: M.serif, fontSize: 20, letterSpacing: '-0.01em' }}>{v.score}</div>
              <div style={{ fontFamily: M.mono, fontSize: 9, color: M.ink4 }}>match</div>
            </div>
          </div>
        ))}
      </div>
    </MShell>
  );
}

/* ── 5. Cover Letter (mobile) ── */
function MCoverLetter() {
  return (
    <MShell tab="beyond">
      <MTopBar kicker="Beyond · Vercel" title="Cover letter" accent
        right={<button className="rb-btn primary" style={{ fontSize: 11, padding: '6px 10px' }}>Copy</button>} />

      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${M.line}`, background: M.paper }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 8 }}>TONE</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Direct', 'Warm', 'Story', 'Formal'].map((t, i) => (
            <span key={t} style={{
              flex: 1, textAlign: 'center', fontSize: 12,
              padding: '7px 0', borderRadius: 6,
              background: i === 0 ? M.ink : M.paper,
              color: i === 0 ? M.paper : M.ink2,
              border: `1px solid ${i === 0 ? M.ink : M.line}`,
              fontWeight: i === 0 ? 600 : 400,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: M.ink3, fontFamily: M.mono }}>
          <span>Length · <strong style={{ color: M.ink }}>180w</strong></span>
          <span>Reading · <strong style={{ color: M.ink }}>45s</strong></span>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ background: '#fff', border: `1px solid ${M.line}`, borderRadius: 8, padding: '18px 20px', fontFamily: M.serif, fontSize: 13, lineHeight: 1.6, color: M.ink }}>
          <div style={{ fontFamily: M.sans, fontSize: 11, color: M.ink3, marginBottom: 12 }}>To the Vercel platform team,</div>
          <p style={{ margin: '0 0 10px' }}>Your Plugin API post sounded like a description of the last three years of my work, so I'm writing in case it's also a description of the next three.</p>
          <p style={{ margin: '0 0 10px' }}>At Figma I led <mark style={{ background: M.accentTint, padding: '0 2px', color: M.accentInk }}>Plugin API v3</mark> end-to-end — research through launch — and watched 14,000 developers build on it. The work was as much <mark style={{ background: M.accentTint, padding: '0 2px', color: M.accentInk }}>API design</mark> as it was UX: deciding what to expose, what to hide, what shape the surface should take.</p>
          <p style={{ margin: '0 0 0' }}>Before that I built Linear's first design system. Both jobs taught me the same lesson: developer-facing products live or die by the seams between the surfaces…</p>
          <div style={{ fontFamily: M.sans, fontSize: 11, color: M.ink3, marginTop: 12 }}>— Maya</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button className="rb-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>✦ Regenerate</button>
          <button className="rb-btn ghost" style={{ fontSize: 12 }}>Edit</button>
        </div>

        <div style={{ marginTop: 16, padding: '12px 14px', background: M.bone2, borderRadius: 8 }}>
          <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.accentInk, letterSpacing: 0.6, marginBottom: 4 }}>◆ THE RECEIPT</div>
          <div style={{ fontSize: 12, color: M.ink2, lineHeight: 1.5 }}>
            Pulled <strong>Plugin API v3</strong> + <strong>API design</strong> from your Figma role; matched the JD's "platform" framing in the second graf.
          </div>
        </div>
      </div>
    </MShell>
  );
}

/* ── 6. Outreach (mobile) ── */
function MOutreach() {
  return (
    <MShell tab="beyond">
      <MTopBar kicker="Beyond · Outreach" title="Reach out" accent />

      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${M.line}`, background: M.paper }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 8 }}>RECIPIENT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: M.bone2, borderRadius: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: M.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: M.serif, fontSize: 16 }}>GR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Guillermo Rauch</div>
            <div style={{ fontSize: 11, color: M.ink3 }}>CEO @ Vercel · Mutual: <strong>Tom O.</strong></div>
          </div>
          <span className="rb-tag" style={{ fontSize: 9 }}>WARM</span>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['DM (X)', 'LinkedIn', 'Email', 'Referral'].map((t, i) => (
            <span key={t} style={{
              fontSize: 11.5, padding: '5px 10px', borderRadius: 14,
              background: i === 0 ? M.ink : 'transparent',
              color: i === 0 ? M.paper : M.ink3,
              border: `1px solid ${i === 0 ? M.ink : M.line}`,
              fontWeight: i === 0 ? 600 : 400,
            }}>{t}</span>
          ))}
        </div>

        <div style={{ background: '#fff', border: `1px solid ${M.line}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 4 }}>DM · X</div>
          <div style={{ fontSize: 13, color: M.ink, lineHeight: 1.55 }}>
            Hey Guillermo — Tom mentioned you were hiring for the platform team. I led Plugin API v3 at Figma (the v3 spec); your post reads like the same job. Quick portfolio: <span style={{ color: M.accentInk }}>mayachen.design/vercel</span>. Worth a 15?
          </div>
          <div style={{ fontFamily: M.mono, fontSize: 10, color: M.ink4, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>· 247 chars · under DM cap</span>
            <span>v2</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <button className="rb-btn ghost" style={{ fontSize: 11 }}>More casual</button>
          <button className="rb-btn ghost" style={{ fontSize: 11 }}>Drop the link</button>
          <button className="rb-btn ghost" style={{ fontSize: 11 }}>Lead with the role</button>
        </div>

        <div style={{ marginTop: 14, fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 8 }}>VARIATIONS · 2 MORE</div>
        {[
          { kicker: 'WARMER', preview: "Hey G — long-time Vercel user. Tom said you were hiring on the platform side…" },
          { kicker: 'COLDER', preview: "Hi Guillermo — saw the Sr. Product Designer post. Led Figma's Plugin API v3…" },
        ].map((v, i) => (
          <div key={i} style={{ background: M.paper, border: `1px solid ${M.line}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
            <div style={{ fontFamily: M.mono, fontSize: 9, color: M.accentInk, letterSpacing: 0.6 }}>{v.kicker}</div>
            <div style={{ fontSize: 12, color: M.ink2, marginTop: 3, lineHeight: 1.5 }}>{v.preview}</div>
          </div>
        ))}
      </div>
    </MShell>
  );
}

/* ── 7. Interview prep (mobile) ── */
function MInterview() {
  return (
    <MShell tab="beyond">
      <MTopBar kicker="Beyond · Vercel" title="Interview prep" accent
        right={<span className="rb-tag" style={{ fontSize: 9 }}>12 Q</span>} />

      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontFamily: M.mono, fontSize: 9.5, color: M.ink3, letterSpacing: 0.6, marginBottom: 8 }}>LIKELY QUESTIONS · DERIVED FROM JD + YOUR RESUME</div>

        {[
          { kicker: 'TECHNICAL · HIGH', q: "Walk me through how you'd design a Plugin API for Vercel.", why: "Your Figma role + their platform pitch = guaranteed.", confidence: 'strong' },
          { kicker: 'BEHAVIORAL', q: "Tell me about a time you shipped something that broke.", why: "Standard. Have a story ready about a Linear regression.", confidence: 'ok' },
          { kicker: 'SYSTEMS · HIGH', q: "How do you scale a design system across 6+ product teams?", why: "Direct match to your Figma bullet 3.", confidence: 'strong' },
          { kicker: 'PORTFOLIO', q: "Show one decision you'd make differently today.", why: "Vercel asks this. Have a real one — not a humble-brag.", confidence: 'weak' },
          { kicker: 'CULTURE', q: "Why Vercel and not Cloudflare?", why: "They want specifics. Avoid \"I love your DX.\"", confidence: 'ok' },
        ].map((qq, i) => (
          <div key={i} style={{ background: M.paper, border: `1px solid ${M.line}`, borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontFamily: M.mono, fontSize: 9, color: M.accentInk, letterSpacing: 0.6 }}>{qq.kicker}</div>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: qq.confidence === 'strong' ? M.ok : qq.confidence === 'ok' ? '#c9a342' : M.accent }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: M.ink, lineHeight: 1.4 }}>{qq.q}</div>
            <div style={{ fontSize: 11.5, color: M.ink3, marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>{qq.why}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="rb-btn ghost" style={{ fontSize: 11, padding: '3px 8px' }}>✦ Draft answer</button>
              <button className="rb-btn ghost" style={{ fontSize: 11, padding: '3px 8px', color: M.ink4 }}>Skip</button>
            </div>
          </div>
        ))}
      </div>
    </MShell>
  );
}

/* ── 8. Landing (mobile) ── */
function MLanding() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: M.bone, fontFamily: M.sans }} className="rb-scroll">
      {/* nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(246,242,234,0.94)', backdropFilter: 'blur(12px)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${M.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 15 }}>
          <Logo size={20} /><span>resume<span style={{ color: M.accent }}>/</span></span>
        </div>
        <button className="rb-btn primary" style={{ fontSize: 12, padding: '6px 12px' }}>Start →</button>
      </div>

      {/* hero */}
      <div style={{ padding: '28px 20px 20px' }}>
        <div style={{ fontFamily: M.mono, fontSize: 10, color: M.accentInk, letterSpacing: 0.8, marginBottom: 12 }}>◆ OPEN SOURCE · FREE FOREVER</div>
        <h1 style={{ fontFamily: M.serif, fontSize: 48, lineHeight: 0.98, margin: 0, letterSpacing: '-0.02em' }}>
          A resume<br/>
          <span style={{ fontStyle: 'italic' }}>worth</span> reading.
        </h1>
        <div style={{ fontSize: 14, color: M.ink2, marginTop: 14, lineHeight: 1.55 }}>
          Paste a job description. Get a resume tailored to it. Your data stays on your phone.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="rb-btn accent" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '11px' }}>Start writing →</button>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: M.ink3 }}>
          <span>✓ No email</span>
          <span>✓ Offline</span>
          <span>✓ MIT</span>
        </div>
      </div>

      {/* hero preview */}
      <div style={{ padding: '0 20px 28px', position: 'relative' }}>
        <div style={{ transform: 'rotate(-1.5deg)' }}>
          <div style={{ width: '100%', aspectRatio: '612/792', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.1), 0 16px 40px rgba(0,0,0,.08)', overflow: 'hidden', borderRadius: 4, position: 'relative' }}>
            <div style={{ transform: 'scale(0.58)', transformOrigin: 'top left', width: 612 }}>
              <ResumePaper scale={1} template="editorial" />
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 30, right: 14, background: M.ink, color: M.paper, padding: '8px 12px', borderRadius: 4, transform: 'rotate(4deg)', boxShadow: '0 8px 18px rgba(0,0,0,.15)' }}>
          <div style={{ fontFamily: M.mono, fontSize: 8, opacity: 0.6, letterSpacing: 0.6 }}>ATS</div>
          <div style={{ fontFamily: M.serif, fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1 }}>94</div>
        </div>
      </div>

      {/* pillars */}
      <div style={{ padding: '4px 20px 28px' }}>
        {[
          { kicker: '01 · EDITOR', title: 'Start with a blank page.', body: 'Six hand-designed templates. All ATS-safe. All free.' },
          { kicker: '02 · TAILOR', title: 'Paste a JD, get a match.', body: 'Real keyword gap. Real ATS heuristics. Every suggestion shows its diff.' },
          { kicker: '03 · OPEN', title: 'Your resume, your file.', body: 'JSON Resume native. Export anywhere. Self-host with one Docker.' },
        ].map((p, i) => (
          <div key={i} style={{ borderTop: `2px solid ${M.ink}`, paddingTop: 12, marginBottom: 22 }}>
            <div style={{ fontFamily: M.mono, fontSize: 10, color: M.accentInk, letterSpacing: 0.8, marginBottom: 8 }}>◆ {p.kicker}</div>
            <div style={{ fontFamily: M.serif, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: M.ink2 }}>{p.body}</div>
          </div>
        ))}
      </div>

      {/* final cta */}
      <div style={{ background: M.ink, color: M.paper, padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: M.mono, fontSize: 10, color: 'oklch(0.75 0.12 35)', letterSpacing: 0.8, marginBottom: 10 }}>◆ IT'S JUST A RESUME BUILDER</div>
        <h2 style={{ fontFamily: M.serif, fontSize: 40, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
          It shouldn't cost<br/><span style={{ fontStyle: 'italic', color: 'oklch(0.85 0.1 35)' }}>twenty bucks a month.</span>
        </h2>
        <button className="rb-btn" style={{ marginTop: 20, background: M.paper, color: M.ink, fontSize: 13, padding: '10px 18px' }}>Start writing →</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  MEditor, MTailor, MTemplates, MVersions,
  MCoverLetter, MOutreach, MInterview, MLanding,
});
