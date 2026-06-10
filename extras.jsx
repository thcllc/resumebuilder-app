// resume/ — extra prototype views beyond editor/tailor/templates/versions:
// CoverLetter, Outreach, InterviewPrep, SelfHost, AIDiff.

/* ───────── COVER LETTER ───────── */

function CoverLetterView() {
  const [tone, setTone] = React.useState('warm');
  const tones = [
    { id: 'warm', label: 'Warm' },
    { id: 'direct', label: 'Direct' },
    { id: 'formal', label: 'Formal' },
    { id: 'punchy', label: 'Punchy' },
  ];
  const letter = LETTERS[tone];

  return (
    <div style={{ width: '100%', display: 'flex' }}>
      <div style={{ width: 320, background: 'var(--paper)', borderRight: '1px solid var(--line)', padding: 18, overflowY: 'auto' }} className="rb-scroll">
        <div className="rb-label">Source</div>
        <div style={{ background: 'var(--bone-2)', borderRadius: 5, padding: '10px 12px', fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>Maya Chen → Vercel</div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11, marginTop: 2 }}>Senior Product Designer · pulled from JD + tailored resume</div>
        </div>

        <div className="rb-label" style={{ marginTop: 18 }}>Tone</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {tones.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)}
              style={{ border: '1px solid var(--line)', background: tone === t.id ? 'var(--ink)' : 'var(--paper)', color: tone === t.id ? 'var(--paper)' : 'var(--ink-2)', padding: '7px 8px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 4 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="rb-label" style={{ marginTop: 18 }}>Length</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Short', 'Standard', 'Long'].map((l, i) => (
            <button key={l} className="rb-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px 4px', background: i === 1 ? 'var(--bone-2)' : 'var(--paper)' }}>{l}</button>
          ))}
        </div>

        <div className="rb-label" style={{ marginTop: 18 }}>Hook</div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--paper)' }}>
          Lead with the Plugin API → Vercel platform parallel. JD opens with "platform team."
        </div>

        <div className="rb-label" style={{ marginTop: 18 }}>What to mention</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Pill checked label="Plugin API v3 (14k devs)" />
          <Pill checked label="Linear design system" />
          <Pill checked label="API design + DX" />
          <Pill label="IDEO healthcare work" />
          <Pill label="RISD background" />
        </div>

        <button className="rb-btn accent" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
          <SparkIcon /> Regenerate
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '32px', display: 'flex', justifyContent: 'center', background: 'var(--bone)' }} className="rb-scroll">
        <div style={{ width: 612, minHeight: 792, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.04), 0 16px 40px rgba(0,0,0,.08)', padding: '60px 64px', fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.7, color: '#222' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: '#666', marginBottom: 36 }}>April 25, 2026</div>
          <div style={{ marginBottom: 18, fontFamily: 'var(--sans)', fontSize: 11, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600 }}>Vercel · Hiring Team</div>
            <div style={{ color: '#666' }}>vercel.com/careers</div>
          </div>
          <div style={{ marginBottom: 14 }}>Hi Vercel team,</div>
          {letter.map((p, i) => (
            <p key={i} style={{ margin: '0 0 14px' }}>{p}</p>
          ))}
          <div style={{ marginTop: 24 }}>
            <div>Warmly,</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, marginTop: 8 }}>Maya Chen</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: '#666' }}>maya.chen@hey.com · mayachen.design</div>
          </div>
        </div>
      </div>

      <div style={{ width: 280, background: 'var(--paper)', borderLeft: '1px solid var(--line)', padding: 18, overflowY: 'auto' }} className="rb-scroll">
        <div className="rb-label">Signal</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SignalRow label="Personal, not template-y" score={92} />
          <SignalRow label="Mentions JD specifics" score={88} />
          <SignalRow label="Avoids resume restating" score={76} />
          <SignalRow label="Reading age (Flesch)" score={64} note="Grade 9 — good" />
          <SignalRow label="Clichés detected" score={94} note="0 found" />
        </div>

        <div className="rb-label" style={{ marginTop: 22 }}>Watch-outs</div>
        <div style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--ink-2)' }}>
          <div style={{ padding: '8px 10px', background: 'oklch(0.96 0.04 75)', borderRadius: 4, marginBottom: 6 }}>
            "I'm excited to" appears 1× — borderline. <span className="mono" style={{ fontSize: 10, color: 'var(--accent-ink)' }}>fix</span>
          </div>
          <div style={{ padding: '8px 10px', background: 'oklch(0.96 0.04 75)', borderRadius: 4 }}>
            Para 2 is 4 sentences. Aim for 3.
          </div>
        </div>
      </div>
    </div>
  );
}

