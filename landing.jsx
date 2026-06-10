// resume/ — the public landing page concept.

function Landing() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bone)', overflow: 'auto', fontFamily: 'var(--sans)' }} className="rb-scroll">
      {/* nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(246,242,234,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16 }}>
            <Logo size={22} />
            <span>resume<span style={{ color: 'var(--accent)' }}>/</span></span>
          </div>
          <div style={{ display: 'flex', gap: 20, marginLeft: 12 }}>
            {['Templates', 'How it works', 'Self-host', 'JSON Resume', 'GitHub'].map(i => (
              <span key={i} style={{ fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>{i}</span>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>MIT · 0 deps · 100% local</span>
          <button className="rb-btn primary">Start writing →</button>
        </div>
      </div>

      {/* hero */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 40px 56px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--accent-ink)', letterSpacing: 0.8, marginBottom: 20 }}>◆ OPEN SOURCE · FREE FOREVER · NO ACCOUNT</div>
          <h1 className="serif" style={{ fontSize: 92, lineHeight: 0.95, margin: 0, letterSpacing: '-0.025em' }}>
            A resume that<br/>
            <span style={{ fontStyle: 'italic' }}>actually gets you</span><br/>
            the interview.
          </h1>
          <div style={{ fontSize: 18, color: 'var(--ink-2)', marginTop: 28, maxWidth: 520, lineHeight: 1.55 }}>
            Paste a job description. Get a resume tailored to it — with the receipts for every change. Export as PDF. Your data stays on your laptop.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 32, alignItems: 'center' }}>
            <button className="rb-btn accent" style={{ fontSize: 14, padding: '12px 18px' }}>Start writing →</button>
            <button className="rb-btn" style={{ fontSize: 14, padding: '12px 18px' }}>
              <span className="mono" style={{ fontSize: 12 }}>$ npx resume@latest</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 28, fontSize: 12, color: 'var(--ink-3)' }}>
            <span>✓ No email required</span>
            <span>✓ Works offline</span>
            <span>✓ Self-hostable in one Docker</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ transform: 'rotate(-2deg)' }}>
            <ResumePaper scale={0.62} template="editorial" />
          </div>
          <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--ink)', color: 'var(--paper)', padding: '10px 14px', borderRadius: 4, transform: 'rotate(4deg)', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
            <div className="mono" style={{ fontSize: 9, opacity: 0.6, letterSpacing: 0.6 }}>ATS</div>
            <div className="serif" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>94</div>
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: -16, background: 'var(--paper)', border: '1px solid var(--line)', padding: '10px 14px', borderRadius: 4, transform: 'rotate(-3deg)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', maxWidth: 200 }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--accent-ink)', letterSpacing: 0.6 }}>◆ JD MATCH · +14</div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.4 }}>Mentioned <mark style={{ background: 'var(--accent-tint)', padding: '0 2px' }}>API design</mark> explicitly in bullet 2.</div>
          </div>
        </div>
      </div>

      {/* logos strip — open source community */}
      <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '18px 40px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 32 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.8 }}>BACKED BY</div>
          {['JSON Resume', 'Hacktoberfest', 'Open Collective', 'GitHub Sponsors', 'OSS Pledge'].map(n => (
            <div key={n} style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)' }}>{n}</div>
          ))}
          <div style={{ flex: 1 }} />
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>★ 14.2k on GitHub</div>
        </div>
      </div>

      {/* three pillars */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
          {[
            { kicker: '01 · EDITOR', title: 'Start with a blank page.', body: "Six hand-designed templates. All ATS-safe. All free. No watermarks, no tier, no up-sell — ever." },
            { kicker: '02 · TAILOR', title: 'Paste a JD, get a match.', body: "The only resume tool that closes the loop. Real keyword gap. Real ATS heuristics. Every suggestion shows its diff." },
            { kicker: '03 · OPEN', title: 'Your resume, your file.', body: "JSON Resume under the hood. Import anywhere, export anywhere. Self-host with one Docker command. MIT, forever." },
          ].map((p, i) => (
            <div key={i} style={{ borderTop: '2px solid var(--ink)', paddingTop: 16 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-ink)', letterSpacing: 0.8, marginBottom: 10 }}>◆ {p.kicker}</div>
              <div className="serif" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 10 }}>{p.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* vs */}
      <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 40px' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.8, marginBottom: 10 }}>◆ HOW WE COMPARE</div>
          <h2 className="serif" style={{ fontSize: 48, margin: 0, letterSpacing: '-0.02em' }}>Everyone else wants your email. <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>We don't.</span></h2>
          <div style={{ marginTop: 32, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            {[
              ['Free forever', 'yes', 'trial', 'trial', 'trial'],
              ['Open source', 'yes', 'no', 'no', 'partial'],
              ['No account required', 'yes', 'no', 'no', 'no'],
              ['Tailor to JD', 'yes', 'no', 'partial', 'partial'],
              ['ATS scoring', 'yes', 'no', 'partial', 'yes'],
              ['Self-host', 'yes', 'no', 'no', 'no'],
              ['JSON Resume native', 'yes', 'no', 'no', 'no'],
              ['Watermark on export', 'no', 'yes', 'yes', 'yes'],
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: i < 7 ? '1px solid var(--line-2)' : 'none', fontSize: 13, background: i === 0 ? 'var(--bone)' : 'transparent', alignItems: 'center' }}>
                {i === 0 ? null : <div style={{ color: 'var(--ink-2)' }}>{row[0]}</div>}
                {i === 0 && <>
                  <div />
                  <div style={{ fontWeight: 600 }}>resume/</div>
                  <div style={{ color: 'var(--ink-3)' }}>resume.io</div>
                  <div style={{ color: 'var(--ink-3)' }}>Zety</div>
                  <div style={{ color: 'var(--ink-3)' }}>Kickresume</div>
                </>}
                {i > 0 && row.slice(1).map((cell, j) => (
                  <div key={j}>
                    {cell === 'yes' && <span style={{ color: j === 0 ? 'var(--ok)' : 'var(--ink-3)', fontWeight: j === 0 ? 600 : 400 }}>{j === 0 ? '✓ yes' : 'yes'}</span>}
                    {cell === 'no' && <span style={{ color: j === 0 && (row[0] === 'Watermark on export') ? 'var(--ok)' : 'var(--ink-4)', fontWeight: j === 0 && row[0] === 'Watermark on export' ? 600 : 400 }}>{(j === 0 && row[0] === 'Watermark on export') ? '✓ none' : 'no'}</span>}
                    {cell === 'trial' && <span style={{ color: 'var(--ink-4)' }}>trial</span>}
                    {cell === 'partial' && <span style={{ color: 'var(--ink-4)' }}>partial</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* cli block */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--accent-ink)', letterSpacing: 0.8, marginBottom: 10 }}>◆ FOR DEVELOPERS</div>
          <h2 className="serif" style={{ fontSize: 48, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>Git your resume.</h2>
          <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 16, lineHeight: 1.55, maxWidth: 460 }}>
            Your resume is a JSON file. Version it. Diff it. Render it from a GitHub Action. We ship a CLI, a Docker image, and a plugin API.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="rb-btn">Self-host guide</button>
            <button className="rb-btn">Plugin docs</button>
          </div>
        </div>

        <div style={{ background: '#1a1714', borderRadius: 6, overflow: 'hidden', fontFamily: 'var(--mono)', fontSize: 12 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2622', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: '#c96442' }} />
            <span style={{ width: 9, height: 9, borderRadius: 5, background: '#c9a342' }} />
            <span style={{ width: 9, height: 9, borderRadius: 5, background: '#5ba84a' }} />
            <span style={{ marginLeft: 10, color: '#827970', fontSize: 11 }}>~/projects/my-resume</span>
          </div>
          <div style={{ padding: '18px 20px', color: '#e8dfd1', lineHeight: 1.7 }}>
            <div><span style={{ color: '#7b7066' }}>$</span> <span style={{ color: '#e8dfd1' }}>npx resume@latest init</span></div>
            <div style={{ color: '#7b7066' }}>→ Created resume.json (JSON Resume schema)</div>
            <div style={{ color: '#7b7066' }}>→ Edit at http://localhost:3210</div>
            <div style={{ marginTop: 12 }}><span style={{ color: '#7b7066' }}>$</span> <span style={{ color: '#e8dfd1' }}>resume tailor --jd vercel-sr-pd.md</span></div>
            <div style={{ color: '#c9a342' }}>✓ Tailored draft saved as resume.vercel.json</div>
            <div style={{ color: '#7b7066' }}>  Match score: 68 → <span style={{ color: '#8bc56b' }}>82</span> (+14)</div>
            <div style={{ marginTop: 12 }}><span style={{ color: '#7b7066' }}>$</span> <span style={{ color: '#e8dfd1' }}>resume export --template folio --pdf</span></div>
            <div style={{ color: '#7b7066' }}>→ resume.vercel.pdf</div>
            <div style={{ marginTop: 12 }}><span style={{ color: '#7b7066' }}>$</span> <span style={{ color: '#e8dfd1' }}>git commit -am "tailored for vercel"</span><span className="rb-caret" /></div>
          </div>
        </div>
      </div>

      {/* final cta */}
      <div style={{ borderTop: '1px solid var(--line)', background: 'var(--ink)', color: 'var(--paper)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 11, color: 'oklch(0.75 0.12 35)', letterSpacing: 0.8, marginBottom: 14 }}>◆ IT'S JUST A RESUME BUILDER</div>
          <h2 className="serif" style={{ fontSize: 84, margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>
            It shouldn't cost<br/><span style={{ fontStyle: 'italic', color: 'oklch(0.85 0.1 35)' }}>twenty dollars a month.</span>
          </h2>
          <div style={{ fontSize: 16, color: 'oklch(0.75 0.02 35)', marginTop: 24, maxWidth: 520, margin: '24px auto 0', lineHeight: 1.55 }}>
            So we made one that doesn't. Take it, fork it, self-host it, forget about us. Get the job.
          </div>
          <button className="rb-btn" style={{ marginTop: 32, background: 'var(--paper)', color: 'var(--ink)', fontSize: 15, padding: '14px 22px' }}>Start writing →</button>
        </div>
        <div style={{ borderTop: '1px solid #2a2622', padding: '20px 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 20, fontSize: 11, color: 'oklch(0.6 0.02 35)' }} className="mono">
            <span>resume/ v0.1 · MIT</span>
            <span>github.com/resume-slash/resume</span>
            <span>jsonresume.org/schema</span>
            <div style={{ flex: 1 }} />
            <span>Made by people who've all had to write one of these.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Landing });
