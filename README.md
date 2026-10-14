# 🛡️ AI Accessibility Guardian — WCAG 2.2 Compliance & Remediation Platform

> **An intelligent, human-in-the-loop accessibility auditing and remediation platform built for enterprise banking, financial services, and healthcare patient portals.**

---

## 🌟 Overview

Ensuring digital accessibility is legally mandated under **ADA Title III**, **Section 508**, and **HHS Section 504**. However, developers building mission-critical patient portals and banking applications face two major hurdles:
1. **Automated scanners identify errors but do not provide context-aware, copy-paste ready code fixes.**
2. **AI coding assistants risk introducing regressions if code is applied blindly without human verification.**

**AI Accessibility Guardian** bridges this gap:
- It audits web pages against **WCAG 2.2 Level AA** standards using Playwright and Deque's industry-standard `axe-core` engine.
- An **AI Remediation Synthesizer** analyzes the DOM node and generates side-by-side **Before vs After code corrections**.
- **Mandatory Human-in-the-Loop Approval:** No code changes are applied without explicit developer sign-off (`Approve` or `Reject`).
- **Differential Recheck Engine:** Re-evaluates post-remediation pages to verify barriers were eliminated without regressions.

---

## 🚀 Key Features

- **📊 Comprehensive Executive Dashboard:** Real-time Accessibility Health Score (0–100), severity breakdown (Critical, Serious, Moderate, Minor), and human sign-off pipeline KPI.
- **🏥 Sector-Specific Compliance Profiles:**
  - **🏦 Banking & Financial Services:** Audits wire transfer inputs, 2FA OTP copy-paste restrictions (WCAG 2.2 3.3.8 & 3.3.7), mobile quick-transfer target sizes (WCAG 2.2 2.5.8), and focus obscuration from floating support widgets (WCAG 2.2 2.4.11).
  - **🏥 Healthcare Patient Portals:** Audits Electronic Health Record (EHR) vitals tables missing `<th>` scopes, emergency allergy alert modals trapping keyboard focus (WCAG 2.1.2), and HIPAA electronic consent checkboxes.
  - **🏢 Enterprise SaaS:** Evaluates data grid sort controls, financial analytics color contrast, and session expiration timeouts (WCAG 2.2.1).
- **🤖 AI Code Remediation Previews:** Side-by-side code diffs showing current buggy markup vs AI-suggested accessible code, complete with WCAG 2.2 technical rationale.
- **🛡️ Human Approval Sign-off:** Developers review and approve or reject every single fix individually.
- **🔄 Recheck & Differential Comparison:** Compares Scan #1 (Baseline) with Scan #2 (Post-Remediation), highlighting resolved vs remaining issues.
- **📈 Compliance Velocity Reporting:** Tracks percentage of baseline issues remediated and breaks down compliance by WCAG core principles (Perceivable, Operable, Understandable, Robust).
- **♿ Fully Accessible Tooling:** Built with semantic HTML5, high-contrast WCAG AAA color palette, visible focus indicators, skip-link navigation, and screen reader live announcements.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), Semantic HTML5, CSS3 Custom Properties (WCAG AAA/AA compliant, responsive design)
- **Backend API:** Node.js, Express.js, CORS
- **Browser Automation:** Playwright (Headless Chromium)
- **Auditing Engine:** `axe-core` (Deque Systems)

---

## 💻 Local Quickstart

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
cd <YOUR-REPO-NAME>
```

### 2. Install dependencies
```bash
npm install
npx playwright install chromium
```

### 3. Start the application
```bash
npm start
```

Open your browser and navigate to:
👉 **http://localhost:5000**

---

## ⚖️ Compliance Advisory

Automated accessibility tools identify approximately 35–40% of WCAG success criteria (such as color contrast, missing labels, and programmatic roles). Full WCAG 2.2 AA conformance requires combined automated scanning and human assistive technology validation (screen readers, keyboard-only traversal, and zoom scaling).

---

## 📄 License
ISC License &bull; Built for Hackathon 2026
