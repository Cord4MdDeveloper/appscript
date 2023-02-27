var sheetQuery =  SheetQuery.sheetQuery;
function checkShipmentItemsPendingLogs(masterSheetId, clientSheetId, sheetName= SYSTEM_LOG_SHEET) {
  var currentDateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  //var masterSheet = SpreadsheetApp.openById(masterSheetId);
  const query = sheetQuery(SpreadsheetApp.openById(masterSheetId))
  .from(sheetName)
  .where((row) => row.EventStatus == 'PENDING'
    && row.EventName == 'shipmentsItems'
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

        if(eventName === 'shipmentsItems') {
          requestShipmentItemsData(config, masterSheetId, clientSheetId, row);
        }
      } catch(e) {
        var msg = 'Something went wrong while inbound shipment items api.'
        Logger.log(msg+': ' + e);
        createErroLogs(masterSheetId, logId, e, msg, retryCount)
      }
    });
  }
}

function requestShipmentItemsData(config, masterSheetId, clientSheetId, row) {
  var startDate = row.StartDate;
  var endDate = row.EndDate;
  var query_type = 'DATE_RANGE'; // Enum: "SHIPMENT" "DATE_RANGE" "NEXT_TOKEN"
  var marketplace_id = config.defaultMarket;
  var last_updated_after = Utilities.formatDate(startDate, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  var last_updated_before = Utilities.formatDate(endDate, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  var next_token = null;

  const apiResponse = getShipmentItemsFromAmazon(config, query_type, marketplace_id, last_updated_after, last_updated_before, next_token);
  //Logger.log(apiResponse)
    saveShipmentItemsData(row, masterSheetId, clientSheetId, apiResponse);
}

function saveShipmentItemsData(row, masterSheetId, clientSheetId, apiResponse) {
  try {
    logId = row.LogId;
    var retryCount = (row.RetryCount + 1);
    sheetName = row.EventName;
    var logDate = Utilities.formatDate(row.StartDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    if(apiResponse) {
      deleteItemsExistingData(sheetName, clientSheetId, logDate);
      Logger.log('Inside Saved data');
      apiResponse.forEach((items, index) => {
        Logger.log(items)
        sheetQuery(SpreadsheetApp.openById(clientSheetId))
        .from(sheetName)
        .insertRows([
          {
            //ID: getLastRows(SHIPMENT_SHEET),
            LogId: logId,
            LogDate: logDate,
            ShipmentId: items.ShipmentId,
            FulfillmentNetworkSKU: items.FulfillmentNetworkSKU,
            SellerSKU: items.SellerSKU,
            QuantityShipped: items.QuantityShipped,
            QuantityReceived: items.QuantityReceived,
            QuantityInCase: items.QuantityInCase,
            //LastUpdated: Utilities.formatDate(row.StartDate, getGMT(), "yyyy-MM-dd"),
          }
        ]);
      });
    }

    var masterSheet = SpreadsheetApp.openById(masterSheetId);
    sheetQuery(masterSheet)
    .from(SYSTEM_LOG_SHEET)
    .where((rows) => rows.LogId === logId)
    .updateRows((row) => {
      row.EventStatus = 'DONE';
      row.RetryCount =  retryCount;
      row.IsDone = 1;
      row.LastExecutionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      row.UpdatedAt = getCurrentDate();
    });
    Logger.log('Shipment items DONE ');
  } catch(e) {
    Logger.log('Error while saving shipment items : ' + e);
  }

}

function deleteItemsExistingData(sheetName, clientSheetId, logDate) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (null == sheet) {

        Logger.log('Sheet: '+sheetName+' is not available. Creating a new sheet.');
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
        sheet.setName(sheetName);


        var header = [["LogId", "LogDate", "ShipmentId", "FulfillmentNetworkSKU", "SellerSKU", "QuantityShipped", "QuantityReceived", "QuantityInCase"]];
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
