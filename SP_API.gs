function getShipmentFromAmazonOld(query_type, marketplace_id, shipment_status_list, shipment_id_list, last_updated_after, last_updated_before, next_token){
  //try {

         let shipmentsResponse = getShipmentsAPI(query_type, marketplace_id, shipment_status_list, shipment_id_list, last_updated_after, last_updated_before, next_token);

          var data = JSON.parse(shipmentsResponse);
          var response = data.payload;
          var _nextToken = response.NextToken;
          var shipments = response.ShipmentData;

          var shipmentResponse = [];
          var nextShipmentResponse =  [];
          shipmentResponse.push(shipments);

          while(_nextToken) {

            if (_nextToken) {
              Logger.log('Inside Next Token')

              var next_query_type = 'NEXT_TOKEN';
              let nextShipmentsResponseData = getShipmentsAPI(next_query_type, marketplace_id, null, null, null, null, _nextToken);
              var nextData = JSON.parse(nextShipmentsResponseData);
              var nextResponses = nextData.payload;
              var _nextToken = nextResponses.NextToken;
              var nextShipments = nextResponses.ShipmentData;
              //Logger.log(nextShipments?.length)
              nextShipmentResponse.push(nextShipments);
              //shipments.push(nextShipments);
            } else {
              var nextShipmentResponse = [];
              break;
            }
          }
          var filterShipmentsResponse = shipmentResponse.filter(value => Object.keys(value).length !== 0);
          var filterNextShipmentsResponse = nextShipmentResponse.filter(value => Object.keys(value).length !== 0);
          var filterNextShipmentsResponse = [].concat(...filterNextShipmentsResponse); // multidimension to single

          var mergedArrayData = filterNextShipmentsResponse.concat(...filterShipmentsResponse);
          Logger.log(mergedArrayData)
          var filterShipmentResponse = mergedArrayData.filter(value => Object.keys(value).length !== 0);
          var totalShipments = filterShipmentResponse?.length;
          //writeDataToSheet(filterShipmentResponse, 'ShipmentList');
          //Logger.log(filterShipmentResponse);
          Logger.log('End Shipments (Total Shipments ' + ((totalShipments != undefined) ? totalShipments.toFixed(0) : 0) + ')');
          return filterShipmentResponse;

          /*
          var filterShipmentResponse = shipments.filter(value => Object.keys(value).length !== 0);
          var totalShipments = filterShipmentResponse?.length;
          //writeDataToSheet(filterShipmentResponse, 'ShipmentList');
          //Logger.log(filterShipmentResponse);
          Logger.log('End Shipments (Total Shipments ' + ((totalShipments != undefined) ? totalShipments.toFixed(0) : 0) + ')');
          return filterShipmentResponse;
         */
    //} catch (e) {
        Logger.log('Error while getting shipments:' + e);
        throw new Error('Error while getting inbound shipment API:' +e);
    //}
}


function getShipmentItemsFromAmazonOld(query_type, marketplace_id, last_updated_after, last_updated_before, next_token){
  //try {
          let shipmentsResponse = getShipmentitemsAPI(query_type, marketplace_id, last_updated_after, last_updated_before, next_token);
          if(shipmentsResponse) {
            var data = JSON.parse(shipmentsResponse);
            var response = data.payload;

            var _nextToken = response.NextToken;
            var shipmentItems = response.ItemData;
            var shipmentItemsResponse = [];
            var nextShipmentItemsResponse =  [];
            shipmentItemsResponse.push(shipmentItems);

            if(shipmentItems) {

              //shipmentResponse = [];
              //shipmentResponse.push(shipmentItems);

              while(_nextToken) {
                Logger.log('Inside Next Token')
                if(_nextToken) {
                  var next_query_type = 'NEXT_TOKEN';
                  let nextShipmentsResponseData = getShipmentitemsAPI(next_query_type, marketplace_id, last_updated_after, last_updated_before, _nextToken)
                  var nextData = JSON.parse(nextShipmentsResponseData);
                  var nextResponses = nextData.payload;
                  var _nextToken = nextResponses.NextToken;
                  var nextShipmentItems = nextResponses.ItemData;
                  //shipmentResponse.push(nextShipmentItems);
                  //shipmentItems.push(nextShipmentItems);
                   nextShipmentItemsResponse.push(nextShipmentItems);
                } else {
                  var nextShipmentItemsResponse = [];
                  break;
                }
              }

              var filterShipmentsResponse = shipmentItems.filter(value => Object.keys(value).length !== 0);
              var filterNextShipmentsResponse = nextShipmentItemsResponse.filter(value => Object.keys(value).length !== 0);
              var filterNextShipmentsResponse = [].concat(...filterNextShipmentsResponse); // multidimension to single

              var mergedArrayData = filterNextShipmentsResponse.concat(...filterShipmentsResponse);
              var filterShipmentResponse = mergedArrayData.filter(value => Object.keys(value).length !== 0);
              Logger.log(filterShipmentResponse)
              var totalShipments = filterShipmentResponse?.length;
              //writeDataToSheet(filterShipmentResponse, 'ShipmentList');
              //Logger.log(filterShipmentResponse);
              Logger.log('End Shipments (Total Shipments ' + ((totalShipments != undefined) ? totalShipments.toFixed(0) : 0) + ')');
              return filterShipmentResponse;

              /*
              var filterShipmentResponse = shipmentItems.filter(value => Object.keys(value).length !== 0);
              var totalShipments = filterShipmentResponse?.length;
              //Logger.log(filterShipmentResponse);
              Logger.log('End Shipment items (Total Shipments ' +  ((totalShipments != undefined) ? totalShipments.toFixed(0) : 0) + ')');
              return filterShipmentResponse;
              */
            }
          }

    //} catch (e) {
        //Logger.log('Error while getting shipments items :' + e);
        //throw new Error('Error while getting inbound shipment items API:' +e);
    //}
}

