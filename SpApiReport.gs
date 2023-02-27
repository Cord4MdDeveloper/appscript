function requestReport(config, reportType, startDate, endDate) {
    //try {
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);


        if(reportType == 'GET_LEDGER_SUMMARY_VIEW_DATA') {
          var reportOptions = {"aggregateByLocation":"FC", "aggregatedByTimePeriod": "DAILY"}

        } else if(reportType == 'GET_LEDGER_DETAIL_VIEW_DATA') {
          var reportOptions = ''; //{'eventType': 'Receipts'}

        } else {
          var reportOptions = '';
        }

        let req_param = {
            api_path: '/reports/2021-06-30/reports',
            method: 'POST',
            body: {
                reportType: reportType,
                dataStartTime: startDate,
                dataEndTime: endDate,
                reportOptions : reportOptions,
                marketplaceIds: [config.defaultMarket]
            }
        }
        Logger.log(req_param)
        let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
        var data = JSON.parse(orders);
        var reportId = data.reportId;
        Logger.log('Report:' + reportType + ' is requested succesfully and Report Id: ' + data.reportId);
        return reportId;
        //PropertiesService.getScriptProperties().setProperty(reportName, reportId);
    //} catch (e) {
        //Logger.log('Error while requesting report:' +e);
    //}
}

function checkReportStatus(config, reportId) {
    //try{
    let _role_credentials = getSessionCredential(config);
    var access_token = getAccessToken(config);
    let req_param = {
        api_path: '/reports/2021-06-30/reports/' + reportId,
        method: 'GET',
    }
    let orders = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    //var data = JSON.parse(orders);
    var data = orders;
    return data;

}

function downloadReportData(config, reportDocumentId) {
    //try{
    let _role_credentials = getSessionCredential(config);
    var access_token = getAccessToken(config);

    const req_param = {
        api_path: '/reports/2021-06-30/documents/' + reportDocumentId,
        method: 'GET',
    }
    let document = signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    data = JSON.parse(document);
    return data;
}