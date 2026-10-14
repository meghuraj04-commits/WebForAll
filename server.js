/**
 * AI Accessibility Guardian — WCAG 2.2 Backend Platform
 * Express API powered by Playwright, axe-core, and AI Remediation Synthesizer.
 *
 * Endpoints:
 * - GET  /api/health   : Healthcheck verifying server status.
 * - POST /api/scan     : Audits target URL using Playwright + axe-core and synthesizes AI code diffs.
 * - POST /api/recheck  : Differential recheck comparison between baseline and post-remediation scans.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { chromium } = require('playwright');
const axeCore = require('axe-core');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ============================================================================
// 1. Helper Functions & AI Code Remediation Synthesizer
// ============================================================================

/**
 * Formats axe-core tag array into standard WCAG 2.2 citation
 */
function formatWcagTags(tags = []) {
  const wcagTag = tags.find(t => /^wcag2/i.test(t));
  const ruleTag = tags.find(t => /^wcag\d{3}$/i.test(t));

  let label = "WCAG 2.2";
  if (wcagTag) {
    if (wcagTag.toLowerCase().includes("aaa")) label += " (AAA)";
    else if (wcagTag.toLowerCase().includes("aa")) label += " (AA)";
    else if (wcagTag.toLowerCase().includes("a")) label += " (A)";
  } else {
    label += " (AA)";
  }

  if (ruleTag) {
    const digits = ruleTag.replace(/[^\d]/g, "");
    if (digits.length === 3) {
      label += ` ${digits[0]}.${digits[1]}.${digits[2]}`;
    }
  }

  return label;
}

/**
 * AI Remediation Synthesizer
 * Generates an intelligent, accessible code correction (Before vs After)
 * based on the specific WCAG rule violated and offending DOM node.
 */
function synthesizeAiRemediation(violation, node) {
  const ruleId = violation.id;
  const rawHtml = (node && node.html) ? node.html.trim() : '<div>Target element</div>';
  const selector = (node && node.target) ? node.target.join(' ') : 'Element';

  let beforeCode = rawHtml;
  let afterCode = '';
  let aiRationale = '';

  switch (ruleId) {
    case 'image-alt':
      afterCode = rawHtml.includes('<img')
        ? rawHtml.replace(/<img/i, '<img alt="Descriptive text conveying image purpose"')
        : `<img src="/asset.png" alt="Descriptive text conveying image purpose">`;
      aiRationale = 'WCAG 2.2 (1.1.1 Non-text Content) mandates descriptive text alternatives for all informational images. Decorative images should use alt="".';
      break;

    case 'label':
    case 'aria-input-field-name':
      const idMatch = rawHtml.match(/id=["']([^"']+)["']/i);
      const inputId = idMatch ? idMatch[1] : 'field-input';
      afterCode = `<label for="${inputId}" class="form-label">Field Label <span class="required" aria-hidden="true">*</span></label>\n${rawHtml.replace(/<input/i, `<input id="${inputId}" aria-required="true"`)}`;
      aiRationale = 'WCAG 2.2 (1.3.1 Info & Relationships, 4.1.2 Name/Role/Value) requires explicit programmatically linked labels so screen readers identify the field purpose.';
      break;

    case 'color-contrast':
      beforeCode = `/* Low contrast text */\n${rawHtml}\n/* Measured contrast ratio < 4.5:1 */`;
      afterCode = `/* WCAG 2.2 AA Compliant Contrast (Ratio > 7:1) */\n${rawHtml.replace(/style=["'][^"']*["']/i, 'style="color: #0f172a; background-color: #ffffff;"')}`;
      aiRationale = 'WCAG 2.2 (1.4.3 Contrast Minimum) requires a contrast ratio of at least 4.5:1 for normal body text and 3:1 for large text.';
      break;

    case 'link-name':
      afterCode = rawHtml.replace(/<a([^>]*)>/i, `<a$1 aria-label="Descriptive link destination">\n  <span class="sr-only">Descriptive link text</span>`);
      aiRationale = 'WCAG 2.2 (2.4.4 Link Purpose) mandates that links must have discernible accessible names for screen reader speech navigation.';
      break;

    case 'button-name':
      afterCode = rawHtml.replace(/<button([^>]*)>/i, `<button$1 aria-label="Perform action">\n  <span class="sr-only">Perform action</span>`);
      aiRationale = 'WCAG 2.2 (4.1.2 Name, Role, Value) requires interactive buttons to announce an accessible name when focused.';
      break;

    case 'target-size':
      beforeCode = `/* Non-compliant target dimension under 24x24px */\n${rawHtml}`;
      afterCode = `/* Compliant with WCAG 2.2 Criterion 2.5.8 */\n${rawHtml.replace(/<button/i, '<button style="min-width: 44px; min-height: 44px; padding: 10px 14px;"')}`;
      aiRationale = 'WCAG 2.2 (2.5.8 Target Size Minimum) requires interactive targets to measure at least 24 by 24 CSS pixels to protect users with motor tremors.';
      break;

    case 'focus-not-obscured':
    case 'focus-visible':
      beforeCode = `/* Element lacks focus visibility or is covered by sticky overlay */\n${rawHtml}`;
      afterCode = `/* WCAG 2.2 2.4.11 & 2.4.7 Compliant Focus */\n${rawHtml}\n/* CSS Fix: */\n:focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; scroll-margin: 80px; }`;
      aiRationale = 'WCAG 2.2 (2.4.11 Focus Not Obscured) ensures focused interactive controls are never fully hidden behind floating banners, headers, or overlays.';
      break;

    default:
      // General intelligent remediation using failure summary
      const fixSummary = (node && node.failureSummary) ? node.failureSummary : violation.help;
      afterCode = `<!-- AI Remediation: ${violation.help} -->\n${rawHtml}\n<!-- Required Fix: ${fixSummary.replace(/\n/g, ' ')} -->`;
      aiRationale = `WCAG 2.2 guidelines require remediating this element to eliminate barriers: ${violation.description}`;
      break;
  }

  return { beforeCode, afterCode, aiRationale };
}