function getShipmentItemsByShipmentIdFromAmazonOld(shipment_id, marketplace_id) {
  try {
        let shipmentsResponse = getShipmentItemsByShipmentIdAPI(shipment_id, marketplace_id);
        if(shipmentsResponse) {
          var data = JSON.parse(shipmentsResponse);
          var response = data.payload;
          var shipmentItems = response.ItemData;

          var filterShipmentResponse = shipmentItems.filter(value => Object.keys(value).length !== 0);
          return filterShipmentResponse;
        }
  } catch (e) {
      Logger.log('Error while getting shipments items :' + e);
      throw new Error('Error while getting inbound shipment items API:' +e);
  }
}

function getShipmentsAPIOld(query_type, marketplace_id, shipment_status_list, shipment_id_list, last_updated_after, last_updated_before, next_token) {
   try {
        var config = JSON.parse(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);

        let req_param = {
            api_path: '/fba/inbound/v0/shipments',
            method: 'GET',
            query: {
              ShipmentStatusList: (shipment_status_list) ? shipment_status_list.join() : null,
              QueryType: query_type,
              LastUpdatedAfter : last_updated_after,
              LastUpdatedBefore : last_updated_before,
              MarketplaceId: marketplace_id,
              NextToken : next_token
            }
        }
        //Logger.log(req_param)
        return signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    } catch (e) {
        Logger.log('Error while getting shipments:' + e);
    }
}

function getShipmentitemsAPIOld(query_type, marketplace_id, last_updated_after, last_updated_before, next_token) {
   try {
        var config = JSON.parse(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);

        let req_param = {
            api_path: '/fba/inbound/v0/shipmentItems',
            method: 'GET',
            query: {
              QueryType: query_type,
              LastUpdatedAfter : last_updated_after,
              LastUpdatedBefore : last_updated_before,
              MarketplaceId: marketplace_id,
              NextToken : next_token
            }
        }
        return signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    } catch (e) {
        Logger.log('Error while getting shipments items:' + e);
    }
}


function getShipmentItemsByShipmentIdAPIOld(shipment_id, marketplace_id) {
   try {
        var config = JSON.parse(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);

        let req_param = {
            api_path: '/fba/inbound/v0/shipments/'+shipment_id+'/items',
            method: 'GET',
            query: {
              MarketplaceId: marketplace_id
            }
        }
        return signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    } catch (e) {
        Logger.log('Error while getting shipments items by shipment id :' + e);
    }
}

function getTransportDetailsAPIOld(shipment_id, marketplace_id) {
   //try {
        var config = JSON.parse(loadCredentials());
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);

        let req_param = {
            api_path: '/fba/inbound/v0/shipments/'+shipment_id+'/transport',
            method: 'GET',
            query: {
              MarketplaceId: marketplace_id
            }
        }
        return signAPIRequest(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    //} catch (e) {
       // Logger.log('Error while getting transport shipment details :' + e);
    //}
}
