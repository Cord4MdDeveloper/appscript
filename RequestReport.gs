var sheetQuery =  SheetQuery.sheetQuery;
function requestReportData(config, clientSheetId, row) {
  var logId = row.LogId;
  var reportType = row.EventName;
  var startDate = Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  var endDate = Utilities.formatDate(row.EndDate, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  var reportId = requestReport(config, reportType, startDate, endDate);


  var eventDetailsJSON = '';
  if(reportId) {
    var eventDetails =   ({
      'startDate' : startDate,
      'endDate' : endDate,
      'reportId' : reportId,
    });
    var eventDetailsJSON = JSON.stringify(eventDetails);
    var retryCount = (row.RetryCount + 1)
    //var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
    sheetQuery(SpreadsheetApp.openById(clientSheetId))
    .from(SYSTEM_LOG_SHEET)
    .where((rows) => rows.LogId === logId)
    .updateRows((row) => {
      row.EventDetails = eventDetailsJSON;
      row.EventStatus = 'IN_PROGRESS';
      row.RetryCount =  retryCount;
      row.UpdatedAt = getCurrentDate();
      row.LastExecutionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    });
  }
  return reportId;
}

function requestInProgressReportData(config, clientSheetId, row, slaveSheetID, sheetName) {
  //var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
  var logId = row.LogId;
  var logDate =  Utilities.formatDate(row.EndDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  Logger.log('Log Date: ' + logDate)
  var downloadType = row.DownloadType;
  var eventDetails = JSON.parse(row.EventDetails);
  var reportId = eventDetails.reportId;
  var response = checkReportStatus(config, reportId);
  var data = JSON.parse(response);
  if (data.processingStatus === 'DONE' && data.reportDocumentId !== '') {

        Logger.log('Report status is: ' + data.processingStatus);

        /*--------------- Download Reports ------------*/
        var reportDocumentId = data.reportDocumentId;
        var credntialId = row.Credentials;
        //var config = loadCredentials(clientSheetId, credntialId);
        Logger.log('Report download request reportDocumentId is: ' + reportDocumentId);
        downloadReport(config, clientSheetId, logDate, reportDocumentId, slaveSheetID, sheetName, downloadType);

        /*--------------- Status DONE ------------*/
        sheetQuery(SpreadsheetApp.openById(clientSheetId))
        .from(SYSTEM_LOG_SHEET)
        .where((rows) => rows.LogId === logId)
        .updateRows((row) => {
          row.EventDetails = response;
          row.EventStatus = data.processingStatus;
          row.IsDone = 1;
          row.UpdatedAt = getCurrentDate();
          row.LastExecutionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
        });

  } else if (data.processingStatus === 'CANCELLED' || data.processingStatus === 'FATAL') {

      Logger.log('Report status is: ' + data.processingStatus);
      sheetQuery(SpreadsheetApp.openById(clientSheetId))
        .from(SYSTEM_LOG_SHEET)
        .where((rows) => rows.LogId === logId)
        .updateRows((row) => {
          row.EventDetails = response;
          row.EventStatus = data.processingStatus;
          row.UpdatedAt = getCurrentDate();
          row.LastExecutionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
        });

  } else {
      Logger.log('Report is still not ready and the report status is: ' + data.processingStatus);
  }
}

