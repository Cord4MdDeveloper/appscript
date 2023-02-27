var sheetQuery =  SheetQuery.sheetQuery;
function downloadReport(config, clientSheetId, logDate, reportDocumentId, slaveSheetID, reportType, downloadType) {
  Logger.log('Report Download Type: ' + downloadType)
  var data = downloadReportData(config, reportDocumentId);
  var file = UrlFetchApp.fetch(data.url);
  if (data.compressionAlgorithm) {
      Logger.log('Report is in GZIP format. Extracting the content.');
      var zipblob = file.getBlob();
      zipblob = zipblob.setContentType("application/x-gzip");
      var unzipblob = Utilities.ungzip(zipblob);
      file = unzipblob.getDataAsString();
  } else {
      Logger.log('Report is in plain text format.');
      file = file.getContentText();
  }
  Logger.log(file)
  //Logger.log((file));
  var sheetName = reportType+'_'+config.marketplaceName;
  if(file) {
    var activeSpredsheet = SpreadsheetApp.openById(slaveSheetID);
    var sheetData = activeSpredsheet.getSheetByName(sheetName);

    const eventDetailsSheet = sheetQuery(SpreadsheetApp.openById(clientSheetId))
    .from('EventNames')
    .where((row) => row.EventName == reportType);
    var reportFormat = eventDetailsSheet.getRows()?.[0]?.ReportFormat;
    Logger.log('Report format: ' + reportFormat)

    if(reportFormat == 'JSON') {
      // Report type: JSON
      const values = jsonToObject(JSON.parse(file));
      var arrayDataConvert = [...[Object.entries(values).map((d) => d[0])], ...[Object.entries(values).map((d) => d[1])]];
    } else if(reportFormat == 'XML') {
      //Report type: XML
      var jsonObj = makeObFromXml( XmlService.parse (file).getRootElement());
      const values = jsonToObject(jsonObj);
      var arrayDataConvert = [...[Object.entries(values).map((d) => d[0])], ...[Object.entries(values).map((d) => d[1])]];
    } else {
      //Tab-delimited flat file
      var arrayDataConvert = getTsvFileAsArrayOfArays(file);
    }

    var sheet = sheetData,
        tsvToArray = arrayDataConvert,
        dimensions = {
            rowCount: Math.floor(tsvToArray.length),
            colCount: Math.floor(tsvToArray[0].length + 1)
        },
        targetRng;
    var arrayOfArrays = tsvToArray.map((d,i) =>  [...d, i == 0 ? 'LogDate' : logDate]);
    if (null == sheet) {
        Logger.log('Sheet: '+sheetName+' is not available. Creating a new sheet.');
        sheet = activeSpredsheet.insertSheet();
        sheet.setName(sheetName);
    }

    /*if(sheet.getLastRow() > 0 && sheet.getLastColumn() > 0 ){
    }*/

    if(downloadType === 'Replace') {

      Logger.log('Clearing data from row: ' + sheet.getLastRow() + ' and column: '+sheet.getLastColumn());
      //var range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
      //range.clearContent();
      sheet.clear();
      targetRng = sheet.getRange(1, 1, dimensions.rowCount, dimensions.colCount);

    } else {

      if(sheet.getLastRow() > 0 && sheet.getLastColumn() > 0 ){
        Logger.log('Data exists') ;

        var totalRows = sheet.getLastRow();
        /*
        if(totalRows > 1){
          deleteExistData(slaveSheetID, sheetName, sheet, logDate);
        }
        */
        deleteData(slaveSheetID, sheetName, sheet, logDate);
        arrayOfArrays.splice(0, 1); // remove header of report array
        var rowCount = dimensions.rowCount - 1;
        var lastRow = sheet.getLastRow() + 1;

      } else {
        sheet.clear();
        Logger.log('Data empty')
        var arrayOfArrays = arrayOfArrays;
        var rowCount = (dimensions.rowCount);
        var lastRow = 1;
      }
       Logger.log('Adding data from row: ' + lastRow +' and column: '+ sheet.getLastColumn());

      targetRng = sheet.getRange(lastRow, 1, rowCount, dimensions.colCount);

    }

    targetRng.setValues(arrayOfArrays);
    Logger.log('Total: ' + arrayOfArrays.length + ' records found. Pasting it in the Sheet.');

    var mergeRange = sheet.getRange(1, 1, 1, dimensions.colCount);
    mergeRange.setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(12).build());
    mergeRange.setBackground("yellow");
  }
}

function deleteExistData(slaveSheetID, sheetName, sheetData, logDate) {
  Logger.log('Inside delete logs');
  const query = sheetQuery(SpreadsheetApp.openById(slaveSheetID))
  .from(sheetName)
  .where((rows) =>  Utilities.formatDate(new Date(rows.LogDate), Session.getScriptTimeZone(), "yyyy-MM-dd") == logDate);
  var values = query.getRows();
  if(values.length > 0) {
    totalCols = values[0].__meta.cols;
    firstRow = values[0].__meta.row;
    lastRow = values[values.length-1].__meta.row;
    rowCount = (lastRow - firstRow) + 1;
    for (var i = lastRow; i>=firstRow; i--) {
      Logger.log('delete row number : '  + i);
      sheetData.deleteRow(i);
    }
  }
}
function deleteRow1(sheetName, logDate)
{
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var startRow = 2;  // First row of data to process
    var numRows = sheet.getLastRow()-1;   // Number of rows to process
    var dataRange = sheet.getRange(startRow, 1, numRows);
    // Fetch values for each row in the Range.
    var data = dataRange.getValues();

    for (i=data.length-1;i>=0;i--)
    {
          var row = data[i];
          var sheetDate = new Date(row);
          var sheetDates = Utilities.formatDate(sheetDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

          if (logDate.valueOf() == sheetDates.valueOf())
          {
                sheet.deleteRow(i+2) //don't delete header
          }
    }
 }
