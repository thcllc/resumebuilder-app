// resume/ — sample data + the paper preview component

const SAMPLE = {
  name: "Maya Chen",
  title: "Senior Product Designer",
  email: "maya.chen@hey.com",
  phone: "(415) 555-0142",
  location: "Brooklyn, NY",
  links: [
    { label: "mayachen.design", href: "#" },
    { label: "github.com/mayac", href: "#" },
  ],
  summary: "Product designer with 7 years shipping tools for developers and designers. Led design for Figma's plugin ecosystem; before that, built the first design system at Linear.",
  experience: [
    {
      company: "Figma",
      role: "Senior Product Designer, Platform",
      location: "Remote",
      start: "2022",
      end: "Present",
      bullets: [
        "Led end-to-end design for the Plugin API v3, adopted by 14,000+ developers and surfaced across 9M files in the first year.",
        "Ran a cross-functional redesign of the plugin store, lifting install-through rate 38% and author retention 22%.",
        "Built the internal design system for platform surfaces — 120+ components used by 6 product teams.",
      ],
    },
    {
      company: "Linear",
      role: "Product Designer",
      location: "San Francisco, CA",
      start: "2019",
      end: "2022",
      bullets: [
        "Designed the first version of Cycles, now used by 70% of Linear teams to plan their work.",
        "Established the foundational design system (typography, spacing, color) still in use today.",
        "Shipped the command menu — cited by customers as their single favorite feature.",
      ],
    },
    {
      company: "IDEO",
      role: "Interaction Designer",
      location: "New York, NY",
      start: "2017",
      end: "2019",
      bullets: [
        "Led design for a patient-intake redesign at a major hospital system, cutting avg check-in time from 12 to 4 minutes.",
      ],
    },
  ],
  education: [
    { school: "Rhode Island School of Design", degree: "BFA, Graphic Design", year: "2017" },
  ],
  skills: ["Product design", "Design systems", "Prototyping", "Figma", "Swift / SwiftUI", "User research", "Front-end (React)"],
};

