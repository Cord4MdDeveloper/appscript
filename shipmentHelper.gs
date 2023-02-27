var sheetQuery =  SheetQuery.sheetQuery;
function checkShipmentPendingLogs(masterSheetId, clientSheetId, sheetName= SYSTEM_LOG_SHEET) {
  var currentDateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const query = sheetQuery(SpreadsheetApp.openById(masterSheetId))
  .from(sheetName)
  .where((row) => row.EventStatus == 'PENDING'
    && row.EventName == 'shipments'
    && Utilities.formatDate(new Date(row.EndDate), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") <= currentDateTime
  );
  var values = query.getRows();
  if(values) {
    values.reverse().length = 2;
    values.forEach((row) => {
      var logId = row.LogId;
      var retryCount = (row.RetryCount + 1);
      Logger.log('Log ID - ' + logId);
      try {
        var eventName = row.EventName;
        var systemProcessId = row.SystemProcessId;
        var credntialId = row.Credentials;
        var config = loadCredentials(masterSheetId, credntialId);
        Logger.log(config)
        if(eventName === 'shipments') {
          requestShipmentData(config, masterSheetId, clientSheetId, row);
        }
      } catch(e) {
        var msg = 'Something went wrong while inbound shipment api.'
        Logger.log(msg+': ' + e);
        createErroLogs(masterSheetId, logId, e, msg, retryCount)
      }
    });
  }
}

function requestShipmentData(config, masterSheetId, clientSheetId, row) {  Logger.log(1)
  var startDate = row.StartDate;
  var endDate = row.EndDate;
  var shipment_id_list = null;
  var query_type = 'DATE_RANGE'; // Enum: "SHIPMENT" "DATE_RANGE" "NEXT_TOKEN"
  var marketplace_id = config.defaultMarket;
  var shipment_status_list = ["WORKING", "SHIPPED", "RECEIVING", "CANCELLED", "DELETED", "CLOSED", "ERROR", "IN_TRANSIT", "DELIVERED", "CHECKED_IN"];
  var last_updated_after = Utilities.formatDate(startDate, getGMT(), "yyyy-MM-dd'T'HH:mm:ss");
  var last_updated_before = Utilities.formatDate(endDate, getGMT(), "yyyy-MM-dd'T'HH:mm:ss");
  var next_token = null;

  const apiResponse = getShipmentFromAmazon(config, query_type, marketplace_id, shipment_status_list, shipment_id_list, last_updated_after, last_updated_before, next_token);
      saveShipmentData(row, masterSheetId, clientSheetId, apiResponse);
}

function saveShipmentData(row, masterSheetId, clientSheetId, apiResponse) {
  try {
    logId = row.LogId;
    var retryCount = (row.RetryCount + 1);
    sheetName = row.EventName;
    var logDate = Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    if(apiResponse) {

      deleteExistingData(sheetName, clientSheetId, logDate);
      Logger.log(apiResponse)
      Logger.log('Inside Saved data');
      apiResponse.forEach((items, index) => {
        //Logger.log(items)
        sheetQuery(SpreadsheetApp.openById(clientSheetId))
        .from(sheetName)
        .insertRows([
          {
            //ID: getLastRows(SHIPMENT_SHEET),
            LogId: logId,
            LogDate: logDate,
            DestinationFulfillmentCenterId: items.DestinationFulfillmentCenterId,
            ShipmentName: items.ShipmentName,
            ShipmentStatus: items.ShipmentStatus,
            ShipmentId: items.ShipmentId,
            LabelPrepType: items.LabelPrepType,
            LastUpdated: Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
          }
        ]);
      });
    }

    //var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
    sheetQuery(SpreadsheetApp.openById(masterSheetId))
    .from(SYSTEM_LOG_SHEET)
    .where((rows) => rows.LogId === logId)
    .updateRows((row) => {
      row.RetryCount =  retryCount;
      row.EventStatus = 'DONE';
      row.IsDone = 1;
      row.LastExecutionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      row.UpdatedAt = getCurrentDate();
    });
    Logger.log('Shipment DONE ');
  } catch(e) {
    Logger.log('Error while saving shipment : ' + e);
  }

}

function deleteExistingData(sheetName, clientSheetId, logDate) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (null == sheet) {

        Logger.log('Sheet: '+sheetName+' is not available. Creating a new sheet.');
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
        sheet.setName(sheetName);


        var header = [["LogId", "LogDate", "DestinationFulfillmentCenterId", "ShipmentName", "ShipmentStatus", "ShipmentId", "LabelPrepType", "LastUpdated"]];
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
