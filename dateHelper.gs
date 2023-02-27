function getDatesRange(sDate, eDate) {

  var currentDate = new Date();
  var endDate = new Date();
  var startDate = new Date();

  startDate.setDate(currentDate.getDate()-sDate);
  endDate.setDate(currentDate.getDate()- (eDate + 1));

  Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }

  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= endDate) {
      dateArray.push(new Date (currentDate));
      currentDate = currentDate.addDays(1);
  }
  return dateArray;
}

function testDate() {
  var currentDate = new Date();
  var endDate = new Date();
  var startDate = new Date();

  var sDate = startDate.setDate(currentDate.getDate()-3);
  var eDate = endDate.setDate(currentDate.getDate()-3);
  Logger.log('sDate : ' + startDate);
  Logger.log('eDate : ' + eDate);
}