// The live resume preview — the "paper" on the right side of the editor.
// Can be rendered at any scale (pass `scale`) so it works both as full-size
// and as a thumbnail inside the template gallery.
function ResumePaper({ data = SAMPLE, scale = 1, highlight = [], template = "classic" }) {
  const hl = (text) => {
    if (!highlight.length) return text;
    const re = new RegExp(`(${highlight.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(re);
    return parts.map((p, i) =>
      highlight.some(h => h.toLowerCase() === p.toLowerCase())
        ? <mark key={i} style={{ background: 'oklch(0.92 0.09 75)', color: '#3a2a00', padding: '0 1px', borderRadius: 1 }}>{p}</mark>
        : <React.Fragment key={i}>{p}</React.Fragment>
    );
  };

  let body;
  if (template === "technical") body = <TechnicalTemplate data={data} hl={hl} />;
  else if (template === "editorial") body = <EditorialTemplate data={data} hl={hl} />;
  else if (template === "minimal") body = <MinimalTemplate data={data} hl={hl} />;
  else if (template === "twocol") body = <TwoColumnTemplate data={data} hl={hl} />;
  else if (template === "academic") body = <AcademicTemplate data={data} hl={hl} />;
  else if (template === "creative") body = <CreativeTemplate data={data} hl={hl} />;
  else if (template === "readme") body = <ReadmeTemplate data={data} hl={hl} />;
  else body = <ClassicTemplate data={data} hl={hl} />;

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 612, height: 792 }}>
      <div className="resume-paper" style={{ width: 612, height: 792, overflow: 'hidden' }}>
        {body}
      </div>
    </div>
  );
}

function ClassicTemplate({ data, hl }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1>{data.name}</h1>
        <div className="contact">
          {data.email} · {data.phone} · {data.location} · {data.links.map(l => l.label).join(' · ')}
        </div>
      </div>
      <h2>Summary</h2>
      <div style={{ fontSize: 11 }}>{hl(data.summary)}</div>

      <h2>Experience</h2>
      {data.experience.map((e, i) => (
        <div className="exp-block" key={i}>
          <div className="row"><h3>{e.role}, {e.company}</h3><span className="muted">{e.start} – {e.end}</span></div>
          <div className="muted" style={{ fontSize: 10, fontStyle: 'italic' }}>{e.location}</div>
          <ul>{e.bullets.map((b, j) => <li key={j}>{hl(b)}</li>)}</ul>
        </div>
      ))}

      <h2>Education</h2>
      {data.education.map((e, i) => (
        <div className="row" key={i}>
          <div><strong style={{ fontSize: 11 }}>{e.school}</strong> · <span style={{ fontSize: 11 }}>{e.degree}</span></div>
          <span className="muted">{e.year}</span>
        </div>
      ))}

      <h2>Skills</h2>
      <div style={{ fontSize: 11 }}>{hl(data.skills.join(' · '))}</div>
    </>
  );
}

function EditorialTemplate({ data, hl }) {
  return (
    <>
      <h1 style={{ fontSize: 42, marginBottom: 2 }}>{data.name}</h1>
      <div style={{ fontSize: 13, fontFamily: 'var(--serif)', fontStyle: 'italic', color: '#444', marginBottom: 6 }}>{data.title}</div>
      <div className="contact" style={{ marginBottom: 14 }}>
        {data.email} · {data.location} · {data.links.map(l => l.label).join(' · ')}
      </div>
      <div style={{ fontSize: 12, fontFamily: 'var(--serif)', lineHeight: 1.5, color: '#222', borderLeft: '2px solid #111', paddingLeft: 12, marginBottom: 16 }}>
        {hl(data.summary)}
      </div>

      <h2 style={{ borderBottom: 'none', borderTop: '1px solid #111', paddingTop: 8 }}>Experience</h2>
      {data.experience.map((e, i) => (
        <div className="exp-block" key={i}>
          <div className="row">
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 15 }}>{e.company}</h3>
            <span className="muted" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{e.start}–{e.end}</span>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>{e.role} · {e.location}</div>
          <ul>{e.bullets.map((b, j) => <li key={j}>{hl(b)}</li>)}</ul>
        </div>
      ))}

      <h2 style={{ borderBottom: 'none', borderTop: '1px solid #111', paddingTop: 8 }}>Education & Skills</h2>
      {data.education.map((e, i) => (
        <div className="row" key={i} style={{ marginBottom: 4 }}>
          <div><strong style={{ fontSize: 11 }}>{e.school}</strong><span style={{ fontSize: 11 }}> · {e.degree}</span></div>
          <span className="muted">{e.year}</span>
        </div>
      ))}
      <div style={{ fontSize: 11, marginTop: 4 }}>{hl(data.skills.join(' · '))}</div>
    </>
  );
}

function TechnicalTemplate({ data, hl }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#555', marginBottom: 4 }}># {data.title.toLowerCase().replace(/\s/g, '-')}</div>
      <h1 style={{ fontFamily: 'var(--sans)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{data.name}</h1>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#555', marginBottom: 10 }}>
        {data.email} &nbsp;·&nbsp; {data.location} &nbsp;·&nbsp; {data.links.map(l => l.label).join(' · ')}
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.55, marginBottom: 14 }}>{hl(data.summary)}</div>

      <h2 style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>// Experience</h2>
      {data.experience.map((e, i) => (
        <div className="exp-block" key={i}>
          <div className="row"><h3 style={{ fontFamily: 'var(--sans)', fontWeight: 600 }}>{e.role}</h3><span className="muted mono" style={{ fontSize: 10 }}>{e.start}—{e.end}</span></div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#555', marginBottom: 2 }}>{e.company} · {e.location}</div>
          <ul>{e.bullets.map((b, j) => <li key={j}>{hl(b)}</li>)}</ul>
        </div>
      ))}

      <h2 style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>// Education</h2>
      {data.education.map((e, i) => (
        <div className="row" key={i}><div><strong style={{ fontSize: 11 }}>{e.school}</strong> · <span style={{ fontSize: 11 }}>{e.degree}</span></div><span className="muted mono" style={{ fontSize: 10 }}>{e.year}</span></div>
      ))}

      <h2 style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>// Skills</h2>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, lineHeight: 1.7 }}>
        {data.skills.map((s, i) => (
          <span key={i} style={{ display: 'inline-block', border: '1px solid #ddd', padding: '1px 6px', borderRadius: 2, marginRight: 4, marginBottom: 3 }}>{hl(s)}</span>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { SAMPLE, ResumePaper, ClassicTemplate, EditorialTemplate, TechnicalTemplate });
