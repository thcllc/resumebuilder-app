// resume/ — strategy frame (teardown, principles, roadmap, system)

function StrategyCover() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bone)', padding: '64px 72px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
          DESIGN BRIEF · v0.1 · APR 2026
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>01 / 06</div>
      </div>
      <div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--accent-ink)', marginBottom: 20, letterSpacing: '0.08em' }}>◆ A REVAMP PLAN FOR RESUMEBUILDER.APP</div>
        <h1 className="serif" style={{ fontSize: 120, lineHeight: 0.95, margin: 0, letterSpacing: '-0.025em' }}>
          The best<br/>
          <span style={{ fontStyle: 'italic', color: 'var(--accent-ink)' }}>open-source</span><br/>
          resume builder<br/>
          in the world.
        </h1>
        <div style={{ display: 'flex', gap: 48, marginTop: 48, fontSize: 14, color: 'var(--ink-2)', maxWidth: 820 }}>
          <div style={{ flex: 1, lineHeight: 1.55 }}>
            A short strategy, a working prototype, and a pile of opinions — proposing what a reboot of <span className="mono" style={{ fontSize: 12 }}>resumebuilder.app</span> could be if we took it seriously as an open, free, AI-native tool for everyone.
          </div>
          <div style={{ flex: 1, lineHeight: 1.55 }}>
            The category is full of freemium traps and dated templates. The winning move isn't another template gallery — it's being the only one that actually helps you <em className="serif" style={{ fontSize: 16 }}>get the job</em>.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>resume/ — a working name</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>→ swipe right to read</div>
      </div>
    </div>
  );
}

function StrategyTeardown() {
  const competitors = [
    { name: "resumebuilder.app", strengths: ["Clean editor", "Free tier exists"], weaknesses: ["Not open source", "Template lock-in", "Thin AI"], stars: "—" },
    { name: "Reactive Resume", strengths: ["Mature OSS", "12 templates", "Self-host"], weaknesses: ["Account required", "AI is bolted on", "Dated UI"], stars: "32k★" },
    { name: "OpenResume", strengths: ["Privacy-first, local-only", "ATS-focused", "PDF parser"], weaknesses: ["Single template", "US-only tone", "No AI"], stars: "9k★" },
    { name: "Resume.io / Zety", strengths: ["Polished UX", "Market reach"], weaknesses: ["Dark patterns", "Paywall after draft", "Not free"], stars: "closed" },
    { name: "Kickresume", strengths: ["AI copy", "Broad templates"], weaknesses: ["Watermark on free", "Subscription trap"], stars: "closed" },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper)', padding: '56px 72px', display: 'flex', flexDirection: 'column' }}>
      <PageHeader num="02" label="LANDSCAPE" title="What's out there, and where it's weak" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 0.4fr', gap: 0, marginTop: 36, fontSize: 13 }}>
        <TableHeader>Tool</TableHeader>
        <TableHeader>Strengths</TableHeader>
        <TableHeader>Weaknesses</TableHeader>
        <TableHeader align="right">GH</TableHeader>
        {competitors.map((c, i) => (
          <React.Fragment key={i}>
            <TableCell><strong style={{ fontWeight: 600 }}>{c.name}</strong></TableCell>
            <TableCell>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {c.strengths.map((s, j) => <li key={j} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: 'var(--ok)' }}>+</span><span>{s}</span></li>)}
              </ul>
            </TableCell>
            <TableCell>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {c.weaknesses.map((s, j) => <li key={j} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: 'var(--accent)' }}>−</span><span>{s}</span></li>)}
              </ul>
            </TableCell>
            <TableCell align="right"><span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.stars}</span></TableCell>
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, paddingTop: 48, borderTop: '1px solid var(--line)' }}>
        <Insight kicker="Opportunity 01" title="None of them actually help you ship">
          Every tool fixates on rendering. The moment a JD is pasted, they go silent. The winner is the one that closes the loop — JD in, tailored resume out, evidence why.
        </Insight>
        <Insight kicker="Opportunity 02" title="Open-source lacks beautiful defaults">
          OSS templates look like 2014 LaTeX. The paid guys have designers. This is a solvable, pure-design problem and it's the single biggest switch-driver.
        </Insight>
        <Insight kicker="Opportunity 03" title="Privacy is a feature, not a checkbox">
          Resumes are some of the most sensitive data a person owns. Local-first + no-account is a rare stance you can own completely.
        </Insight>
      </div>

      <PageFooter n="02" />
    </div>
  );
}

