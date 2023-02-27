
function triggerCheckLogs() {
 createLog();
}

function triggerResetSchedulerLogs() {
  resetSchedulerLogs();
}

function triggerCheckReportPendingLogs() {
  checkReportPendingLogs();
}

function triggerCheckReportInProgressLogs() {
  checkReportInProgressLogs();
}

function syncSlaveFolder(sheetName= 'SlaveDetails') {
  var sheetId = getSheetId();
  Cord4_Script.syncSlaveFolder(sheetId, sheetName)
}

function triggerClearSystemLogs(sheetName= 'SystemLogs') {
  var sheetId = getSheetId();
  Cord4_Script.clearSystemLogs(sheetId, sheetName)
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ss.toast('Loading... Please wait.');

  var menu = [
    {name: "Start Create Logs", functionName: "createSchedulerLogs"},
     null,
     {name: "Reset Daily Logs", functionName: "resetSchedulerLogs"},
     null,
     {name: "Clear System Log Sheet", functionName: "clearSystemLogs"},
     null,
  ];
  ss.addMenu("Manual Logs", menu);

  var menu1 = [{name: "Sync Slave Sheet", functionName: "syncSlaveFolder"}];
  ss.addMenu("Sync Slave Data", menu1);
}

function createSchedulerLogs() {
  try {

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    createLog();

    ss.toast('The Scheduler log is created. You can now close this sheet.', '', -1);
    /*
    ScriptApp.newTrigger('createLog')
    .timeBased()
    .everyHours(1)
    .create();
    */
    return;
  } catch (e) {
    Browser.msgBox(e.toString());
  }
}

function log() {
   var ts = ScriptApp.getProjectTriggers();

  ts.forEach(function(trigger){

    var handlerName = trigger.getHandlerFunction();
     Logger.log(handlerName);
  });
}