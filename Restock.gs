var amazonMWSConfigProperties1 = PropertiesService.getScriptProperties();
var sheetQuery =  SheetQuery.sheetQuery;
function makeNewRequest(reportName) {
  requestReportOld(reportName);
}

function fetchRestockReporta() {
  if(null != PropertiesService.getScriptProperties().getProperty('GET_FBA_FULFILLMENT_INVENTORY_RECEIPTS_DATA')){
    checkReportStatusAndDownload('GET_FBA_FULFILLMENT_INVENTORY_RECEIPTS_DATA','Report');
  }else{
    makeNewRequest('GET_FBA_FULFILLMENT_INVENTORY_RECEIPTS_DATA');
  }
}

function testSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shipments'),
        arrayOfArrays = sheet.getDataRange().getValues(),
        dimensions = {
            rowCount: Math.floor(arrayOfArrays.length),
            colCount: Math.floor(arrayOfArrays[0].length)
        },
        targetRng;

 targetRng = sheet.getRange(2, 1,
        dimensions.rowCount,
        dimensions.colCount);
Logger.log(arrayOfArrays.length)

//Logger.log(arrayOfArrays)
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shipments');
  var data = sheet.getDataRange().getValues();
  data.splice(0,1);

  data.forEach((row, index) => {
    //Logger.log(row);
  });
}
/**
 * Get the Amazon Item Eligibility for a given ASIN.
 *
 * @param {string} input the ASIN
 * @return The Item Eligibility of that ASIN
 * @customfunction
 */
function getItemEligibility(asin,countryCode){
    var sheet = SpreadsheetApp.getActive().getSheetByName('Restock Sheet');

    if (Array.isArray(asin)) {
    var inputFilter = asin.filter(function(element) {return element !== "";})
    return inputFilter.map(getItemEligibility);

  } else {
    if(asin){
      Utilities.sleep((Math.pow(1,1) * 1000) + (Math.round(Math.random() * 1000)));
      return getItemEligibilityFromAmazon(asin,countryCode.toLowerCase());
    }
}
    Logger.log(data);
}

function getItemEligibilityTest(){

  const query = sheetQuery()
  .from('SystemLogs')
  .where((row) => row.EventStatus === 'Shops');

  const query1 = sheetQuery()
    .from('SystemLogs')
    .where((row) => row.EventStatus === 'PENDING');
    var values = query1.getRows();
    Logger.log(values.length)
  //Logger.log(getItemEligibility('B07WH7RX3Z','FR'));
}

function getPrepInstructionTest(){
  var a = [];
  a.push('31-U3WF-AQT5');
  a.push('AF-BSXT-PS7P')
  //var result = getPrepInstructionFromAmazon('GB',a.join(','));
  //Logger.log('result::'+result);
  return getItemPrepinstruction('GB','D3:D4');
}

/**
 * Get the Amazon Item Prepinstruction for a given SKU.
 *
 * @param {string} input the SKU
 * @return The Item Prepinstruction of that SKU
 * @customfunction
 */
function getItemPrepinstruction(countryCode,skuList){
    var sheet = SpreadsheetApp.getActive().getSheetByName('Restock Sheet');
    console.log(countryCode + ':'+skuList);
    var data=sliceIntoChunks(skuList ,50);
    console.log('data:'+data);
    var result=[];
      data.forEach(d=>{
        var response = JSON.parse(getPrepInstructionFromAmazon(countryCode,Array.isArray(skuList)?d.join(','):d));
      Logger.log(response);
        response.forEach(r => {
          var country = r.country;
          var sku= r.sku;
          var prepInstructions= r.prepInstructions;

          result.push(prepInstructions);
        })
      });
      Logger.log(result);
    return result;
}

function getItemPrepinstructionScript(){
    var sheet = SpreadsheetApp.getActive().getSheetByName('Restock Sheet');
    const data =[];
    var aLast = sheet.getRange("A" + (sheet.getLastRow())).getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
    var range = sheet.getRange('A3:E' + sheet.getLastRow()).getValues();
    var rowNum=3;
    var rowMap = new Map();
    range.forEach(d => {
      const dataObj={
        country:d[0],
        sku:d[3],
        asin:d[4]
      }
      data.push(dataObj);
      rowMap.set(d[0]+":"+d[3],rowNum);
      rowNum++;
    })
    const countryWiseData = new Map();
    data.forEach(e => {
      if(countryWiseData.has(e.country)){
        countryWiseData.get(e.country).push(e.sku);
      }else{
        var list = [];
        list.push(e.sku);
        countryWiseData.set(e.country,list);
      }
    })
    countryWiseData.forEach(function(value, key) {
      var data=sliceIntoChunks(value ,50);
      data.forEach(d=>{
        var result = JSON.parse(getPrepInstructionFromAmazon(key,d.join(',')));
        result.forEach(r => {
          var country = r.country;
          var sku= r.sku;
          var prepInstructions= r.prepInstructions;

          var row = rowMap.get(country+":"+sku);
          sheet.getRange('AC'+row).setValue(prepInstructions);
        })
      });
      return;
    })
}

function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

function highLightProductWithLowQty() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var col = data[0].indexOf('afn-total-quantity');
  var dataRange = sheet.getDataRange();
  for (var i=1; i<=dataRange.getNumRows(); i++) {
    var row = sheet.getRange(i, col+1,1, 10);
    if (row.getValue() < 5) {
      row.setBackground("red");
    }else{
      row.setBackground("white");
    }
  }
}

