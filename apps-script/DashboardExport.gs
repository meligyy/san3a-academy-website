/**
 * OPTIONAL add-on for the existing "San3a Academy Dashboard" Apps Script project.
 * Copies ONLY per-round counts (course, round title, start, end, number of people) into the
 * "San3a Website Live Data" sheet so the website can show "seats left" automatically.
 * No names, phones, payments, advisors, waitlist or blacklist rows are copied.
 *
 * Install (inside the dashboard project):
 *   1. Add a new script file, paste this code.
 *   2. Project Settings → Script properties → add LIVE_DATA_SHEET_ID = <id logged by LiveApi.setup()>.
 *   3. Run installPublicRoundsTrigger() once (authorise). It runs every 15 minutes.
 */
function exportPublicRounds() {
  var id = PropertiesService.getScriptProperties().getProperty('LIVE_DATA_SHEET_ID');
  if (!id) throw new Error('Set the LIVE_DATA_SHEET_ID script property first.');
  var raw = getRounds();                       // existing dashboard function
  var RD = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!RD || RD.error) throw new Error('getRounds failed: ' + (RD && RD.error));
  var rows = [['course', 'round', 'start', 'end', 'enrolled', 'updated_at']];
  (RD.courses || []).forEach(function (c) {
    (c.rounds || []).forEach(function (r) {
      rows.push([String(c.course || ''), String(r.title || ''), r.start || '', r.end || '', Number(r.people) || 0, new Date()]);
    });
  });
  var sh = SpreadsheetApp.openById(id).getSheetByName('rounds_auto');
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function installPublicRoundsTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'exportPublicRounds') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('exportPublicRounds').timeBased().everyMinutes(15).create();
  exportPublicRounds();
}
