var sheetQuery =  SheetQuery.sheetQuery;
function createLog(clinetSheetId, sheetName= 'Scheduler') {

  Logger.log('Logs Call');
  const query = sheetQuery(SpreadsheetApp.openById(clinetSheetId))
  .from(sheetName)
  .where((row) => row.EventProcessType === 'SP_API');
  var rows = query.getRows();
  rows.sort(function(a, b) {
      return a['IsDependent'] - b['IsDependent'];
  });

  rows.forEach((row) => {

    var frequencyStatus = row.FrequencyStatus;
    var previousStatus = row.PreviousStatus;
    var updateDailyStatus = row.UpdateDailyStatus;
    var slaveSheetName = row.SlaveSheetName;

    if(slaveSheetName) {
      if(frequencyStatus === 'PENDING') {
        Logger.log('Inside Frequency Log');
         saveFrequencyLogs(row, clinetSheetId, sheetName);
      }

      if(previousStatus === 'PENDING') {
        Logger.log('Inside Previous Log');
        savePreviousLogs(row, clinetSheetId, sheetName);
      }

      if(updateDailyStatus === 'PENDING') {
        Logger.log('Inside daily Log');
        saveDailyLogs(row, clinetSheetId, sheetName);
      }
    } else {
      Logger.log('Slave Sheet name is not added!');
    }
  });
}