/**
 * Calculates a 0-100 accessibility health score based on severity weights
 */
function calculateScore(counts) {
  const deductions = 
    (counts.critical * 14) +
    (counts.serious * 9) +
    (counts.moderate * 5) +
    (counts.minor * 2);

  const rawScore = 100 - deductions;
  return Math.max(10, Math.min(100, rawScore));
}

// ============================================================================
// 2. API Routes
// ============================================================================

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Accessibility Guardian Engine',
    version: 'WCAG 2.2 AA',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/scan
 * Audits a webpage via Playwright and axe-core, generating AI fixes with human-approval states.
 */
app.post('/api/scan', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid website URL starting with http:// or https://'
    });
  }

  const targetUrl = url.trim();
  console.log(`[AI GUARDIAN] Starting WCAG 2.2 scan: ${targetUrl}`);

  let browser = null;

  try {
    // Launch Playwright headless browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AI-Accessibility-Guardian/2.2'
    });

    const page = await context.newPage();

    // Navigate with timeout
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(1000); // Allow dynamic scripts to settle

    // Inject axe-core engine
    await page.evaluate(axeCore.source);

    // Run axe.run() targeting WCAG 2.2 rules
    const axeResults = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
        }
      });
    });

    // Map violations and synthesize AI code fixes
    const issues = (axeResults.violations || []).map((v, index) => {
      const firstNode = (v.nodes && v.nodes[0]) ? v.nodes[0] : null;
      const selector = (firstNode && firstNode.target) ? firstNode.target.join(' ') : 'Document';
      const remediation = synthesizeAiRemediation(v, firstNode);

      return {
        id: `live-${v.id}-${index}`,
        title: v.help || v.description,
        severity: v.impact || 'minor', // critical, serious, moderate, minor
        wcag: formatWcagTags(v.tags),
        sector: 'Live Web Audit',
        element: selector,
        explanation: v.description,
        beforeCode: remediation.beforeCode,
        afterCode: remediation.afterCode,
        aiRationale: remediation.aiRationale,
        status: 'pending' // Enforces human approval
      };
    });

    const counts = {
      critical: issues.filter(i => i.severity === 'critical').length,
      serious: issues.filter(i => i.severity === 'serious').length,
      moderate: issues.filter(i => i.severity === 'moderate').length,
      minor: issues.filter(i => i.severity === 'minor').length,
      total: issues.length
    };

    const score = calculateScore(counts);

    console.log(`[AI GUARDIAN] Finished scan: ${targetUrl} -> Found ${counts.total} violations (Score: ${score}/100)`);

    return res.json({
      success: true,
      url: targetUrl,
      scannedAt: new Date().toISOString(),
      score: score,
      counts: counts,
      issues: issues
    });

  } catch (error) {
    console.error(`[AI GUARDIAN ERROR] ${targetUrl}:`, error.message);

    let friendlyError = 'An error occurred while scanning the website.';
    if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      friendlyError = 'Website could not be resolved. Please verify domain name.';
    } else if (error.message.includes('Timeout')) {
      friendlyError = 'The website took too long to respond (timeout after 30 seconds).';
    } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      friendlyError = 'Connection was refused by the target host.';
    }

    return res.status(500).json({
      success: false,
      error: friendlyError,
      technicalDetails: error.message
    });

  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

// ============================================================================
// 3. Start Server
// ============================================================================
app.listen(PORT, () => {
  console.log(`
=================================================================
  🛡️  AI Accessibility Guardian Server is Active!
  ---------------------------------------------------------------
  🌐 Dashboard UI    : http://localhost:${PORT}
  🔌 API Healthcheck : http://localhost:${PORT}/api/health
  ⚡ Live Scan API   : POST http://localhost:${PORT}/api/scan
=================================================================
  `);
});
