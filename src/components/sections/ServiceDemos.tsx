import type { ReactNode } from "react";
import type { Service } from "@/content/site";

/*
 * Miniature, purely illustrative product demos for the services accordion.
 * Nothing here is interactive; the whole demo is hidden from assistive tech
 * (the service description carries the meaning). Elements with `sd-anim`
 * play once when their demo gets `.is-played` (see Services.tsx and the
 * "Service demos" block in globals.css).
 */

function WebDemo() {
  return (
    <div className="sd-web">
      <div className="sd-bar">
        <span className="sd-dots">
          <i />
          <i />
          <i />
        </span>
        <span>your business / online</span>
        <span>↗</span>
      </div>
      <div className="sd-nav">
        <span className="sd-brand">Studio.</span>
        <span className="sd-links">
          Work&nbsp;&nbsp;About&nbsp;&nbsp;Contact
        </span>
      </div>
      <div className="sd-hero">
        <div className="sd-hero-copy">
          <span className="sd-eyebrow">A BETTER FIRST IMPRESSION</span>
          <span className="sd-heading">
            Built to
            <br />
            be chosen.
          </span>
          <span className="sd-cta">Let’s talk ↗</span>
        </div>
        <div className="sd-forms">
          <i className="sd-anim" />
          <i className="sd-anim" />
          <i className="sd-anim" />
        </div>
      </div>
      <div className="sd-foot">
        <span>Clear message</span>
        <span>Fast experience</span>
        <span>Easy next step</span>
      </div>
    </div>
  );
}

function SoftwareDemo() {
  const tasks = [
    ["New enquiry", "Assigned"],
    ["Client proposal", "Approved"],
    ["Project handover", "Ready"],
  ];
  return (
    <div className="sd-work">
      <div className="sd-bar">
        <span>WORKSPACE</span>
        <span>Today’s work</span>
        <span>↗</span>
      </div>
      <div className="sd-work-body">
        <div className="sd-side">
          <span>Overview</span>
          <span className="sd-side-on">Projects</span>
          <span>People</span>
          <span>Reports</span>
        </div>
        <div className="sd-work-main">
          {tasks.map(([task, status]) => (
            <div key={task} className="sd-task sd-anim">
              <span className="sd-check">✓</span>
              <span className="sd-task-name">{task}</span>
              <span className="sd-task-status">{status}</span>
            </div>
          ))}
          <div className="sd-sync">
            <i className="sd-dot" />
            Everything in sync.
          </div>
        </div>
      </div>
    </div>
  );
}

function AutomationDemo() {
  const steps = [
    ["01", "Capture", "Enquiry received"],
    ["02", "Assign", "Right team member"],
    ["03", "Follow up", "Reply delivered"],
  ];
  return (
    <div className="sd-flow">
      <div className="sd-bar">
        <span>ENQUIRY WORKFLOW</span>
        <span className="sd-live">Active</span>
      </div>
      <div className="sd-nodes">
        {steps.map(([num, title, sub], i) => (
          <div key={num} className="sd-step">
            <div className="sd-node">
              <span className="sd-num">{num}</span>
              <span className="sd-node-title">{title}</span>
              <span className="sd-node-sub">{sub}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="sd-track">
                <i className="sd-fill" />
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="sd-done sd-anim">
        ✓ The next step is already taken care of.
      </p>
    </div>
  );
}

function MarketingDemo() {
  return (
    <div className="sd-edit">
      <div className="sd-bar">
        <span>ONE MESSAGE. MORE PLACES.</span>
      </div>
      <div className="sd-blocks">
        <div className="sd-block sd-block-wide sd-anim">
          <span className="sd-label">SEARCH</span>
          <span className="sd-title">Your business. Found.</span>
          <span className="sd-sub">What you do, made clear.</span>
        </div>
        <div className="sd-block sd-anim">
          <span className="sd-label">CONTENT</span>
          <span className="sd-title">
            Make an
            <br />
            impression.
          </span>
        </div>
        <div className="sd-block sd-anim">
          <span className="sd-label">ENQUIRY</span>
          <span className="sd-title">
            Let’s work
            <br />
            together. ↗
          </span>
        </div>
      </div>
    </div>
  );
}

export const serviceDemos: Record<Service["id"], ReactNode> = {
  web: <WebDemo />,
  software: <SoftwareDemo />,
  automation: <AutomationDemo />,
  marketing: <MarketingDemo />,
};