const LETTERS = {
  warm: [
    "I've been a Vercel customer since the first preview-deploy URL changed how I show work to my team. So when I saw your platform team is hiring a senior designer, I had to write — your platform is one of the few I've used where the design choices feel like they were made by people who actually shipped against them.",
    "For the last four years at Figma, I led design for the Plugin API — the same kind of developer-facing platform surface you're hiring for. I shipped Plugin API v3 end-to-end, from research to launch. 14,000 developers adopted it in year one; it now powers tooling embedded in 9M files. The work was equal parts API design, dashboards, and the design system that ties them together.",
    "Before Figma I was the first design hire at Linear, where I built the foundational system still in use today. I prototype heavily, read the codebase, and ship in production rather than handing off mocks. That's how I'd want to work on Vercel's platform too.",
    "I'd love to talk. I've attached a tailored resume and a few project links — happy to walk through any of them.",
  ],
  direct: [
    "Your platform team posting reads like a list of things I've already shipped. I'd like to do them at Vercel.",
    "At Figma I led Plugin API v3 — adopted by 14k developers, surfaced in 9M files. Before that I was first design hire at Linear and built the design system. Both jobs were API design, dashboards, and developer experience.",
    "I prototype in code, ship in production, and read the docs.",
    "Resume attached. Available to talk this week.",
  ],
  formal: [
    "I am writing to express my interest in the Senior Product Designer role on Vercel's platform team, as listed on your careers site.",
    "Over the past seven years, I have specialized in developer-facing tooling. Most recently, at Figma, I led the design of Plugin API v3 — a platform now adopted by over 14,000 developers and surfaced across nine million files. Prior to Figma, I established the foundational design system at Linear.",
    "My experience aligns directly with the responsibilities outlined in the role: end-to-end design for platform surfaces, partnership with engineering on API design, and the evolution of design systems at scale.",
    "I would welcome the opportunity to discuss how I might contribute. A tailored résumé is attached.",
  ],
  punchy: [
    "Three lines, then I'm done:",
    "(1) Plugin API v3 at Figma. 14k devs. 9M files. I led design end-to-end.",
    "(2) First designer at Linear. Built the design system. Cycles. Command menu.",
    "(3) I want to do that for Vercel. Resume attached. Let's talk.",
  ],
};

function Pill({ label, checked }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 12, background: checked ? 'var(--accent-tint)' : 'var(--paper)' }}>
      <span style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid var(--ink-3)', background: checked ? 'var(--accent)' : 'transparent', borderColor: checked ? 'var(--accent)' : 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9 }}>{checked ? '✓' : ''}</span>
      <span style={{ color: 'var(--ink-2)' }}>{label}</span>
    </div>
  );
}

function SignalRow({ label, score, note }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--ink-2)' }}>{label}</span>
        <span className="mono" style={{ color: 'var(--ink-3)' }}>{score}</span>
      </div>
      <div style={{ height: 3, background: 'var(--bone-2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? 'var(--ok)' : score >= 60 ? 'var(--warn)' : 'var(--accent)' }} />
      </div>
      {note && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 3 }}>{note}</div>}
    </div>
  );
}

function SparkIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 1v3M6 8v3M1 6h3M8 6h3M2.5 2.5L4 4M10 10L8.5 8.5M2.5 9.5L4 8M10 2L8.5 3.5"/></svg>;
}

/* ───────── OUTREACH ───────── */

