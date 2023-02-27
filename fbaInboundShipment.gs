/**
 * Get the Inbound Shipment List from Amazon.
 *
 * @param {string} input the query_type
 * @param {string} input the marketplace_id
 * @param {string} input the shipment_status_list
 * @param {array} input the shipment_id_list
 * @param {string} input the last_updated_after
 * @param {string} input the last_updated_before
 * @param {string} input the next_token
 * @return The Shipment list
 * @customfunction
 */
function getShipments(sDate=null, eDate=null, status_list=null) {

  if(sDate) {
    var startDates = sDate;
  } else {
    var startDates = 60;
  }

  if(eDate) {
    var endDates = eDate;
  } else {
    var endDates = 0;
  }

  var config = JSON.parse(loadCredentials());
  var query_type = 'DATE_RANGE'; // Enum: "SHIPMENT" "DATE_RANGE" "NEXT_TOKEN"
  var marketplace_id = config.defaultMarket;
  if(status_list) {
    var shipment_status_list = status_list;
  } else {
    var shipment_status_list = [ "WORKING", "SHIPPED", "RECEIVING", "CANCELLED", "DELETED", "CLOSED", "ERROR", "IN_TRANSIT", "DELIVERED", "CHECKED_IN"]; // Enum: "WORKING", "SHIPPED", "RECEIVING", "CANCELLED", "DELETED", "CLOSED", "ERROR", "IN_TRANSIT", "DELIVERED", "CHECKED_IN"

  }

  var shipment_id_list = [];

  var currentDate = new Date();
  var endDate = new Date(); var startDate = new Date();
  startDate.setDate(currentDate.getDate()-startDates);
  endDate.setDate(currentDate.getDate()-endDates);

  var last_updated_after = Utilities.formatDate(startDate, "GMT+1", "yyyy-MM-dd");
  var last_updated_before = Utilities.formatDate(endDate, "GMT+1", "yyyy-MM-dd");
  var next_token = null;

  Logger.log("Start Shipments (" + Utilities.formatDate(new Date(last_updated_after), "GMT+1", "MMMM dd, yyyy") + ' to ' + Utilities.formatDate(new Date(last_updated_before), "GMT+1", "MMMM dd, yyyy") + ")")

  return getShipmentFromAmazon(query_type, marketplace_id, shipment_status_list, shipment_id_list, last_updated_after, last_updated_before, next_token);
}

/**
 * Get the Inbound Shipment Items List from Amazon.
 *
 * @param {string} input the query_type
 * @param {string} input the marketplace_id
 * @param {string} input the next_token
 * @return The Shipment items list
 * @customfunction
 */
function getShipmentItems(sDate=null, eDate=null) {

  if(sDate) {
    var startDates = sDate;
  } else {
    var startDates = 1;
  }

  if(eDate) {
    var endDates = eDate;
  } else {
    var endDates = 0;
  }

  var config = JSON.parse(loadCredentials());

  var currentDate = new Date();
  var endDate = new Date(); var startDate = new Date();
  startDate.setDate(currentDate.getDate()-startDates);
  endDate.setDate(currentDate.getDate()-endDates);

  var last_updated_after = Utilities.formatDate(startDate, "GMT+1", "yyyy-MM-dd");
  var last_updated_before = Utilities.formatDate(endDate, "GMT+1", "yyyy-MM-dd");

  var query_type = 'DATE_RANGE'; // Enum: "SHIPMENT" "DATE_RANGE" "NEXT_TOKEN"
  var marketplace_id = config.defaultMarket;
  var next_token = '';

  Logger.log("Start Shipment items (" + Utilities.formatDate(new Date(last_updated_after), "GMT+1", "MMMM dd, yyyy") + ' to ' + Utilities.formatDate(new Date(last_updated_before), "GMT+1", "MMMM dd, yyyy") + ")")

  return getShipmentItemsFromAmazon(query_type, marketplace_id, last_updated_after, last_updated_before, next_token);
}

/**
 * Get the Inbound Shipment by Shipment ID Amazon.
 *
 * @param {string} input the shipment_id
 * @return The Shipment of that shipment id
 * @customfunction
 */