function StrategyPrinciples() {
  const principles = [
    { n: "I", title: "Local by default", body: "Your data never leaves your browser unless you explicitly export it. No account, no email, no tracking. The free tier isn't a trap — it's the whole product." },
    { n: "II", title: "AI is a co-writer, not a wrapper", body: "We don't slap \"AI\" on buttons. AI rewrites bullets, tailors to JDs, and scores against real ATS heuristics. Always transparent — every suggestion shows its diff." },
    { n: "III", title: "Templates are taste, not a store", body: "Eight templates, hand-designed, all ATS-safe, all free forever. No upsell, no watermarks, no \"premium\" tier. Switching templates never loses content." },
    { n: "IV", title: "JSON Resume is the source of truth", body: "Your resume is a file you own. Import anywhere, export anywhere, self-host, version with git. The app is a view over the data — not the other way around." },
    { n: "V", title: "Get the job, not the resume", body: "Cover letters, outreach messages, interview prep — all from the same data. Tracked applications. The resume is table stakes; the job is the goal." },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bone)', padding: '56px 72px', display: 'flex', flexDirection: 'column' }}>
      <PageHeader num="03" label="PRINCIPLES" title="Five commitments we won't negotiate on" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px 56px', marginTop: 48, flex: 1, alignContent: 'start' }}>
        {principles.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 20 }}>
            <div className="serif" style={{ fontSize: 48, lineHeight: 0.9, color: 'var(--accent)', fontStyle: 'italic', minWidth: 50 }}>{p.n}</div>
            <div>
              <div className="serif" style={{ fontSize: 22, marginBottom: 6, letterSpacing: '-0.01em' }}>{p.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>{p.body}</div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <div className="serif" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--ink-3)', lineHeight: 1.3, borderLeft: '2px solid var(--accent)', paddingLeft: 16 }}>
            "If a principle isn't worth saying no to a feature for, it isn't a principle."
          </div>
        </div>
      </div>

      <PageFooter n="03" />
    </div>
  );
}