function OutreachView() {
  const channels = [
    { id: 'linkedin', label: 'LinkedIn DM', count: 280 },
    { id: 'email', label: 'Cold email', count: 600 },
    { id: 'referral', label: 'Referral ask', count: 400 },
    { id: 'recruiter', label: 'Recruiter reply', count: 200 },
  ];
  const [chan, setChan] = React.useState('linkedin');
  const drafts = OUTREACH_DRAFTS[chan];

  return (
    <div style={{ width: '100%', display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 280, background: 'var(--paper)', borderRight: '1px solid var(--line)', padding: '14px 0', overflowY: 'auto' }} className="rb-scroll">
        <div style={{ padding: '0 18px', marginBottom: 14 }}>
          <div className="rb-label">Channel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {channels.map(c => (
              <button key={c.id} onClick={() => setChan(c.id)}
                style={{ border: 'none', background: chan === c.id ? 'var(--bone-2)' : 'transparent', textAlign: 'left', padding: '8px 12px', fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)', cursor: 'pointer', borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: chan === c.id ? 600 : 400 }}>{c.label}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c.count}c</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 18px', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <div className="rb-label">Recipient</div>
          <div style={{ background: 'var(--bone-2)', borderRadius: 5, padding: '10px 12px', fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>Lee Robinson</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>VP of Developer Experience · Vercel</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>auto-found via JD</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            <div>· Was at Hashnode → Vercel</div>
            <div>· Posts about DX, Next.js</div>
            <div>· Open to brief intros (per profile)</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--bone)' }} className="rb-scroll">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.015em' }}>Three drafts to pick from.</h1>
          <button className="rb-btn">
            <SparkIcon /> Regenerate
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {drafts.map((d, i) => (
            <div key={i} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 9, padding: '2px 6px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 2, letterSpacing: 0.6 }}>{d.tag}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{d.chars}c · {d.read}s read</span>
              </div>
              {d.subject && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Subject: {d.subject}</div>}
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink)', whiteSpace: 'pre-wrap', flex: 1 }}>{d.body}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <button className="rb-btn" style={{ flex: 1, fontSize: 11, justifyContent: 'center' }}>Copy</button>
                <button className="rb-btn ghost" style={{ fontSize: 11 }}>↻</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6 }}>
          <div className="rb-label">Why these work</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <li>Open with a specific shipped artifact, not "I'm reaching out because…"</li>
            <li>One ask. Reply-able in under 30 seconds.</li>
            <li>No "great company" filler. No bullet lists. Sentences end early.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const OUTREACH_DRAFTS = {
  linkedin: [
    { tag: 'WARM', chars: 246, read: 12, body: "Hi Lee — your post about platform DX last week made me re-read your Plugin SDK rewrite notes (good). I'm a designer; led Plugin API v3 at Figma. Saw the platform-PD role — would you be open to a 15-min chat about what design looks like under you?" },
    { tag: 'DIRECT', chars: 198, read: 9, body: "Hi Lee — Maya Chen, designer. Led Plugin API v3 at Figma (14k devs, 9M files). Vercel's platform-PD role looks like the same shape of problem. Open to a quick call this week or next?" },
    { tag: 'PORTFOLIO', chars: 264, read: 13, body: "Hi Lee — long-time Vercel user. I just shipped Plugin API v3 at Figma and wrote up the design process here: mayachen.design/plugin-api. The platform-PD role caught my eye — happy to send a tailored resume if it's still open. Either way, that DX writeup of yours was great." },
  ],
  email: [
    { tag: 'WARM', subject: 'Plugin API v3 → platform-PD?', chars: 380, read: 18, body: "Hi Lee,\n\nI'm Maya — designer who led Plugin API v3 at Figma (14k devs in year one). Saw your platform team is hiring a senior PD and the JD reads like a list of things I just shipped: API design, DX, dashboards, platform surfaces.\n\nResume + a one-page case study attached. Happy to talk if there's interest.\n\n— Maya" },
    { tag: 'DIRECT', subject: 'Senior PD, platform — application', chars: 220, read: 11, body: "Hi Lee,\n\nApplying to the platform-PD role. Most relevant work: led Plugin API v3 at Figma; built Linear's first design system. Resume attached. Available to chat this week.\n\n— Maya Chen" },
    { tag: 'STORY', subject: 'A weird Plugin API question', chars: 410, read: 20, body: "Hi Lee,\n\nQuick question that I think might be a job application in disguise: when you redesigned Vercel's deploy pipeline, did you sit with the failure-state copy first, or last? I've been thinking about this since Plugin API v3 — I led design at Figma — and I'm guessing your answer is \"first.\"\n\nIf I'm right, your senior PD role might be a fit. Resume attached.\n\n— Maya" },
  ],
  referral: [
    { tag: 'WARM', chars: 290, read: 14, body: "Hey Sam — hope you're well! I saw Vercel posted a senior PD role on the platform team and it looks like a strong fit (Plugin API v3 type of work). Would you be up for forwarding my name to Lee or whoever runs that team? Resume attached, no pressure if it's awkward." },
    { tag: 'DIRECT', chars: 188, read: 9, body: "Sam — Vercel platform PD role open. Do you know who's hiring? I'd love a referral if it's easy. Resume attached." },
    { tag: 'CONTEXT', chars: 332, read: 16, body: "Sam — long time. Throwing my hat in for the Vercel platform PD role; Plugin API v3 type of work. I know you're tight with the design team there from when you worked together at Stripe — would a referral feel okay to you? Totally fine if not, just figured I'd ask the obvious person first." },
  ],
  recruiter: [
    { tag: 'INTERESTED', chars: 220, read: 11, body: "Hi Priya — thanks for reaching out. Yes, I'd love to talk about the platform-PD role. Available Tue or Wed afternoon ET. Tailored resume attached so we don't have to spend the call covering ground that's already on paper." },
    { tag: 'CURIOUS', chars: 264, read: 13, body: "Hi Priya — open to learning more. A few quick questions before we book time: (1) is this the team Lee Robinson runs? (2) is it remote-OK? (3) what's the comp band? Happy to share my resume + walk through Plugin API v3 once those are answered." },
    { tag: 'POLITE NO', chars: 198, read: 9, body: "Hi Priya — appreciate the note. I'm not actively looking right now, but Vercel's a place I respect. Mind keeping me in your file for next year? I'll keep an eye on the platform team in the meantime." },
  ],
};

/* ───────── INTERVIEW PREP ───────── */

function InterviewPrepView() {
  const cats = [
    { id: 'tech', label: 'Technical', n: 6 },
    { id: 'craft', label: 'Craft', n: 5 },
    { id: 'behave', label: 'Behavioral', n: 4 },
    { id: 'asks', label: 'Your asks', n: 6 },
  ];
  const [cat, setCat] = React.useState('tech');
  const qs = INTERVIEW_QS[cat];

  return (
    <div style={{ width: '100%', display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 220, background: 'var(--paper)', borderRight: '1px solid var(--line)', padding: '14px 12px' }}>
        <div className="rb-label">Interview prep</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14, padding: '0 4px', lineHeight: 1.5 }}>
          Generated from the JD + your resume. Likely to come up.
        </div>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: 'none', background: cat === c.id ? 'var(--bone-2)' : 'transparent', textAlign: 'left', padding: '8px 10px', fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)', cursor: 'pointer', borderRadius: 5, marginBottom: 2, fontWeight: cat === c.id ? 600 : 400 }}>
            <span>{c.label}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c.n}</span>
          </button>
        ))}

        <div className="rb-label" style={{ marginTop: 24 }}>Drill mode</div>
        <button className="rb-btn primary" style={{ width: '100%', justifyContent: 'center' }}>Start mock interview →</button>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5, padding: '0 4px' }}>
          AI plays interviewer. Voice or text. 30 min.
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', background: 'var(--bone)' }} className="rb-scroll">
        <div style={{ maxWidth: 760 }}>
          {qs.map((q, i) => <QCard key={i} q={q} idx={i + 1} />)}
        </div>
      </div>
    </div>
  );
}

