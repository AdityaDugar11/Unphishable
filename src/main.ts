import './style.css';
import { MAX_MESSAGE, responseSchema, type AnalysisResponse } from '../shared/schema';
import { samples } from '../shared/samples';
const shield = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/></svg>';
const scan = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 9h10M7 13h7M7 17h4"/></svg>';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <a class="skip" href="#message">Skip to message input</a>
  <header class="topbar">
    <a href="#" class="brand"><span class="brand-icon">${shield}</span>unphishable<span class="brand-dot" aria-hidden="true">.</span></a>
    <nav aria-label="Main navigation"><a href="#examples">The collection</a><a href="#how-it-works">Our approach</a><a href="#workspace" class="nav-cta">Open decoder <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main>
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-editorial"><p class="eyebrow">A CLEARER READ ON DIGITAL TRUST</p>
        <h1 id="hero-title">A message.<br>A motive.<br><em>A moment</em><br>to pause.</h1>
        <p class="hero-copy">See the pressure behind the words. Decode manipulation tactics, examine the evidence, and decide your next move with a clearer head.</p>
        <div class="hero-actions"><a class="primary-link" href="#workspace">Decode a message <span aria-hidden="true">↗</span></a><a class="inline-link" href="#examples">Explore the examples <span aria-hidden="true">↓</span></a></div>
        <p class="hero-footnote"><span class="mini-cross" aria-hidden="true">✳</span> A little perspective goes a long way.</p>
      </div>
      <figure class="hero-art" aria-label="Illustration of a message annotated with potential urgency, authority, and secrecy tactics. This is an example, not a live analysis.">
        <div class="art-topline"><span>THE ANATOMY OF PRESSURE</span><span>FIG. 01 / EXAMPLE</span></div>
        <div class="art-orbit" aria-hidden="true"></div><div class="art-cross" aria-hidden="true">+</div>
        <div class="message-sheet"><div class="sheet-heading"><span class="sheet-icon">${scan}</span><span>INCOMING MESSAGE</span><span aria-hidden="true">↗</span></div><p>“This is <span class="phrase">your CEO.</span><br>I need this transfer<br><span class="phrase">immediately.</span><br><span class="phrase">Keep this between us.</span>”</p><div class="sheet-footer"><span>READ BETWEEN THE LINES</span><span>↳</span></div></div>
        <div class="tactic-note note-authority"><span>01</span> CLAIMED AUTHORITY</div><div class="tactic-note note-urgency"><span>02</span> ARTIFICIAL URGENCY</div><div class="tactic-note note-secrecy"><span>03</span> SECRECY & ISOLATION</div>
        <div class="art-bottomline"><span>WORDS HAVE WEIGHT.<br>GIVE YOURSELF SPACE.</span><span class="art-star" aria-hidden="true">✳</span></div>
      </figure>
    </section>
    <section class="features-section" aria-label="What the decoder offers"><p class="eyebrow">LESS SECOND-GUESSING.<br>MORE PERSPECTIVE.</p><article><span class="feature-symbol" aria-hidden="true">↗</span><h2>Spot the pressure.</h2><p>Recognize urgency, guilt, authority, and other potential tactics.</p></article><article><span class="feature-symbol" aria-hidden="true">⌗</span><h2>Follow the evidence.</h2><p>See the exact phrases behind each finding, in their original context.</p></article><article><span class="feature-symbol" aria-hidden="true">↳</span><h2>Choose your response.</h2><p>Consider other interpretations and take a practical, safer next step.</p></article></section>
    <div class="workspace-heading" id="workspace"><div><p class="eyebrow">01 / THE DECODER</p><h2>Let’s take <em>a closer look.</em></h2></div><span class="small-note">Your message. A fresh perspective.<br>No account required.</span></div>
    <section class="workspace-grid" aria-label="Analysis workspace">
      <div class="panel input-panel"><div class="panel-heading"><span class="panel-title">${scan} Decode a message</span><span class="tag">TEXT ANALYSIS</span></div>
        <form id="analysis-form"><div class="sample-select-row"><label for="sample-select">Start with an example</label><select id="sample-select"><option value="">Choose a sample message</option></select></div><label for="message">What landed in your inbox?</label><p class="field-help" id="input-help">Paste an email, text, or conversation. Remove private details first.</p><textarea id="message" name="message" maxlength="10000" aria-describedby="input-help counter" placeholder="Paste the message here…&#10;&#10;A surprising request. An urgent deadline. Something that just feels off."></textarea><div class="input-footer"><span id="counter">0 / 10,000 characters</span><button type="button" class="text-button" id="clear">Clear text</button></div>
        <div class="mode-row"><label for="mode">Analysis mode</label><select id="mode"><option value="demo">Demo · local phrase rules</option><option value="live" disabled>Live AI · not configured</option></select></div><p id="privacy" class="privacy">${shield}<span>Demo mode uses this app’s server, without an AI provider. Nothing is saved.</span></p>
        <button class="analyze-button" id="analyze" type="submit">${scan}<span>Decode message</span><span class="arrow">↗</span></button><p id="error" class="error" role="alert" hidden></p><p id="connection" class="field-help" role="status"></p>
        </form>
      </div>
      <div class="panel results-panel" id="results-panel" aria-busy="false"><div class="panel-heading"><span class="panel-title"><span class="result-dot"></span> Your analysis</span><span id="result-label" class="tag">READY WHEN YOU ARE</span></div><div id="results" aria-live="polite"><div class="empty-state"><div class="empty-icon">${scan}</div><h3>Turn uncertainty into clarity.</h3><p>Your analysis will connect potential pressure tactics to the exact words behind them.</p><div class="empty-steps"><span><b>01</b> Spot the signals</span><span><b>02</b> See the evidence</span><span><b>03</b> Choose a safer next step</span></div><span class="empty-caption">CONTEXT MATTERS. YOUR JUDGMENT MATTERS MORE.</span></div></div></div>
    </section>
    <section id="examples" class="examples-section"><div class="section-heading"><div><p class="eyebrow">02 / THE MESSAGE COLLECTION</p><h2>A collection of<br><em>second looks.</em></h2><p>Some messages raise questions. Others just say hello. Explore both.</p></div><span class="tag">6 SAMPLE MESSAGES</span></div><div class="sample-grid" id="samples"></div></section>
    <section id="how-it-works" class="how-section"><div><p class="eyebrow">03 / OUR APPROACH</p><h2>From a gut feeling<br>to <em>a clearer view.</em></h2><p>Manipulation is about context, not just keywords. A finding is a reason to pause—not a verdict on someone’s intent.</p></div><div class="method-list"><article><span>01</span><div><h3>Identify potential pressure</h3><p>Demo mode checks English phrases. Optional live AI considers meaning and context alongside those checks.</p></div></article><article><span>02</span><div><h3>Ground it in the message</h3><p>Every finding includes exact wording, how it may influence you, and an alternative interpretation.</p></div></article><article><span>03</span><div><h3>Put you back in control</h3><p>Get practical next steps. Risk levels guide attention; they are not probabilities of fraud.</p></div></article></div></section>
    <section id="privacy-details" class="privacy-section"><div class="privacy-heading"><p class="eyebrow">04 / YOUR WORDS, YOUR CHOICE</p><h2>A private space<br>to <em>think twice.</em></h2>${shield}</div><div class="privacy-facts"><article><span>01</span><div><h3>No AI provider by default.</h3><p>Demo analysis runs on the app server (on Vercel when hosted). No messages are sent to an AI provider in demo mode.</p></div></article><article><span>02</span><div><h3>No saved conversations.</h3><p>This app keeps no message history. Clear your text or refresh to remove the visible analysis.</p></div></article><article><span>03</span><div><h3>Live AI is your choice.</h3><p>Selecting live mode sends the text to your configured provider. Its data policy applies. Remove private details first.</p></div></article><a class="inline-link" href="#workspace">Choose your analysis mode <span aria-hidden="true">↗</span></a></div></section>
    <section class="final-cta"><p class="eyebrow">BEFORE YOU CLICK. BEFORE YOU COMMIT.</p><div><h2>Make room for<br><em>your own judgment.</em></h2><a class="primary-link" href="#workspace">Take a closer look <span aria-hidden="true">↗</span></a></div><span class="cta-star" aria-hidden="true">✳</span></section>
    <footer><a class="brand" href="#">${shield}unphishable.</a><p>Decision support, not proof. No identity or link verification.</p><a class="footer-link" href="#privacy-details">Privacy & your data ↗</a></footer>
  </main><div id="toast" role="status" class="toast" hidden></div>`;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const input = $<HTMLTextAreaElement>('#message');
const mode = $<HTMLSelectElement>('#mode');
const button = $<HTMLButtonElement>('#analyze');
const results = $('#results');
const empty = results.innerHTML;
let current: { analysis: AnalysisResponse; message: string } | null = null;
let controller: AbortController | null = null;
let revision = 0;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function resetResult() { current = null; results.innerHTML = empty; $('#result-label').textContent = 'READY WHEN YOU ARE'; }
function count() { $('#counter').textContent = `${input.value.length.toLocaleString()} / 10,000 characters`; }
function cancel() { revision++; controller?.abort(); controller = null; button.disabled = false; button.querySelector('span')!.textContent = 'Decode message'; $('#results-panel').setAttribute('aria-busy', 'false'); }
function edited() { cancel(); count(); resetResult(); $('#error').hidden = true; }
input.addEventListener('input', edited);
$('#clear').addEventListener('click', () => { input.value = ''; edited(); input.focus(); });
mode.addEventListener('change', () => { edited(); $('#privacy span').textContent = mode.value === 'live' ? 'Live mode sends this text to your configured AI provider. Its data policy applies. Nothing is saved by this app.' : 'Demo mode uses this app’s server, without an AI provider. Nothing is saved.'; });
const sampleSelect = $<HTMLSelectElement>('#sample-select');
sampleSelect.innerHTML += samples.map((sample, index) => `<option value="${index}">${escape(sample.title)}</option>`).join('');
sampleSelect.addEventListener('change', () => { if (sampleSelect.value === '') return; input.value = samples[Number(sampleSelect.value)].text; edited(); input.focus(); });
input.addEventListener('input', () => { sampleSelect.value = ''; });
$('#clear').addEventListener('click', () => { sampleSelect.value = ''; });
$('#samples').innerHTML = samples.map((s, i) => `<button class="sample-card" type="button" data-sample="${i}"><span class="sample-top"><span>${s.channel}</span><span class="sample-kind ${s.kind === 'Benign' ? 'benign' : ''}">${s.kind}</span></span><strong>${escape(s.title)}</strong><span class="sample-excerpt">${escape(s.text.slice(0, 93))}…</span><span class="sample-action">Load example <span>↗</span></span></button>`).join('');
$('#samples').addEventListener('click', event => { const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-sample]'); if (!target) return; input.value = samples[Number(target.dataset.sample)].text; sampleSelect.value = target.dataset.sample!; edited(); input.focus(); $('#workspace').scrollIntoView({ behavior: 'smooth' }); });
function highlighted(message: string, analysis: AnalysisResponse) {
  const spans: { start: number; end: number }[] = [];
  for (const finding of analysis.findings) for (const evidence of finding.evidence) {
    let offset = 0;
    for (;;) { const start = message.indexOf(evidence, offset); if (start < 0) break; spans.push({ start, end: start + evidence.length }); offset = start + evidence.length; }
  }
  spans.sort((a, b) => a.start - b.start);
  const merged: typeof spans = [];
  for (const span of spans) { const previous = merged.at(-1); if (previous && span.start <= previous.end) previous.end = Math.max(previous.end, span.end); else merged.push({ ...span }); }
  let offset = 0; let html = '';
  for (const span of merged) { html += escape(message.slice(offset, span.start)) + `<mark>${escape(message.slice(span.start, span.end))}</mark>`; offset = span.end; }
  return html + escape(message.slice(offset));
}
function render(analysis: AnalysisResponse, message: string) {
  $('#result-label').textContent = analysis.mode === 'demo' ? 'DEMO · RULE-BASED' : 'LIVE AI';
  results.innerHTML = `<div class="analysis-content"><div class="risk-summary risk-${analysis.risk.toLowerCase()}"><span class="risk-icon">${shield}</span><div><span class="eyebrow">OVERALL ASSESSMENT</span><h3>${analysis.risk} risk</h3></div><span class="finding-count">${analysis.findings.length}<small>tactics</small></span></div><p class="summary">${escape(analysis.summary)}</p><p class="mode-notice">${escape(analysis.notice)}</p><h4>Evidence in context <span>EXACT PHRASES</span></h4><div class="evidence-message">${highlighted(message, analysis)}</div><div class="findings">${analysis.findings.length ? analysis.findings.map((f, i) => `<article class="finding"><div class="finding-heading"><span class="finding-index">${String(i + 1).padStart(2, '0')}</span><h4>${escape(f.tactic)}</h4><span class="severity">${f.severity}</span></div>${f.evidence.map(e => `<blockquote>“${escape(e)}”</blockquote>`).join('')}<p>${escape(f.explanation)}</p><details><summary>Another way to read this</summary><p>${escape(f.alternative)}</p></details></article>`).join('') : '<p class="no-findings">No supported tactic matches in this analysis. This is not a safety guarantee.</p>'}</div><section class="recommendations"><h4>Your next move</h4><ol>${analysis.recommendations.map(r => `<li>${escape(r)}</li>`).join('')}</ol></section>${analysis.safeReply ? `<section class="safe-reply"><div><h4>A reply you could use</h4><button class="text-button" id="copy-reply" type="button">Copy reply</button></div><p>${escape(analysis.safeReply)}</p><small>For unsolicited suspicious messages, verifying independently may be safer than replying.</small></section>` : ''}<details class="uncertainty" open><summary>What this analysis cannot tell you</summary><p>${escape(analysis.uncertainty)}</p></details><div class="report-actions"><button id="copy-report" type="button" class="secondary-button">Copy report</button><button id="print-report" type="button" class="text-button">Print report ↗</button></div></div>`;
}
async function copy(text: string) { try { await navigator.clipboard.writeText(text); $('#toast').textContent = 'Copied to clipboard'; } catch { $('#toast').textContent = 'Clipboard unavailable. Select the text and copy it manually.'; } $('#toast').hidden = false; setTimeout(() => { $('#toast').hidden = true; }, 3000); }
results.addEventListener('click', e => { const id = (e.target as HTMLElement).closest('button')?.id; if (!current) return; const a = current.analysis; if (id === 'copy-reply' && a.safeReply) void copy(a.safeReply); if (id === 'print-report') window.print(); if (id === 'copy-report') void copy(`UNPHISHABLE — ${a.mode.toUpperCase()} ANALYSIS\n${a.notice}\n\n${a.risk} risk\n${a.summary}\n\nMessage:\n${current.message}\n\n${a.findings.map(f => `${f.tactic} (${f.severity})\nEvidence: ${f.evidence.join(' | ')}\n${f.explanation}\nAlternative: ${f.alternative}`).join('\n\n')}\n\nNext steps:\n${a.recommendations.join('\n')}\n\n${a.safeReply ? `Suggested reply: ${a.safeReply}\n\n` : ''}Limitations: ${a.uncertainty}`); });
$('#analysis-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('#error').hidden = true;
  if (!input.value.trim() || input.value.length > MAX_MESSAGE) { $('#error').textContent = 'Paste a message between 1 and 10,000 characters.'; $('#error').hidden = false; input.focus(); return; }
  cancel(); resetResult();
  const requestRevision = revision;
  controller = new AbortController();
  const requestController = controller;
  const timeout = setTimeout(() => requestController.abort('timeout'), 35000);
  button.disabled = true; button.querySelector('span')!.textContent = 'Reading between the lines…'; $('#results-panel').setAttribute('aria-busy', 'true');
  results.innerHTML = '<div class="empty-state loading"><div class="spinner"></div><h3>Looking closer.</h3><p>Checking potential tactics and grounding the evidence in your message.</p></div>';
  const message = input.value;
  try {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, mode: mode.value }), signal: requestController.signal });
    const data = await response.json().catch(() => { throw new Error('The API returned a non-JSON response. Check the API deployment and try again.'); });
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Analysis failed. Please try again.');
    const analysis = responseSchema.parse(data);
    if (requestRevision !== revision) return;
    current = { analysis, message }; render(analysis, message);
  } catch (error) {
    if (requestRevision !== revision) return;
    resetResult(); $('#error').hidden = false;
    $('#error').textContent = requestController.signal.aborted ? 'The request timed out. Please try again.' : error instanceof Error ? error.message : 'Unable to reach the server. Please try again.';
  } finally { clearTimeout(timeout); if (requestRevision === revision) { button.disabled = false; button.querySelector('span')!.textContent = 'Decode message'; $('#results-panel').setAttribute('aria-busy', 'false'); controller = null; } }
});
void fetch('/api/config', { signal: AbortSignal.timeout(5000) }).then(async response => { if (!response.ok) throw new Error(); const config = await response.json(); if (config.liveAvailable === true) { mode.options[1].disabled = false; mode.options[1].textContent = 'Live AI · external provider'; } }).catch(() => { $('#connection').textContent = 'Server configuration unavailable. Check that /api/config and /api/analyze are deployed, then refresh. Demo mode also needs the app server.'; });