function StrategyFeatures() {
  const pillars = [
    {
      title: "The Editor",
      items: [
        { tag: "core", name: "Split form + live PDF", note: "Real PDF preview, not a mockup. Updates keystroke-fast." },
        { tag: "core", name: "Content-aware sections", note: "Drag-to-reorder, hide-for-role, custom section types." },
        { tag: "ai", name: "Rewrite this bullet", note: "Impact-first, metrics-forward, one click." },
        { tag: "ai", name: "Polish pass", note: "Consistency, tense, active voice. Shows the diff." },
      ],
    },
    {
      title: "Tailor-to-JD",
      items: [
        { tag: "hero", name: "Paste a JD, get a tailored draft", note: "Not just keywords — reframed bullets, reordered sections." },
        { tag: "ai", name: "Keyword gap analysis", note: "What the JD asks for, what you have, what's missing." },
        { tag: "ai", name: "ATS score", note: "Real heuristics: parsability, section order, verbosity." },
        { tag: "core", name: "Versions per application", note: "One base resume, unlimited tailored forks." },
      ],
    },
    {
      title: "Beyond the PDF",
      items: [
        { tag: "core", name: "Cover letter, generated", note: "From resume + JD. Editable. Matches the resume's template." },
        { tag: "core", name: "Outreach DM drafts", note: "Short, sharp, copy-ready. For cold and warm intros." },
        { tag: "ai", name: "Interview prep", note: "Likely questions based on the JD + your background." },
        { tag: "core", name: "Application tracker", note: "Light-touch. Opt-in. Never the point." },
      ],
    },
    {
      title: "Open & Portable",
      items: [
        { tag: "core", name: "JSON Resume schema", note: "Native format. Import / export / git-version." },
        { tag: "core", name: "PDF / LinkedIn import", note: "Upload once, keep editing." },
        { tag: "core", name: "Self-host in one Docker", note: "Works offline. MIT licensed." },
        { tag: "core", name: "Plugin API", note: "Custom templates, sections, exporters." },
      ],
    },
  ];

  const tagColor = (t) => t === 'hero' ? 'accent' : t === 'ai' ? 'warn' : '';

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper)', padding: '56px 72px', display: 'flex', flexDirection: 'column' }}>
      <PageHeader num="04" label="SCOPE" title="What we're building, in four pillars" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 32, marginTop: 40, flex: 1 }}>
        {pillars.map((p, i) => (
          <div key={i} style={{ borderTop: '2px solid var(--ink)', paddingTop: 14 }}>
            <div className="serif" style={{ fontSize: 24, marginBottom: 20, letterSpacing: '-0.01em' }}>{p.title}</div>
            <div>
              {p.items.map((it, j) => (
                <div key={j} style={{ padding: '12px 0', borderBottom: j < p.items.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`rb-tag ${tagColor(it.tag)}`}>{it.tag}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>{it.note}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PageFooter n="04" />
    </div>
  );
}

function StrategyRoadmap() {
  const phases = [
    {
      quarter: "Q2 ’26", label: "FOUNDATION", goal: "Ship the best free editor in the category.",
      items: ["Editor v1 (form + live preview)", "6 hand-designed templates", "JSON Resume import/export", "PDF export", "Local-only storage", "Landing + public beta"],
    },
    {
      quarter: "Q3 ’26", label: "TAILOR", goal: "Close the loop between resume and job.",
      items: ["Paste-a-JD tailoring", "ATS scoring engine", "Keyword gap analysis", "Versions per application", "Rewrite / polish AI actions", "PDF parser + LinkedIn import"],
    },
    {
      quarter: "Q4 ’26", label: "BEYOND", goal: "Own the \"get the job\" end-to-end.",
      items: ["Cover letters", "Outreach DM drafts", "Interview prep", "Application tracker (opt-in)", "Shareable review links", "Mobile editor"],
    },
    {
      quarter: "2027+", label: "PLATFORM", goal: "Become the JSON-Resume standard.",
      items: ["Plugin API (templates, sections, exporters)", "Self-host Docker image", "Team / coaching workflows", "CLI (resumectl)", "Localization (10+ languages)"],
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bone)', padding: '56px 72px', display: 'flex', flexDirection: 'column' }}>
      <PageHeader num="05" label="ROADMAP" title="Eighteen months, four phases" />

      <div style={{ marginTop: 48, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 140px 1fr 2.2fr', gap: 24, padding: '20px 0', borderTop: '1px solid var(--line)', alignItems: 'start' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--accent-ink)', letterSpacing: '0.06em', paddingTop: 2 }}>{p.quarter}</div>
            <div className="serif" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>{p.label}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{p.goal}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
              {p.items.map((it, j) => (
                <div key={j} style={{ fontSize: 12, color: 'var(--ink-2)', display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>0{j + 1}</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--line)' }} />
      </div>

      <PageFooter n="05" />
    </div>
  );
}

function StrategyMetrics() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper)', padding: '56px 72px', display: 'flex', flexDirection: 'column' }}>
      <PageHeader num="06" label="METRICS & RISKS" title="How we'll know it's working" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, marginTop: 40, flex: 1 }}>
        <div>
          <SubHead>North star</SubHead>
          <div className="serif" style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 8, letterSpacing: '-0.015em' }}>
            Resumes that led to an interview, per week.
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: 520 }}>
            Self-reported, opt-in. If people aren't telling us it got them interviews, we haven't built the thing.
          </div>

          <div style={{ marginTop: 40 }}>
            <SubHead>Supporting metrics</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 40px', marginTop: 12 }}>
              <Metric n="92%" label="Time-to-first-PDF under 10 min" />
              <Metric n="3.0" label="Avg tailored versions per user" />
              <Metric n="70%+" label="ATS pass rate on test corpus" />
              <Metric n="<40kb" label="JSON Resume file sizes remain tiny" />
            </div>
          </div>
        </div>

        <div>
          <SubHead>Risks & how we handle them</SubHead>
          <Risk title="AI goes off-script" body="Never auto-apply suggestions. Always show the diff. Let users reject with one key." />
          <Risk title="Privacy narrative collapses" body="Third-party security audit, public threat model, and an air-gapped self-host build." />
          <Risk title="We become another template store" body="Cap templates at 8. Every new one must replace an old one. Taste is a scarce resource." />
          <Risk title="Scope creep into ATS arms race" body="We publish our heuristics. We don't chase vendor-specific tricks." />
        </div>
      </div>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="serif" style={{ fontSize: 28, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
          → See the prototype, next row.
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>END OF STRATEGY · TURN TO SECTION "PROTOTYPE" ↓</div>
      </div>

      <PageFooter n="06" />
    </div>
  );
}

/* ——— shared bits ——— */

function PageHeader({ num, label, title }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--accent-ink)', letterSpacing: '0.08em' }}>◆ {label}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{num} / 06</div>
      </div>
      <h2 className="serif" style={{ fontSize: 56, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.0, maxWidth: 900 }}>
        {title}
      </h2>
    </div>
  );
}

function PageFooter({ n }) {
  return (
    <div className="mono" style={{ marginTop: 24, fontSize: 10, color: 'var(--ink-4)', display: 'flex', justifyContent: 'space-between' }}>
      <span>resume/ — design brief</span>
      <span>p. {n}</span>
    </div>
  );
}

function TableHeader({ children, align }) {
  return <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', padding: '6px 12px 10px', borderBottom: '1px solid var(--ink)', letterSpacing: '0.08em', textAlign: align || 'left' }}>{children}</div>;
}
function TableCell({ children, align }) {
  return <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--line-2)', fontSize: 12, lineHeight: 1.5, textAlign: align || 'left' }}>{children}</div>;
}

function Insight({ kicker, title, children }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--accent-ink)', letterSpacing: '0.08em', marginBottom: 6 }}>{kicker}</div>
      <div className="serif" style={{ fontSize: 20, marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)' }}>{children}</div>
    </div>
  );
}

function SubHead({ children }) {
  return <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', marginBottom: 10 }}>{children}</div>;
}

function Metric({ n, label }) {
  return (
    <div>
      <div className="serif" style={{ fontSize: 36, lineHeight: 1, letterSpacing: '-0.02em' }}>{n}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Risk({ title, body }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--line-2)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

Object.assign(window, {
  StrategyCover, StrategyTeardown, StrategyPrinciples,
  StrategyFeatures, StrategyRoadmap, StrategyMetrics,
});
