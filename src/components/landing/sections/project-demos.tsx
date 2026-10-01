import type { ReactNode } from "react";

/*
 * Back-face product demonstrations for the Selected Work cards. Each plays
 * once when its card gains `.is-playing` (see ProjectFlip), via the
 * transitions in globals.css under "Project flip demos".
 */

function Chatboq() {
  return (
    <div className="demo demo-chat">
      <p className="demo-heading">Conversations that keep moving.</p>
      <div className="demo-window">
        <p className="demo-msg demo-msg-in">Can I book a demo?</p>
        <p className="demo-msg demo-msg-out demo-reply">
          Absolutely. Let’s find a time.
        </p>
      </div>
    </div>
  );
}

function Ed360() {
  return (
    <div className="demo demo-pipeline">
      {["New enquiry", "In progress", "Confirmed"].map((label, i) => (
        <div key={label} className="demo-col" data-col={i}>
          <span className="demo-col-label">{label}</span>
          <div className="demo-col-body">
            {i === 0 && (
              <span className="demo-lead" data-traveller="">
                New student
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Ignition() {
  return (
    <div className="demo demo-journey">
      <p className="demo-heading">From first enquiry to your first day.</p>
      <div className="demo-stages">
        <span>Profile</span>
        <span>Application</span>
        <span>Offer</span>
      </div>
      <div className="demo-track">
        <span className="demo-track-fill" />
      </div>
      <span className="demo-status">
        <span className="demo-check">✓</span> Application ready
      </span>
    </div>
  );
}

function Docket() {
  return (
    <div className="demo demo-matter">
      <p className="demo-heading">Every matter. Everything in its place.</p>
      <div className="demo-panel">
        <span className="demo-panel-title">Matter overview</span>
        <span className="demo-row">Case documents</span>
        <span className="demo-row">Upcoming hearing</span>
        <span className="demo-row">Notes &amp; activity</span>
      </div>
    </div>
  );
}

export const projectDemos: Record<string, ReactNode> = {
  chatboq: <Chatboq />,
  ed360: <Ed360 />,
  ignition: <Ignition />,
  docket: <Docket />,
};