function getShipmentItemsByShipmentId(shipment_id='FBA15GJZ9KMP') {

  var config = JSON.parse(loadCredentials());
  var marketplace_id = config.defaultMarket;

  Logger.log("Start Shipment items by shipment Id (" + shipment_id +")");
  const response =  getShipmentItemsByShipmentIdFromAmazon(shipment_id, marketplace_id);
  Logger.log(response);
  Logger.log('End Shipment items');
}

/**
 * Get the Inbound Shipment List and Shipment Item List from Amazon.
 *
 * @param {string} input the date range
 * @return The Shipment list and shipment items
 * @customfunction
 */
function getShipmentDetails() {

  var shipment_status_list = ["WORKING", "SHIPPED", "RECEIVING", "CANCELLED", "DELETED", "CLOSED", "ERROR", "IN_TRANSIT", "DELIVERED", "CHECKED_IN"]; // Enum: "WORKING", "SHIPPED", "RECEIVING", "CANCELLED", "DELETED", "CLOSED", "ERROR", "IN_TRANSIT", "DELIVERED", "CHECKED_IN"
    const shipmentResponse = getShipments(60, 0, shipment_status_list);
    const shipmentItemResponse = getShipmentItems(60, 0);


    Logger.log('start customize array data');
    var customResponse = [];
    shipmentItemResponse.forEach((itemRow, index) => {

      var filtered = shipmentResponse.filter(function (row) {
        return row.ShipmentId == itemRow.ShipmentId;
      });

      var destinationId = filtered[0]?.DestinationFulfillmentCenterId;
      var shipmentStatus = filtered[0]?.ShipmentStatus
      var shipmentName = filtered[0]?.ShipmentName

      if(shipmentName) {
        var shipmentId = itemRow.ShipmentId;
        var fulfillmentNetworkSKU = itemRow.FulfillmentNetworkSKU;
        var sellerSKU = itemRow.SellerSKU;
        var quantityShipped = itemRow.QuantityShipped;
        var quantityInCase = itemRow.QuantityInCase;
        var quantityReceived = itemRow.QuantityReceived;

        customResponse.push({
          destinationId : destinationId,
          shipmentName : shipmentName,
          shipmentStatus : shipmentStatus,
          shipmentId: shipmentId,
          fulfillmentNetworkSKU: fulfillmentNetworkSKU,
          sellerSKU: sellerSKU,
          quantityShipped: quantityShipped,
          quantityInCase: quantityInCase,
          quantityReceived: quantityReceived,
        });
      }
    });
    //Logger.log(customResponse);
    Logger.log('end customize array data');

    Logger.log('start data inserting into sheet');
    writeShipmentDetailsToSheet(customResponse, 'Shipments');
    Logger.log('end data inserting into sheet');
}

/**
 * Get the Inbound Transport Data from Amazon.
 *
 * @param {array} input shipment id list
 * @return The Shipment Package Details
 * @customfunction
 */
function getTransportDetails(sheetName='Shipments') {

  var config = JSON.parse(loadCredentials());
  var marketplace_id = config.defaultMarket;

  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  Logger.log(sheet.getDataRange().getValues())
  var data = sheet.getDataRange().getValues();
  data.splice(0,2);

  var shipmentidList = data.map(function(row) {
      return row[3];
  });
Logger.log(shipmentidList)
  //var shipmentidList = getShipmentIdInSheet(sheetName);
  var uniqueShipmentIdList = removeDupsValues(shipmentidList);
  //Logger.log(shipmentidList?.length);
  //Logger.log(uniqueShipmentIdList?.length);
  //var uniqueShipmentIdList = ['FBA15GHP7H5M'];

  var customArray = [];
  uniqueShipmentIdList.forEach((shmpId) => {
    Logger.log("Start transport details by shipment Id (" + shmpId +")");

    var response =  getTransportDetailsAPI(shmpId, marketplace_id);
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
          'shipmentId':  shipmentId,
          'isPartnered': isPartnered,
          'shipmentType': shipmentType,
          'carrierName': row.CarrierName,
          'trackingId': row.TrackingId,
          'packageStatus': row.PackageStatus
        });

      });
    }
  });

  var status = writeTransportDataToSheet(customArray, 'TransportDetails');
  Logger.log(status);
  Logger.log('End transport details');
}
