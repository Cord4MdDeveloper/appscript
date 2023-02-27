

function requestReportOld(reportName) {
    try {
        //        var reportId = PropertiesService.getProperty(reportName);
        //        if (reportId !== '' && reportId !== 'undefined' && reportId !== null) {
        //            Logger.log('Checking status for Report Id: ' + reportId);
        //            checkReportStatus(reportId);
        //        }

        var config = JSON.parse(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);
        let req_param = {
            api_path: '/reports/2021-06-30/reports',
            method: 'POST',
            body: {
                reportType: reportName,
                //"dataStartTime": "2019-12-10T20:11:24.000Z",
                //"reportOptions":{"eventType":"Adjustments"},
                marketplaceIds: [config.defaultMarket]
            }
        }
        let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
        var data = JSON.parse(orders);
        var reportId = data.reportId;
        Logger.log('Report:' + reportName + ' is requested succesfully and Report Id: ' + data.reportId);
        PropertiesService.getScriptProperties().setProperty(reportName, reportId);
    } catch (e) {
        Logger.log('Error while requesting report:' +e);
        throw new Error(e);
    }
}

function getItemEligibilityFromAmazon(asin,countryCode){
  try {
        const _marketplaces = new Map();

  // Set Map Values
  _marketplaces.set("es", 'A1RKKUPIHCS9HS');
  _marketplaces.set("gb", 'A1F83G8C2ARO7P');
  _marketplaces.set("fr", 'A13V1IB3VIYZZH');
  _marketplaces.set("de", 'A1805IZSGTT6HS');
  _marketplaces.set("it", 'APJ6JRA9NG5V4');

        var config = JSON.parse(loadCredentials());
        Logger.log(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);
        let req_param = {
            api_path: '/fba/inbound/v1/eligibility/itemPreview',
            method: 'GET',
            query: {
              asin: asin,
              program: 'INBOUND',
              marketplaceIds: _marketplaces.get(countryCode)
            }
        }
        let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
        var data = JSON.parse(orders);
        var isEligibleForProgram = data.payload.isEligibleForProgram;
        Logger.log('Item Eligibility For Asin:' + asin + ' is ' + orders);
        if(isEligibleForProgram === false){
          return data.payload.ineligibilityReasonList;
        }else{
          return true;
        }
    } catch (e) {
        Logger.log('Error while getting Item Eligibility for ASIN:' + asin);
        throw new Error('Error while getting Item Eligibility for ASIN:' + asin+"\nError: "+e);
    }
}

function getPrepInstructionFromAmazon(shipToCountryCode,sellerSKUList){
  try {
        var config = JSON.parse(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);
        let req_param = {
            api_path: '/fba/inbound/v0/prepInstructions',
            method: 'GET',
            query: {
              ShipToCountryCode: shipToCountryCode,
              SellerSKUList: sellerSKUList
            }
        }
        let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
        var data = JSON.parse(orders);
        let prepInstructionResult = [];
        data.payload.SKUPrepInstructionsList.forEach(sku => {
          var res = {
            'country':shipToCountryCode,
            'sku': sku.SellerSKU,
            'prepInstructions':sku.PrepInstructionList.join(', ')
          }
          prepInstructionResult.push(res);
        })
        Logger.log('prepInstructionResult'+prepInstructionResult);
        return JSON.stringify(prepInstructionResult);
    } catch (e) {
        throw new Error('Error while getting PrepInstruction From Amazon.+"\nError:'+e);
    }
}

function checkReportStatusOld() {
    var data = JSON.parse(getScheduledReports());
            data.forEach(reportData =>{
                var report = JSON.parse(reportData);
                Logger.log('Checking status for Scheduled Report: ' + report.selectReport+' for user: '+Session.getEffectiveUser().getEmail());
                checkReportStatusAndDownload(report.selectReport, report.sheetName);
            });
}

function checkReportStatusAndDownload(reportName, sheetName) {
    //try{
    var reportId = PropertiesService.getScriptProperties().getProperty(reportName);
    if (reportId === '' || reportId === 'undefined' || reportId === null) {
        Logger.log('ReportId is null or undefined. Requesting new report. ');
        requestReportOld(reportName);
        return;
    }
    var config = JSON.parse(loadCredentials());
    let _role_credentials = getSessionCredential(config);
    var access_token = getAccessToken(config);
    let req_param = {
        api_path: '/reports/2021-06-30/reports/' + reportId,
        method: 'GET',
    }
    let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    var data = JSON.parse(orders);

    if (data.processingStatus === 'DONE' && data.reportDocumentId !== '') {
        downloadReportOld(reportName, sheetName,data.reportDocumentId,access_token,_role_credentials,_aws_regions_countries()[config.defaultMarket])
        Utilities.sleep(5000);
        requestReportOld(reportName);
    } else if (data.processingStatus === 'CANCELLED' || data.processingStatus === 'FATAL') {
        getLatestCompletedReport(reportName, sheetName);
    } else {
        Logger.log('Report is still not ready and the report status is: ' + data.processingStatus);
    }
}

