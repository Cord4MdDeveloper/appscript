function getSheetId() {
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}

function getLastRows(sheetName) {
  return SpreadsheetApp.getActive().getSheetByName(sheetName).getLastRow();
}

function getGMT() {
  return (SpreadsheetApp.getActive().getSpreadsheetTimeZone() === ('Asia/Calcutta' || 'Asia/Kolkata')) ? 'GMT-8' : 'GMT+8';
}

function getSessionTimeZone() {
  return (Session.getScriptTimeZone() === 'Asia/Calcutta' || Session.getScriptTimeZone() === 'Asia/Kolkata') ? 'GMT-8' : 'GMT+8';
}

function getCurrentDate() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function createErroLogs(clientSheetId, systemLogID, error, msg, retryCount) {
  Logger.log('Inside error logs')
  var sheetName = 'ErrorLogs';
  var activeSpreadSheet = SpreadsheetApp.openById(clientSheetId);
  sheetQuery()
  .from(sheetName)
  .insertRows([
    {
      ID: activeSpreadSheet.getSheetByName(sheetName).getLastRow(),
      SystemLogID: systemLogID,
      Error: error,
      Message: msg,
      DateTime: getCurrentDate(),
    }
  ]);


  sheetQuery(SpreadsheetApp.openById(clientSheetId))
    .from(SYSTEM_LOG_SHEET)
    .where((rows) => rows.LogId === systemLogID)
    .updateRows((row) => {
      row.EventStatus = (retryCount >= 3) ? 'FATAL' : row.EventStatus;
      row.RetryCount =  retryCount;
      row.UpdatedAt = getCurrentDate();
    });
  if(retryCount >= 3) {

  }
}




const MASTER_SHEET_ID = '1x0LHwRqvrPO6TGp_YfZ2Z_2ZiQ4d3oK8blb24nj6ANs';
const SYSTEM_LOG_SHEET = 'SystemLogs';
const SHIPMENT_SHEET = 'Shipments';
const SHIPMENT_ITEMS_SHEET = 'ShipmentItems';
const RESTOCK_REPORT_SHEET = 'RestockReport';
const SETTING_SHEET = 'Settings';
const MASTER_SHEET = 'MasterSheet';


function setSetting(){
   var sourceSS = SpreadsheetApp.openById(getMasterSheetID());  // replace yourSpreadsheetID with the value in the sheet URL
   var ss = SpreadsheetApp.getActive();

   // get the range where the dynamic dropdown list is kept in the source spreadsheet
   var eventNames = sourceSS.getSheetByName('EventNames').getRange('C2:C500');   // set to your sheet and range
   var rangeRuleEventNames = SpreadsheetApp.newDataValidation().requireValueInList(eventNames.getValues());
   ss.getRange('Settings!B2:B500').setDataValidation(rangeRuleEventNames); // set range to your range
}
/*
function onEdit(e) {
   var ss = e.source;
  if(ss.getActiveSheet().getName() == 'Settings') {
      var sourceSS = SpreadsheetApp.openById(MASTER_SHEET_ID);  // replace yourSpreadsheetID with the value in the sheet URL
   var ss = SpreadsheetApp.getActive();

   // get the range where the dynamic dropdown list is kept in the source spreadsheet
   var eventNames = sourceSS.getSheetByName('EventNames').getRange('C2:C500');   // set to your sheet and range
   var rangeRuleEventNames = SpreadsheetApp.newDataValidation().requireValueInList(eventNames.getValues());
   ss.getRange('Settings!B2:B500').setDataValidation(rangeRuleEventNames); // set range to your range
  }
}
*/

function getSheetDetails(sheetId, sheetName) {
   var ss = SpreadsheetApp.openById(sheetId);
  var source = ss.getSheetByName(sheetName);
  var rangeSource = source.getDataRange();
  var data = rangeSource.getValues();
  var lr = rangeSource.getLastRow();
  var lc = rangeSource.getLastColumn();
  return data;
}

function removeDupsValues(array) {
  var outArray = [];
  array.sort();
  outArray.push(array[0]);
  for(var n in array){
    //Logger.log(outArray[outArray.length-1]+'  =  '+array[n]+' ?');
    if(outArray[outArray.length-1]!=array[n]){
      outArray.push(array[n]);
    }
  }
  return outArray;
}

function getCSVToArrayData(sheetDetails) {
  let customArray = []; let headerArray = [];
  for (n = 0; n < sheetDetails.length; ++n) {
    if(n == 0) {
      headerArray = sheetDetails[0];
    } else  {
      let obj = {};
      headerArray.forEach((row, i) => {
          obj = {...obj, [row]: sheetDetails[n][i]}
      });
      customArray.push(obj);
    }
  }
  return customArray;
}

function jsonToObject(obj) {
    var path = [],
        nodes = {},
        parseObj = function (obj) {
            if (typeof obj == 'object') {
                if (obj instanceof Array) { //array
                    for (var i = 0, l = obj.length; i < l; i++) {
                        path.push(i);
                        parseObj(obj[i]);
                        path.pop();
                    }
                }
                else {  //object
                    for (var node in obj) {
                        path.push(node);
                        parseObj(obj[node]);
                        path.pop();
                    }
                }
            }
            else {  //value
                nodes[path.join('_')] = obj;
            }
        };

    parseObj(obj);
    return nodes;
}

function getSheetToAccociateArray(sheetDetails) {
  let customArray = []; let headerArray = [];
  for (n = 0; n < sheetDetails.length; ++n) {
    if(n == 0) {
      headerArray = sheetDetails[0];
    } else  {
      let obj = {};
      headerArray.forEach((row, i) => {
          obj = {...obj, [row]: sheetDetails[n][i]}
      });
      customArray.push(obj);
    }
  }
  return customArray;
}

function getTsvFileAsArrayOfArays(result) {
  Logger.log('Call tsv function')
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
            //Logger.log([...line.split('\t')]?.map((d) => d.replace (/"/g,'')))
            lines2DArray.push([...line.split('\t')]?.map((d) => d.replace (/"/g,'')));
        }

    });
    return lines2DArray;
}