function QCard({ q, idx }) {
  const [open, setOpen] = React.useState(idx === 1);
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 24 }}>Q{idx}</span>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{q.q}</div>
        <span className="rb-tag" style={{ background: q.likelihood === 'High' ? 'oklch(0.95 0.05 35)' : 'var(--bone-2)', color: q.likelihood === 'High' ? 'var(--accent-ink)' : 'var(--ink-3)' }}>{q.likelihood}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--ink-3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M3 2l4 3-4 3"/></svg>
      </div>
      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--line-2)' }} className="rb-fade-in">
          <div className="rb-label" style={{ marginTop: 12 }}>Why they'll ask</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>{q.why}</div>
          <div className="rb-label" style={{ marginTop: 12 }}>Hook to your resume</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55, fontFamily: 'var(--serif)', fontStyle: 'italic', borderLeft: '2px solid var(--accent)', paddingLeft: 12 }}>"{q.hook}"</div>
          <div className="rb-label" style={{ marginTop: 12 }}>Sketch (STAR)</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            <div><strong>S</strong> — {q.star.s}</div>
            <div><strong>T</strong> — {q.star.t}</div>
            <div><strong>A</strong> — {q.star.a}</div>
            <div><strong>R</strong> — {q.star.r}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const INTERVIEW_QS = {
  tech: [
    { q: "How do you design an API that designers will actually use?", likelihood: 'High',
      why: "JD lists API design + DX. They want concrete examples, not theory.",
      hook: "Plugin API v3 was the bet that designers would write code if you made the failure modes humane.",
      star: { s: "Plugin API v1 had 4% retention.", t: "Rewrite for designers, not just devs.", a: "Co-designed errors with the docs team; shipped a UI playground; renamed 60% of methods.", r: "14k devs in year 1; 78% activation." } },
    { q: "Walk me through a system you owned end-to-end.", likelihood: 'High', why: "Standard senior screen.", hook: "Linear's design system, from scratch.", star: { s: "Linear had no system.", t: "Build one without slowing the team.", a: "Tokens + 12 primitives shipped before any component.", r: "Every team adopted in 6 weeks; system still in use." } },
    { q: "How do you balance prototyping in code vs in Figma?", likelihood: 'Medium', why: "JD asks about prototyping skills.", hook: "Code for state, Figma for surface.", star: { s: "Plugin SDK had 8 entry points.", t: "Pick one to invest in.", a: "Built a real prototype in React; Figma for surface variants.", r: "Killed 2 entry points before launch." } },
    { q: "Tell me about an API you regret.", likelihood: 'Medium', why: "Mistakes question.", hook: "Plugin API v2's auth flow.", star: { s: "Auth was 4 redirects.", t: "Ship for v3 freeze.", a: "Cut to 2; couldn't get to 1.", r: "Still 1 redirect too many. Fixed in v3.1." } },
    { q: "How do you measure design quality on a platform?", likelihood: 'Medium', why: "DX role; they care about leading metrics.", hook: "Time-to-first-success > everything.", star: { s: "Plugin team was tracking installs.", t: "Find a leading metric.", a: "Switched to time-to-publish: median 47min → 11min.", r: "Adoption followed the metric." } },
    { q: "What would you change about Vercel's dashboards in 30 days?", likelihood: 'High', why: "Tests JD-specific homework.", hook: "I have notes.", star: { s: "I use the dashboard daily.", t: "Pick 3 frictions.", a: "Deploy comparison, env-var secrets, log filtering.", r: "Could ship the first in a week." } },
  ],
  craft: [
    { q: "Walk me through your portfolio.", likelihood: 'High', why: "First 10 minutes of any senior interview.", hook: "Three projects. One platform, one system, one healthcare.", star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "Show a piece of work you're not proud of.", likelihood: 'High', why: "Self-awareness check.", hook: "Plugin API v2 store. Beautiful, didn't convert.", star: { s: "Built for browsing.", t: "Should have built for installing.", a: "Redid as install-first in v3.", r: "+38% IT rate." } },
    { q: "How do you crit?", likelihood: 'Medium', why: "Senior collaboration.", hook: "I ask what the work is trying to do before I look at it.", star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "Describe your prototyping process.", likelihood: 'High', why: "JD calls out prototyping explicitly.", hook: "Code first when state matters.", star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "Tell us about a system you scrapped.", likelihood: 'Low', why: "Resilience.", hook: "Linear's first icon set.", star: { s: "—", t: "—", a: "—", r: "—" } },
  ],
  behave: [
    { q: "Tell me about a conflict with an engineer.", likelihood: 'High', why: "Senior collaboration.", hook: "Plugin API method names.", star: { s: "Eng wanted technical names; I wanted writer-friendly.", t: "Decide before freeze.", a: "Built both APIs; user-tested.", r: "Writer-friendly won; eng was right about 2 of 60." } },
    { q: "When did you change your mind about a strong-held opinion?", likelihood: 'Medium', why: "Growth signal.", hook: "I used to think systems should be exhaustive.", star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "How do you handle ambiguous direction from leadership?", likelihood: 'High', why: "Senior IC autonomy.", hook: "I write the doc no one asked for.", star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "Tell me about giving hard feedback.", likelihood: 'Medium', why: "Mentoring fit.", hook: "First report's portfolio review.", star: { s: "—", t: "—", a: "—", r: "—" } },
  ],
  asks: [
    { q: "What does success look like for this role in 6 months?", likelihood: 'High', why: "You should ask. Tells you if the team has thought about it.", hook: '', star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "Who has the same kind of role on adjacent teams, and how do they collaborate?", likelihood: 'High', why: "Reveals the org chart and the loneliness factor.", hook: '', star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "What's the team's relationship with engineering leadership?", likelihood: 'High', why: "Politics check.", hook: '', star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "What's the worst part of the job?", likelihood: 'Medium', why: "If they can't answer, they're not honest with themselves.", hook: '', star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "How does design get its work into the roadmap?", likelihood: 'High', why: "Tests whether design is upstream or downstream.", hook: '', star: { s: "—", t: "—", a: "—", r: "—" } },
    { q: "When was the last time leadership killed a feature for design reasons?", likelihood: 'Medium', why: "If never — design isn't real here.", hook: '', star: { s: "—", t: "—", a: "—", r: "—" } },
  ],
};

