var sheetQuery =  SheetQuery.sheetQuery;
function checkGetTransportPendingLogs(masterSheetId, clientSheetId, sheetName= SYSTEM_LOG_SHEET) {
  try {
    var currentDateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    var masterSheet = SpreadsheetApp.openById(masterSheetId);
    const query = sheetQuery(masterSheet)
    .from(sheetName)
    .where((row) => row.EventStatus == 'PENDING'
      && row.EventName == 'getTransportDetails'
    );
    var values = query.getRows();
    if(values) {
      values.reverse().length = 2;
      values.forEach((row) => {
        var logId = row.LogId;
        var dependentLog = row.DependentLog;
        Logger.log('Log ID - ' + logId);
        const checkMasterData = sheetQuery(SpreadsheetApp.openById(masterSheetId))
        .from(sheetName)
        .where((rows) =>
            rows.EventStatus === 'DONE'
          && rows.LogId == dependentLog
          && rows.EventName == 'shipmentsItems'
        );
        var masterData = checkMasterData.getRows();
        Logger.log(masterData)
        if(masterData.length > 0) {
          Logger.log('Dependent Log ID - ' + dependentLog);
          var eventName = row.EventName;
          var systemProcessId = row.SystemProcessId;
          var credntialId = row.Credentials;
          var config = loadCredentials(masterSheetId, credntialId);

          if(eventName === 'getTransportDetails') {
            requestTransportData(config, masterSheetId, clientSheetId, row, masterData);
          }
        } else {
          Logger.log('Dependent log is pending: ' + dependentLog);
        }

      });
    }
  } catch(e) {
    Logger.log(e);
  }
}

function requestTransportData(config, masterSheetId, clientSheetId, row, masterData) {

  var marketplace_id = config.defaultMarket;
  var logId = row.LogId;
  var startDate = Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var endDate = Utilities.formatDate(row.EndDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var dependentLog = row.DependentLog;
  var sheetName = row.EventName;
  var dependentSheetName = masterData[0]?.EventName;
Logger.log(dependentSheetName)
  const masterShipmentData = sheetQuery(SpreadsheetApp.openById(clientSheetId))
  //.select('ShipmentId')
  .from(dependentSheetName)
  .where((rows) =>
    rows.LogId == dependentLog
    //Utilities.formatDate(new Date(rows.LogDate), Session.getScriptTimeZone(), "yyyy-MM-dd") >= startDate
    //&& Utilities.formatDate(new Date(rows.LogDate), Session.getScriptTimeZone(), "yyyy-MM-dd") <= endDate
  );
  var dependentData = masterShipmentData.getRows();
  var uniqueShipmenIdData = getUniqueShipmentList(dependentData);
  var customArray = [];
  uniqueShipmenIdData.forEach((shmpId) => {
    var response =  getTransportDetailsAPI(config, shmpId, marketplace_id);
    if(response) {
      const data = JSON.parse(response);

      const payload = data.payload;
      const header = payload.TransportContent.TransportHeader;
      const details = payload.TransportContent.TransportDetails;

      var shipmentType =  header.ShipmentType;
      var shipmentId =  header.ShipmentId;


      var isPartneredSmallParcel = details.PartneredSmallParcelData?.PackageList;
      var isNonePartneredSmallParcel = details.NonPartneredSmallParcelData?.PackageList;

      if(isPartneredSmallParcel) {
        var isPartnered = 'TRUE';
        var packageList = isPartneredSmallParcel;
      } else if (isNonePartneredSmallParcel) {
        var isPartnered = 'FALSE';
        var packageList = isNonePartneredSmallParcel;
      } else if (shipmentType == 'LTL' && isPartnered == true) {
        var isPartnered =  'TRUE';
          var packageList = [];
      } else if (shipmentType == 'LTL' && isPartnered == false) {
        var isPartnered = 'FALSE';
          var packageList = [];
      } else {
        var packageList = [];
      }

      packageList.forEach((row, index) => {

        customArray.push({
          'LogId':  logId,
          'LogDate':  endDate,
          'ShipmentId':  shipmentId,
          'isPartnered': isPartnered,
          'ShipmentType': shipmentType,
          'CarrierName': row.CarrierName,
          'TrackingId': row.TrackingId,
          'PackageStatus': row.PackageStatus
        });

      });
    }
  });

  saveTransportData(row,  masterSheetId, clientSheetId, customArray);
  Logger.log('End transport details');
}


function saveTransportData(row,  masterSheetId, clientSheetId,  customArray) {
  try {
    logId = row.LogId;
    sheetName = row.EventName;
    var logDate = Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    if(customArray) {

      deleteTransportExistingData(sheetName, clientSheetId, logDate);
      Logger.log(customArray)
      Logger.log('Inside Saved data');
      customArray.forEach((items, index) => {
        //Logger.log(items)
        sheetQuery(SpreadsheetApp.openById(clientSheetId))
        .from(sheetName)
        .insertRows([
          {
            //ID: getLastRows(SHIPMENT_SHEET),
            LogId: logId,
            LogDate: logDate,
            ShipmentId: items.ShipmentId,
            isPartnered: items.isPartnered,
            ShipmentType: items.ShipmentType,
            CarrierName: items.CarrierName,
            TrackingId: items.TrackingId,
            PackageStatus: items.PackageStatus
          }
        ]);
      });
    }

    //var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
    sheetQuery(SpreadsheetApp.openById(masterSheetId))
    .from(SYSTEM_LOG_SHEET)
    .where((rows) => rows.LogId === logId)
    .updateRows((row) => {
      row.EventStatus = 'DONE';
      row.IsDone = 1;
      row.LastExecutionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      row.UpdatedAt = getCurrentDate();
    });
    Logger.log('Transport DONE ');
  } catch(e) {
    Logger.log('Error while saving transport api : ' + e);
  }

}

function deleteTransportExistingData(sheetName, clientSheetId, logDate) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (null == sheet) {

        Logger.log('Sheet: '+sheetName+' is not available. Creating a new sheet.');
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
        sheet.setName(sheetName);


        var header = [["LogId", "LogDate", "ShipmentId", "isPartnered", "ShipmentType", "CarrierName", "TrackingId", "PackageStatus"]];
        var cols = header[0].length;
        sheet.getRange(1, 1, 1, cols).setValues(header);
    } else {
      sheetQuery(SpreadsheetApp.openById(clientSheetId))
      .from(sheetName)
      .where((row) => Utilities.formatDate(new Date(row.LogDate), Session.getScriptTimeZone(), "yyyy-MM-dd") === logDate)
      .deleteRows();
    }
    return true;
  } catch (e) {
    Logger.log(e)
  }

}


function getUniqueShipmentList(array) {
  var dupes = [];
  var result = [];
  array.forEach((entry) => {
    if (!dupes[entry.ShipmentId]) {
        dupes[entry.ShipmentId] = true;
        result.push(entry.ShipmentId);
    }
  });
  return result;
}
