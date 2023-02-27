var sheetQuery =  SheetQuery.sheetQuery;

var amazonMWSConfigProperties = PropertiesService.getUserProperties();
//var sheetQuery =  SheetQuery.sheetQuery;
function saveCredentialsSPAPI(formData) {
  console.log(formData)
    var sheet = SpreadsheetApp.getActiveSheet();
    var amazonConfigProperties = PropertiesService.getUserProperties();
    try {
        var config = JSON.parse(JSON.stringify(formData));
        var resp = validateCredentials(JSON.stringify(formData));
        if (200 == resp) {
            amazonConfigProperties.setProperty('amazonConfig', JSON.stringify(formData));
            amazonConfigProperties.setProperty('isAccountvalid', true);
            SpreadsheetApp.getUi().alert('Amazon Account credentials is verified.');
        } else {
            SpreadsheetApp.getUi().alert('Amazon2 Account credentials could not be verified. Please check the credential again.');
            amazonConfigProperties.setProperty('isAccountvalid', false);
            throw new Error('Amazon Account credentials could not be verified. Please check the credential again.');
        }
    } catch (e) {
        Logger.log('Error while saving credential:' + e);
        SpreadsheetApp.getUi().alert('Amazon3 Account credentials could not be verified. Please check the credential again.'+e);
        amazonConfigProperties.setProperty('isAccountvalid', false);
        throw e;
    }
}


function loadCredentialsOld() {
  var config = amazonMWSConfigProperties.getProperty('amazonConfig');
  return config;
}

function loadCredentials(masterSheetId, credntialId) {
  //var masterSheet = SpreadsheetApp.openById(getMasterSheetID());
  const cr = sheetQuery(SpreadsheetApp.openById(masterSheetId))
    .from('Credentials')
    .where((row) => row.credentialId == credntialId);
  config = cr.getRows()[0];
  return config;
}

function createSchedulerLogs() {
  try {

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    createLog();

    ss.toast('The Scheduler log is created. You can now close this sheet.', '', -1);

    ScriptApp.newTrigger('createLog')
    .timeBased()
    .everyHours(1)
    .create();

    return;
  } catch (e) {
    Browser.msgBox(e.toString());
  }

}

function startInboundShipment() {
    try {

    //stopTracking(true);

    var hour = 0;
    var min = Math.ceil(Math.random()*59);

    for (var i=0; i<10; i++) {
      hour = Math.ceil(Math.random()*15);
      if (hour > 7) break;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    getShipmentDetails();

    ss.toast('The Shipmet report is ready. You can now close this sheet.', '', -1);

    ScriptApp.newTrigger('getShipmentDetails')
    .timeBased()
    .everyHours(1)
    .create();

    return;
  } catch (e) {
    Browser.msgBox(e.toString());
  }

}

function syncSlaveFolder(sheetId, sheetName) {

  const query = sheetQuery(SpreadsheetApp.openById(sheetId))
  .from('Setting');
  folderId = query.getRows()?.[0]?.SyncFolderID;
  if(folderId) {
    var sheetActive = SpreadsheetApp.openById(sheetId);
    var sh = sheetActive.getSheetByName(sheetName);
    var folder = DriveApp.getFolderById(folderId); // I change the folder ID  here
    var list = [];
    list.push(['SheetName','SheetID']);
    var folderList = folder.getFolders();
    while (folderList.hasNext()){
      folders = folderList.next();
      var folderID = folders.getId();

      var subFolder = DriveApp.getFolderById(folderID); // I change the folder ID  here
      var filesList = subFolder.getFiles();
        while (filesList.hasNext()){
          files = filesList.next();
          var row = []
          row.push(files.getName(),files.getId())
          list.push(row);
        }
    }
    sh.getRange(1,1,list.length,list[0].length).setValues(list);
  } else {
    Logger.log('Sync folder id not found!');
  }

}


function clearSystemLogs(sheetId, sheetName) {

    var sheetActive = SpreadsheetApp.openById(sheetId);
    var sheet = sheetActive.getSheetByName(sheetName);
    var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
    range.clearContent();
}

function startGetTransportContent() {
    try {

    //stopTracking(true);

    var hour = 0;
    var min = Math.ceil(Math.random()*59);

    for (var i=0; i<10; i++) {
      hour = Math.ceil(Math.random()*15);
      if (hour > 7) break;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    getTransportDetails();

    ss.toast('The Shipmet report is ready. You can now close this sheet.', '', -1);

    ScriptApp.newTrigger('getTransportDetails')
    .timeBased()
    .everyHours(1)
    .create();

    return;
  } catch (e) {
    Browser.msgBox(e.toString());
  }

}
/*
function startTracking() {

  try {

    stopTracking(true);

    var hour = 0;
    var min = Math.ceil(Math.random()*59);

    for (var i=0; i<10; i++) {
      hour = Math.ceil(Math.random()*15);
      if (hour > 7) break;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    fetchRestockReport();

    ss.toast('The Amazon Restock Report tracker is now active. You can now close this sheet.', '', -1);

    ScriptApp.newTrigger('fetchRestockReport')
    .timeBased()
    .everyHours(1)
    .create();

    return;
  } catch (e) {
    Browser.msgBox(e.toString());
  }
}
*/


function resetSchedulerLogs(clinetSheetId, sheetName= 'Scheduler') {
  sheetQuery(SpreadsheetApp.openById(clinetSheetId))
  .from(sheetName)
  .updateRows((row) => {
    row.FrequencyStatus = 'PENDING';
    row.UpdateDailyStatus = 'PENDING';
    row.LastUpdated = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  });
  Logger.log('Reset Scheduler');
}


/*
function stopTracking(e) {

  var triggers = ScriptApp.getProjectTriggers();

  for(var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  if (!e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast('The Amazon Restock Report is no longer active. You can restart the tracker anytime later from the same menu.', '', -1);
  }
}
*/