/* ───────── SELF-HOST / DEV ───────── */

function SelfHostView() {
  return (
    <div style={{ width: '100%', overflow: 'auto', padding: '32px 48px', background: 'var(--bone)' }} className="rb-scroll">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--accent-ink)', letterSpacing: 0.8, marginBottom: 8 }}>◆ FOR DEVELOPERS</div>
        <h1 className="serif" style={{ fontSize: 56, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>Your resume is a JSON file.</h1>
        <div style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 14, maxWidth: 720, lineHeight: 1.5 }}>
          Everything in resume/ is a thin layer on top of <span className="mono" style={{ fontSize: 14 }}>resume.json</span>. Self-host in one Docker. Render from a GitHub Action. Write a custom template in 50 lines.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, marginTop: 32 }}>
          {/* JSON Resume schema */}
          <div style={{ background: '#1a1714', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2622', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: '#c96442' }} />
              <span style={{ width: 9, height: 9, borderRadius: 5, background: '#c9a342' }} />
              <span style={{ width: 9, height: 9, borderRadius: 5, background: '#5ba84a' }} />
              <span style={{ marginLeft: 10, color: '#827970', fontSize: 11 }}>resume.json</span>
              <span style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 10, color: '#827970' }}>JSON Resume v1.0.0</span>
            </div>
            <pre style={{ margin: 0, padding: '16px 18px', color: '#e8dfd1', lineHeight: 1.6, fontSize: 11.5, overflow: 'auto' }}>
{`{
  "$schema": "https://jsonresume.org/schema",
  "basics": {
    "name":     "Maya Chen",
    "label":    "Senior Product Designer",
    "email":    "maya.chen@hey.com",
    "location": { "city": "Brooklyn", "region": "NY" },
    "profiles": [
      { "network": "GitHub", "url": "github.com/mayac" }
    ]
  },
  "work": [
    {
      "name":      "Figma",
      "position":  "Senior Product Designer, Platform",
      "startDate": "2022-03",
      "highlights": [
        "Led end-to-end design for the `}<span style={{ color: '#c9a342' }}>Plugin API v3</span>{`...",
        "Redesigned the plugin store; +38% IT rate.",
        "Built the platform design system (120 components)."
      ]
    }
  ],
  "skills":    [ … ],
  "education": [ … ]
}`}</pre>
          </div>

          {/* the right column — 3 stacked cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DevCard kicker="ONE-COMMAND SELF-HOST" title="Docker.">
              <pre className="mono" style={{ margin: 0, fontSize: 11, color: '#e8dfd1', background: '#1a1714', padding: 12, borderRadius: 4 }}>
{`$ docker run -p 3210:3210 \\
    -v $(pwd)/resumes:/data \\
    resumeoss/resume:latest`}</pre>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>Air-gapped. SQLite-backed. ARM + x86. Pin a version, never get rugged.</div>
            </DevCard>

            <DevCard kicker="GITHUB ACTION" title="Render from CI.">
              <pre className="mono" style={{ margin: 0, fontSize: 10.5, color: '#e8dfd1', background: '#1a1714', padding: 12, borderRadius: 4, lineHeight: 1.5 }}>
{`- uses: resumeoss/render@v1
  with:
    template: folio
    output:   pdf
    artifact: resume.pdf`}</pre>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>Push to main, get a fresh PDF. Diff your resume in PRs.</div>
            </DevCard>

            <DevCard kicker="PLUGIN API" title="Custom templates.">
              <pre className="mono" style={{ margin: 0, fontSize: 10.5, color: '#e8dfd1', background: '#1a1714', padding: 12, borderRadius: 4, lineHeight: 1.5 }}>
{`export default {
  name: 'my-template',
  render: ({ data, h }) => h.paper(
    h.h1(data.basics.name),
    data.work.map(h.workEntry),
  )
};`}</pre>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>50 lines + a JSON Schema fragment. Publish to npm. Browse in-app.</div>
            </DevCard>
          </div>
        </div>

        {/* commitments */}
        <div style={{ marginTop: 36, padding: '28px 32px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div className="rb-label">OPEN-SOURCE COMMITMENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 14 }}>
            <Commit n="MIT" label="License, in perpetuity" />
            <Commit n="0" label="External dependencies in core" />
            <Commit n="100%" label="Local-first; air-gappable build" />
            <Commit n="∞" label="Free tier — there is no other tier" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DevCard({ kicker, title, children }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6, padding: '14px 16px' }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--accent-ink)', letterSpacing: 0.8, marginBottom: 4 }}>◆ {kicker}</div>
      <div className="serif" style={{ fontSize: 22, marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</div>
      {children}
    </div>
  );
}

function Commit({ n, label }) {
  return (
    <div>
      <div className="serif" style={{ fontSize: 36, lineHeight: 1, letterSpacing: '-0.02em' }}>{n}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

/* ───────── AI DIFF (deeper tailoring view) ───────── */

function AIDiffView() {
  const diffs = [
    {
      sec: 'SUMMARY',
      reason: 'JD opens with "platform team." Lead with that.',
      before: "Product designer with 7 years shipping tools for developers and designers. Led design for Figma's plugin ecosystem; before that, built the first design system at Linear.",
      after: "Platform product designer with 7 years shipping tools for developers. Led design for Figma's Plugin API (API design + developer experience) and built Linear's first design system. Prototype-heavy; comfortable in code.",
    },
    {
      sec: 'EXPERIENCE · FIGMA · BULLET 1',
      reason: 'JD lists "API design" 3×. Make the language match.',
      before: "Led end-to-end design for the Plugin API v3, adopted by 14,000+ developers and surfaced across 9M files in the first year.",
      after: "Led end-to-end design for the Plugin API v3 — an exercise in API design and developer experience — adopted by 14,000+ developers and surfaced across 9M files in year one.",
    },
    {
      sec: 'EXPERIENCE · FIGMA · BULLET 2',
      reason: 'JD asks for "platform surfaces." You have the work; rename it.',
      before: "Ran a cross-functional redesign of the plugin store, lifting install-through rate 38% and author retention 22%.",
      after: "Redesigned the plugin platform surfaces (dashboards, settings, install flows), lifting install-through rate 38% and author retention 22%.",
    },
    {
      sec: 'SKILLS',
      reason: 'Swift isn\'t in the JD. TypeScript is implied by Vercel.',
      before: "Product design · Design systems · Prototyping · Figma · Swift / SwiftUI · User research · Front-end (React)",
      after: "Product design · Design systems · Prototyping · Figma · TypeScript · React · API design · User research",
      removed: ['Swift / SwiftUI'], added: ['TypeScript', 'API design'],
    },
  ];

  return (
    <div style={{ width: '100%', overflow: 'auto', padding: '24px 32px', background: 'var(--bone)' }} className="rb-scroll">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.015em' }}>Every change shows its receipt.</h1>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>4 edits · +14 match score · click to accept individually, or take all.</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="rb-btn ghost">Reject all</button>
          <button className="rb-btn accent">Accept all (+14)</button>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {diffs.map((d, i) => (
          <div key={i} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bone-2)', borderBottom: '1px solid var(--line)' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.6 }}>{d.sec}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)' }}>{d.reason}</span>
              <button className="rb-btn ghost" style={{ fontSize: 11 }}>Reject</button>
              <button className="rb-btn primary" style={{ fontSize: 11, padding: '5px 10px' }}>Accept</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '14px 16px', borderRight: '1px solid var(--line-2)', background: 'oklch(0.96 0.04 35 / 0.4)' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--accent-ink)', letterSpacing: 0.6, marginBottom: 4 }}>− BEFORE</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{d.before}</div>
                {d.removed && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--accent)' }}>− {d.removed.join(', ')}</div>}
              </div>
              <div style={{ padding: '14px 16px', background: 'oklch(0.96 0.04 150 / 0.5)' }}>
                <div className="mono" style={{ fontSize: 9, color: 'oklch(0.4 0.12 150)', letterSpacing: 0.6, marginBottom: 4 }}>+ AFTER</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{d.after}</div>
                {d.added && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ok)' }}>+ {d.added.join(', ')}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { CoverLetterView, OutreachView, InterviewPrepView, SelfHostView, AIDiffView });
