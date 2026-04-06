// End-to-end test using the EXTENSION'S OWN compiled BackendClient against
// the running backend. This is exactly what the chat panel does at runtime.

const path = require('path');
const EXT = process.env.EXT_DIR;
const { BackendClient } = require(path.join(EXT, 'out', 'backendClient.js'));

const client = new BackendClient('ws://127.0.0.1:8765/ws');
const events = [];
let done = false;
let errored = false;

client.onEvent((e) => {
  events.push(e);
  if (e.type === 'route') console.log(`[route] T${e.tier} ${e.provider}`);
  else if (e.type === 'tool_call') console.log(`[tool] ${e.name}`);
  else if (e.type === 'tool_result') console.log(`[result] ${String(e.result).slice(0,100).replace(/\n/g,' ')}`);
  else if (e.type === 'budget') console.log(`[budget] $${e.spent_usd.toFixed(5)}`);
  else if (e.type === 'assistant') console.log(`[asst] ${(e.text||'').slice(0,140).replace(/\n/g,' ')}`);
  else if (e.type === 'done') { console.log(`[DONE] ${(e.final||'').slice(0,140).replace(/\n/g,' ')}`); done = true; }
  else if (e.type === 'error') { console.error(`[ERROR] ${e.message}`); errored = true; }
});

(async () => {
  await client.run(
    'Read calc.py from the workspace, then add a subtract(a,b) function that returns a-b. Then stop.',
    'C:\\tmp\\nexus_demo',
    0.05
  );
  // wait up to 90s for done/error
  const start = Date.now();
  while (!done && !errored && Date.now() - start < 90_000) {
    await new Promise(r => setTimeout(r, 200));
  }
  client.close();
  if (errored) { console.error('FAIL: error event received'); process.exit(1); }
  if (!done) { console.error('FAIL: timed out'); process.exit(1); }
  const hasRoute = events.some(e => e.type === 'route');
  const hasTool = events.some(e => e.type === 'tool_call');
  if (!hasRoute || !hasTool) { console.error('FAIL: missing route/tool events'); process.exit(1); }
  console.log('PASS — extension BackendClient round-trip works end-to-end');
})();