function checkDependentLogs(clinetSheetId, sheetName, isDependent, startDate, endDate) {
   var dependetCheck = sheetQuery(SpreadsheetApp.openById(clinetSheetId))
    .from(SYSTEM_LOG_SHEET)
    .where((row) => row.EventName === isDependent
    && Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") === startDate
    && Utilities.formatDate(row.EndDate, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") === endDate);
  return dependetCheck.getRows()?.[0]?.LogId;
}

function saveFrequencyLogs(row, clinetSheetId, sheetName) {
  try {
    var schedulerID = row.SystemProcessId;
    Logger.log('schedulerID ' + schedulerID);
    /*---------------- UPDATE IN_PROGRESS STAUS ----------------------*/
    sheetQuery(SpreadsheetApp.openById(clinetSheetId))
    .from(sheetName)
    .where((row) => row.SystemProcessId === schedulerID)
    .updateRows((row) => {
      row.FrequencyStatus = (row.DailyFrequency) ? 'IN_PROGRESS' : 'DONE';
      row.LastUpdated = getCurrentDate();
    });

    var eventType = row.EventType;
    var eventName = row.EventName;
    var eventProcessType = row.EventProcessType;
    var marketplace = row.Marketplace;
    var slaveSheetName = row.SlaveSheetName;
    var downloadType = row.DownloadType;
    var isDependent = row.IsDependent;

    /*---------------- CHECK SP API CREDENTIAL  ----------------------*/
    const spApiCredentials = sheetQuery(SpreadsheetApp.openById(clinetSheetId))
    .from('Credentials')
    .where((row) => row.defaultMarket == marketplace);
    if(spApiCredentials) {
      spApiCredentials.getRows().forEach((credential) =>  {

        var credentialId = credential.credentialId;
        var dailyFrequency = row.DailyFrequency;
        var dailyFrequencyArray = (dailyFrequency) ? dailyFrequency.split(',') : '';
        if(dailyFrequencyArray) {
          /*---------------- DATERANGE DATA INSERT  ----------------------*/
          dailyFrequencyArray.forEach((times) => {
            var time = times.replace(/\s/g, "");

            var currentDate = new Date();
            var endDate = new Date();
            var startDate = new Date();
            if(eventName == 'GET_LEDGER_SUMMARY_VIEW_DATA') {
              startDate.setDate(currentDate.getDate()-2);
              endDate.setDate(currentDate.getDate()-2);
            }

            var startDate = Utilities.formatDate(startDate, Session.getScriptTimeZone(), "yyyy-MM-dd" + " 00:00:00");
            var endDate = Utilities.formatDate(endDate, Session.getScriptTimeZone(), "yyyy-MM-dd " +time+":59");

            var logId = checkDependentLogs(clinetSheetId, sheetName, isDependent, startDate, endDate);
            if(isDependent !== '' && logId == null) {
                  Logger.log('Skip Logs dependent log id not found ' + schedulerID);
            } else {
              var lastRow =  getLastRows('SystemLogs');
              sheetQuery(SpreadsheetApp.openById(clinetSheetId))
              .from('SystemLogs')
              .insertRows([
                {
                  LogId: lastRow,
                  LogCreatedDate: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
                  SystemProcessId: schedulerID,
                  StartDate: startDate,
                  EndDate: endDate,
                  LogStatus: 'PENDING',
                  EventProcessType: eventProcessType,
                  EventName: eventName,
                  EventType: eventType,
                  DependentLog: logId,
                  EventStatus: 'PENDING',
                  Priority: 1,
                  IsDone: '0',
                  RetryCount: '0',
                  Marketplace: marketplace,
                  UpdatedAt: getCurrentDate(),
                  Credentials: credentialId,
                  LogType: 'DailyFrequency',
                  SlaveSheetName: slaveSheetName,
                  DownloadType: downloadType,
                }
              ]);
              Logger.log('Save Logs schedulerID ' + schedulerID);
            }

          });

        }
      });
      /*---------------- UPDATE DONE STAUS ----------------------*/
      sheetQuery(SpreadsheetApp.openById(clinetSheetId))
      .from(sheetName)
      .where((row) => row.SystemProcessId === schedulerID)
      .updateRows((row) => {
        row.FrequencyStatus = 'DONE';
        row.LastUpdated = getCurrentDate();
      });
      Logger.log('Update Status schedulerID ' + schedulerID);
    } else {
      Logger.log('User credentials not found.');
    }
  } catch (e) {
    Logger.log('Error while getting save frequncy logs:' + e);
    throw new Error('Error while getting save frequncy logs:' +e);
  }
}

function saveDailyLogs(row, clinetSheetId, sheetName) {
  try {
    var schedulerID = row.SystemProcessId;
    Logger.log('schedulerID ' + schedulerID);
    /*---------------- UPDATE IN_PROGRESS STAUS ----------------------*/
    sheetQuery(SpreadsheetApp.openById(clinetSheetId))
    .from(sheetName)
    .where((row) => row.SystemProcessId === schedulerID)
    .updateRows((row) => {
      row.UpdateDailyStatus = (row.UpdateDailyDays) ? 'IN_PROGRESS' : 'DONE';
      row.LastUpdated = getCurrentDate();
    });

    var eventType = row.EventType;
    var eventName = row.EventName;
    var eventProcessType = row.EventProcessType;
    var marketplace = row.Marketplace;
    var slaveSheetName = row.SlaveSheetName;
    var downloadType = row.DownloadType;
    var isDependent = row.IsDependent;

    /*---------------- CHECK SP API CREDENTIAL  ----------------------*/
    const spApiCredentials = sheetQuery(SpreadsheetApp.openById(clinetSheetId))
    .from('Credentials')
    .where((row) => row.defaultMarket == marketplace);
    if(spApiCredentials) {
      spApiCredentials.getRows().forEach((credential) =>  {
        var credentialId = credential.credentialId;
        if(eventName == 'GET_LEDGER_SUMMARY_VIEW_DATA' || eventName == 'GET_LEDGER_DETAIL_VIEW_DATA') {
          var sDate =  (3- row.UpdateDailyDays);
          var eDate = (2- row.UpdateDailyDays);
        } else {
          var sDate =  row.UpdateDailyDays;
          var eDate = 0;
        }
        /*---------------- DATERANGE DATA INSERT  ----------------------*/
        var dateRangeList = getDatesRange(sDate, eDate);
        Logger.log(dateRangeList)
        dateRangeList.forEach((date) => {
          var startDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd" + " 00:00:00");
          var endDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd" + " 23:59:59");

          var logId = checkDependentLogs(clinetSheetId, sheetName, isDependent, startDate, endDate);
          if(isDependent !== '' && logId == null) {
                Logger.log('Skip Logs dependent log id not found ' + schedulerID);
          } else {
            var lastRow =  getLastRows('SystemLogs');
            sheetQuery(SpreadsheetApp.openById(clinetSheetId))
            .from('SystemLogs')
            .insertRows([
              {
                LogId: lastRow,
                LogCreatedDate: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
                SystemProcessId: schedulerID,
                StartDate: startDate,
                EndDate: endDate,
                LogStatus: 'PENDING',
                EventProcessType: eventProcessType,
                EventName: eventName,
                EventType: eventType,
                DependentLog: logId,
                EventStatus: 'PENDING',
                Priority: 1,
                IsDone: '0',
                RetryCount: '0',
                Marketplace: marketplace,
                UpdatedAt: getCurrentDate(),
                Credentials: credentialId,
                LogType: 'UpdateDailyDays',
                SlaveSheetName: slaveSheetName,
                DownloadType: downloadType,
              }
            ]);
            Logger.log('Save Logs schedulerID ' + schedulerID);
          }
        });
      });

      /*---------------- UPDATE DONE STAUS ----------------------*/
      sheetQuery(SpreadsheetApp.openById(clinetSheetId))
      .from(sheetName)
      .where((row) => row.SystemProcessId === schedulerID)
      .updateRows((row) => {
        row.UpdateDailyStatus = 'DONE';
        row.LastUpdated = getCurrentDate();
      });
      Logger.log('Update Status schedulerID ' + schedulerID);
    } else {
      Logger.log('User credentials not found.');
    }
  } catch (e) {
    Logger.log('Error while getting save daily logs:' + e);
    throw new Error('Error while getting save daily logs:' +e);
  }
}

function savePreviousLogs(row, clinetSheetId, sheetName) {
  try {
      var schedulerID = row.SystemProcessId;
      Logger.log('schedulerID ' + schedulerID);
      /*---------------- UPDATE IN_PROGRESS STAUS ----------------------*/
      sheetQuery(SpreadsheetApp.openById(clinetSheetId))
      .from(sheetName)
      .where((row) => row.SystemProcessId === schedulerID)
      .updateRows((row) => {
        row.PreviousStatus = (row.PreviousDays) ? 'IN_PROGRESS' : 'DONE';
        row.LastUpdated = getCurrentDate();
      });

      var eventProcessType = row.EventProcessType;
      var eventName = row.EventName;
      var eventType = row.EventType;
      var marketplace = row.Marketplace;
      var slaveSheetName = row.SlaveSheetName;
      var downloadType = row.DownloadType;
      var isDependent = row.IsDependent;

      /*---------------- CHECK SP API CREDENTIAL  ----------------------*/
      const spApiCredentials = sheetQuery(SpreadsheetApp.openById(clinetSheetId))
      .from('Credentials')
      .where((row) => row.defaultMarket == marketplace);
      if(spApiCredentials) {
        spApiCredentials.getRows().forEach((credential) =>  {
        var credentialId = credential.credentialId;
        var sDate =  row.PreviousDays;
        var eDate = 0;

        /*---------------- DATERANGE DATA INSERT  ----------------------*/
        var dateRangeList = getDatesRange(sDate, eDate);
        dateRangeList.forEach((date) => {
          var startDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd" + " 00:00:00");
          var endDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd" + " 23:59:59");

          var logId = checkDependentLogs(clinetSheetId, sheetName, isDependent, startDate, endDate);
          if(isDependent !== '' && logId == null) {
                Logger.log('Skip Logs dependent log id not found ' + schedulerID);
          } else {
            var lastRow =  getLastRows('SystemLogs');
            sheetQuery(SpreadsheetApp.openById(clinetSheetId))
            .from('SystemLogs')
            .insertRows([
              {
                LogId: lastRow,
                LogCreatedDate: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
                SystemProcessId: schedulerID,
                StartDate: startDate,
                EndDate: endDate,
                LogStatus: 'PENDING',
                EventProcessType: eventProcessType,
                EventName: eventName,
                EventType: eventType,
                DependentLog: logId,
                EventStatus: 'PENDING',
                Priority: 1,
                IsDone: '0',
                RetryCount: '0',
                Marketplace: marketplace,
                UpdatedAt: getCurrentDate(),
                Credentials: credentialId,
                LogType: 'PreviousDays',
                SlaveSheetName: slaveSheetName,
                DownloadType: downloadType,
              }
            ]);
            Logger.log('Save Logs schedulerID ' + schedulerID);
          }
        });
      });

      /*---------------- UPDATE DONE STAUS ----------------------*/
      sheetQuery(SpreadsheetApp.openById(clinetSheetId))
      .from(sheetName)
      .where((row) => row.SystemProcessId === schedulerID)
      .updateRows((row) => {
        row.PreviousStatus = 'DONE';
        row.LastUpdated = getCurrentDate();
      });
      Logger.log('Update Status schedulerID ' + schedulerID);
    } else {
      Logger.log('User credentials not found.');
    }

  } catch (e) {
    Logger.log('Error while getting save previous logs:' + e);
    throw new Error('Error while getting save previous logs:' +e);
  }
}

  /*
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName),
        arrayOfArrays = sheet.getDataRange().getValues(),
        dimensions = {
            rowCount: Math.floor(arrayOfArrays.length),
            colCount: Math.floor(arrayOfArrays[0].length)
        },
        targetRng;

  var customResponse = [];
  if(arrayOfArrays?.length > 0) {
    headerrow = arrayOfArrays[0];
    arrayOfArrays.forEach((row, index) => {
       if(index > 0) {

         customResponse.push({
           [headerrow[0]]: row[0],
           [headerrow[1]]: row[1],
           [headerrow[2]]: row[2],
           [headerrow[3]]: row[3],
           [headerrow[4]]: row[4],
           [headerrow[5]]: row[5],
           [headerrow[6]]: row[6],
           [headerrow[7]]: row[7],
           [headerrow[8]]: row[8],
           [headerrow[9]]: row[9],
           [headerrow[10]]: row[10],
           [headerrow[11]]: row[11],
         })
       }
    });
  }
  //Logger.log(customResponse)
  */