function getLatestCompletedReport(reportName, sheetName) {
    //try{
    var config = JSON.parse(loadCredentials());
    let _role_credentials = getSessionCredential(config);
    var access_token = getAccessToken(config);
    let req_param = {
        api_path: '/reports/2021-06-30/reports',
        method: 'GET',
        query: {
            processingStatuses: 'DONE',
            reportTypes: reportName
        }
    }
    let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    var data = JSON.parse(orders);

    if (data.reports.length > 0) {
		Logger.log('Found latest completed report: ' + data.reports[0]);
		downloadReportOld(reportName, sheetName,data.reports[0].reportDocumentId,access_token,_role_credentials,_aws_regions_countries()[config.defaultMarket])
    } else {
        Logger.log('No completed report found: ' + reportName + '. Requesting new report.');
    }
    requestReportOld(reportName);
}

function downloadReportOld(reportName, sheetName,reportDocumentId,access_token,role_credentials,region){
        const req_param = {
            api_path: '/reports/2021-06-30/documents/' + reportDocumentId,
            method: 'GET',
        }
        let document = signAPIRequest(access_token, role_credentials, req_param, region);
        data = JSON.parse(document);
        var file = UrlFetchApp.fetch(data.url);
        if (data.compressionAlgorithm) {
            Logger.log(reportName + ' is in GZIP format. Extracting the content.');
            var zipblob = file.getBlob();
            zipblob = zipblob.setContentType("application/x-gzip");
            var unzipblob = Utilities.ungzip(zipblob);
            file = unzipblob.getDataAsString();
        } else {
            Logger.log(reportName + ' is in plain text format.');
            file = file.getContentText();
        }
        //Logger.log(file.getContentText());
        writeArrayOfArraysToSheet(file, sheetName ? sheetName : reportName);
}

//Write the array of values to the active sheet
function writeArrayOfArraysToSheet(result, sheetName) {
    // Target range dimensions are determine
    // from those of the nested array.
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName),
        arrayOfArrays = getTsvFileAsArrayOfArays(result),
        dimensions = {
            rowCount: Math.floor(arrayOfArrays.length),
            colCount: Math.floor(arrayOfArrays[0].length)
        },
        targetRng;

    if (null == sheet) {
        Logger.log('Sheet: '+sheetName+' is not available. Creating a new sheet.');
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
        sheet.setName(sheetName);
    }
    if(sheet.getLastRow() > 0 && sheet.getLastColumn() >0){
      Logger.log('Clearing data from row: ' + sheet.getLastRow()+' and column: '+sheet.getLastColumn());
      var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
      range.clearContent();
    }
    //sheet.clear();
    targetRng = sheet.getRange(2, 1,
        dimensions.rowCount,
        dimensions.colCount);
Logger.log('targetRng ' + arrayOfArrays)
    targetRng.setValues(arrayOfArrays);
    Logger.log('Total: ' + arrayOfArrays.length + ' records found. Pasting it in the Sheet.');
    sheet.setFrozenRows(2);
    var mergeRange = sheet.getRange(1, 1, 1, 7);
    mergeRange.mergeAcross();
    mergeRange.setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build());
    mergeRange.setValue('Last synced: ' + new Date());
    sheet.getRange(2, 1, 1, dimensions.colCount).setTextStyle(SpreadsheetApp.newTextStyle().setBold(true).build());
    //sheet.autoResizeColumns(1, dimensions.colCount);
    //highLightProductWithLowQty();

}

function getTsvFileAsArrayOfArays(result) {
    // Read the file into a single string.
    // Split on line char.
    // Loop over lines yielding arrays by
    //  splitting on tabs.
    // Return an array of arrays.
    var lines = result.split('\n'),
        lines2DArray = [];
    //lines.shift();
    var rowCount = lines[0].split('\t').length;
    lines.forEach(function(line) {
        if (line.split('\t').length == rowCount) {
            lines2DArray.push(line.split('\t'));
        }

    });
    return lines2DArray;
}