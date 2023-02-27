function writeShipmentDetailsToSheet(result, sheetName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    sheet.clear();

    const headerRow = 2;
    sheet.getRange(headerRow, 1).setValue('DestinationFulfillmentCenterId').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 2).setValue('ShipmentName').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 3).setValue('ShipmentStatus').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 4).setValue('ShipmentId').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 5).setValue('FulfillmentNetworkSKU').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 6).setValue('SellerSKU').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 7).setValue('QuantityShipped').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 8).setValue('QuantityInCase').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 9).setValue('QuantityReceived').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 10).setValue('LastUpdated').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 11).setValue('ReceivedDate').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());

    result.forEach((e, dataRow) => {
      const rowNumber = dataRow + 3;
      sheet.getRange(rowNumber, 1).setValue(e.destinationId);
      sheet.getRange(rowNumber, 2).setValue(e.shipmentName);
      sheet.getRange(rowNumber, 3).setValue(e.shipmentStatus);
      sheet.getRange(rowNumber, 4).setValue(e.shipmentId);
      sheet.getRange(rowNumber, 5).setValue(e.fulfillmentNetworkSKU);
      sheet.getRange(rowNumber, 6).setValue(e.sellerSKU);
      sheet.getRange(rowNumber, 7).setValue(e.quantityShipped);
      sheet.getRange(rowNumber, 8).setValue(e.quantityInCase);
      sheet.getRange(rowNumber, 9).setValue(e.quantityReceived);
      sheet.getRange(rowNumber, 10).setValue('');
      sheet.getRange(rowNumber, 11).setValue('');
    });

    sheet.setFrozenRows(2);
    var mergeRange = sheet.getRange(1, 1, 1, 9);
    mergeRange.mergeAcross();
    mergeRange.setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    mergeRange.setValue('Last synced: ' + new Date());
    sheet.getRange(2, 1, 1, 5).setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).build());
}

function writeTransportDataToSheet(result, sheetName) {
   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    sheet.clear();

    const headerRow = 2;
    sheet.getRange(headerRow, 1).setValue('ShipmentId').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 2).setValue('isPartnered').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 3).setValue('ShipmentType').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 4).setValue('CarrierName').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 5).setValue('PackageStatus').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    sheet.getRange(headerRow, 6).setValue('TrackingId').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());

    result.forEach((e, dataRow) => {
      const rowNumber = dataRow + 3;
      sheet.getRange(rowNumber, 1).setValue(e.shipmentId);
      sheet.getRange(rowNumber, 2).setValue(e.isPartnered);
      sheet.getRange(rowNumber, 3).setValue(e.shipmentType);
      sheet.getRange(rowNumber, 4).setValue(e.carrierName);
      sheet.getRange(rowNumber, 5).setValue(e.packageStatus);
      sheet.getRange(rowNumber, 6).setValue(e.trackingId);
   });

   sheet.setFrozenRows(2);
    var mergeRange = sheet.getRange(1, 1, 1, 6);
    mergeRange.mergeAcross();
    mergeRange.setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    mergeRange.setValue('Last synced: ' + new Date());
    sheet.getRange(2, 1, 1, 5).setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).build());
    return true;
}

function writeDataToSheet(result, sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sheet.clear();

  const headerRow = 2;
  sheet.getRange(headerRow, 1).setValue('ShipmentId').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  sheet.getRange(headerRow, 2).setValue('ShipmentName').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  sheet.getRange(headerRow, 3).setValue('LabelPrepType').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  sheet.getRange(headerRow, 4).setValue('DestinationFulfillmentCenterId').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  sheet.getRange(headerRow, 5).setValue('ShipmentStatus').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  sheet.getRange(headerRow, 6).setValue('BoxContentsSource').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  sheet.getRange(headerRow, 7).setValue('ShipAddressName').setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());

  result.forEach((e, dataRow) => {
    const rowNumber = dataRow + 3;
    sheet.getRange(rowNumber, 1).setValue(e.ShipmentId);
    sheet.getRange(rowNumber, 2).setValue(e.ShipmentName);
    sheet.getRange(rowNumber, 3).setValue(e.LabelPrepType);
    sheet.getRange(rowNumber, 4).setValue(e.DestinationFulfillmentCenterId);
    sheet.getRange(rowNumber, 5).setValue(e.ShipmentStatus);
    sheet.getRange(rowNumber, 6).setValue(e.BoxContentsSource);
    sheet.getRange(rowNumber, 7).setValue(e.ShipFromAddress.Name);
  });

  sheet.setFrozenRows(2);
  var mergeRange = sheet.getRange(1, 1, 1, 7);
  mergeRange.mergeAcross();
  mergeRange.setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
  mergeRange.setValue('Last synced: ' + new Date());
  sheet.getRange(2, 1, 1, 5).setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).build());
}
