function checkLastExecutionTime(lastRecord=20, minMinutes=5) {
  var currentDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  //var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
  var c = sheetQuery()
  .from(SYSTEM_LOG_SHEET)
  .where((row) => Utilities.formatDate(new Date(row.LastExecutionTime), Session.getScriptTimeZone(), "yyyy-MM-dd") === currentDate);
  //.where((rows) => rows.LogId == logId);
  var logData =  c.getRows();
  logData.reverse().length = lastRecord;
  var status = true;
  if(logData) {
     var currentTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

     logData.forEach((row, index) => {

      var lastExectionTime = row.LastExecutionTime;
      if(lastExectionTime) {
        var lastExectionTime = Utilities.formatDate(lastExectionTime, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

        // get milliseconds
        start_actual_time = new Date(lastExectionTime);
        end_actual_time = new Date(currentTime);
        var diff = end_actual_time - start_actual_time;

        var diffDays = Math.floor(diff / 86400000); // days
        var diffHrs = Math.floor((diff % 86400000) / 3600000); // hours
        var hourMutiply = (diffHrs * 60);
        var minutes = Math.round(((diff % 86400000) % 3600000) / 60000) + hourMutiply; // minutes

        if(minutes < minMinutes) {
            Logger.log('last execution time : ' + start_actual_time);
            Logger.log('current time : ' + end_actual_time);
            Logger.log('Please wait ... ' + (minMinutes - minutes ) + ' Minutes (Throttle minutes:' + minMinutes +')')
            return status = false;
        }
      }
    })
  }
  //var status = ({'status': true, lastExectionTime: ''});
  return status;
}

function updateStatusMasterFile(logId, status) {
   var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
    sheetQuery(masterSheet)
    .from(SYSTEM_LOG_SHEET)
    .where((rows) => rows.LogId === logId)
    .updateRows((row) => {
      row.EventStatus = status;
      row.UpdatedAt = getCurrentDate();
    });
  return true;
}

function getClientSheetID() {
 try {
    /*
    var query = SheetQuery.sheetQuery()
    .from('MasterSheet');
    //Logger.log(mastersheetId = query.getRows()?.[0]?.MasterSheetID);
    return mastersheetId = query.getRows()?.[0]?.MasterSheetID;
    */
    return CLIENT_SHEET_ID;
  } catch (e) {
      Logger.log('Client sheet id not set!')
  }
}

function getMasterSheetID() {
  try {
    /*
    var query = SheetQuery.sheetQuery()
    .from('MasterSheet');
    //Logger.log(mastersheetId = query.getRows()?.[0]?.MasterSheetID);
    return mastersheetId = query.getRows()?.[0]?.MasterSheetID;
    */
    return MASTER_SHEET_ID;
  } catch (e) {
      Logger.log('Master sheet id not set!')
  }
}
