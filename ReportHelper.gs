var sheetQuery =  SheetQuery.sheetQuery;
function checkReportPendingLogs(clientSheetId, sheetName= SYSTEM_LOG_SHEET) {

  var currentDateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const query = sheetQuery(SpreadsheetApp.openById(clientSheetId))
  .from(sheetName)
  .where((row) =>  row.EventStatus == 'PENDING'
    && (row.EventType == 'Inventory_Report' || row.EventType == 'Performance_Report' || row.EventType == 'Order_tracking_Report')
    && Utilities.formatDate(new Date(row.EndDate), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") <= currentDateTime
  );
  var values = query.getRows();
  if(values) {
    values.reverse().length = 1;
    values.forEach((row) => {

      var logId = row.LogId;
      var retryCount = (row.RetryCount + 1);
      Logger.log('Log ID - ' + logId);
      try {
        var response = checkLastExecutionTime(20, 1);
        if(response === true) {
          var eventName = row.EventName;
          var eventType = row.EventType;
          var systemProcessId = row.SystemProcessId;
          var credntialId = row.Credentials;
          var config = loadCredentials(clientSheetId, credntialId);
          if(eventType === 'Inventory_Report'  || eventType == 'Performance_Report' || eventType == 'Order_tracking_Report') {
            requestReportData(config, clientSheetId, row);
          }
          Logger.log('Report request DONE.');

        }
      } catch(e) {
        var msg = 'Something went wrong while report request.'
        Logger.log(msg+': ' + e);
        createErroLogs(clientSheetId, logId, e, msg, retryCount)
      }
    });
  }
}

function checkReportInProgressLogs(clientSheetId, sheetName= SYSTEM_LOG_SHEET) {

  const query = sheetQuery(SpreadsheetApp.openById(clientSheetId))
  .from(sheetName)
  .where((row) => row.EventStatus == 'IN_PROGRESS'
    && (row.EventType == 'Inventory_Report' || row.EventType == 'Performance_Report' || row.EventType == 'Order_tracking_Report')
    && row.IsDone == 0
  );
  var values = query.getRows();
  if(values) {
    values.reverse().length = 2;
    values.forEach((row) => {

      var logId = row.LogId;
      Logger.log('Log ID - ' + logId);
      var retryCount = (row.RetryCount + 1);
      try {
        var response = checkLastExecutionTime(20, 1);
        if(response === true) {
          var sheetName = row.EventName;
          var eventType = row.EventType;
          var systemProcessId = row.SystemProcessId;
          var credntialId = row.Credentials;
          var slaveSheetName = row.SlaveSheetName;

          const salveSheetDetails = sheetQuery(SpreadsheetApp.openById(clientSheetId))
          .from('SlaveDetails')
          .where((row) => row.SheetName == slaveSheetName);
          var slaveSheetID = salveSheetDetails.getRows()[0]?.SheetID;

          var config = loadCredentials(clientSheetId, credntialId);
          if(eventType === 'Inventory_Report'  || eventType == 'Performance_Report'  || eventType == 'Order_tracking_Report') {
            requestInProgressReportData(config, clientSheetId, row, slaveSheetID, sheetName);
          }
          Logger.log('Report in progress request complete.');
        }
      } catch(e) {
        var msg = 'Something went wrong while report download.'
        Logger.log(msg+': ' + e);
        createErroLogs(clientSheetId, logId, e, msg, retryCount)
      }
    });
  }
}


