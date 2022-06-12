'use strict';
const helper = require('./contractHelper');

async function main(org,buyerCRN, drugName, listOfAssets, transporterCRN) {
    try {
        
		// Reference
		let objContract
		let shipmentBuffer
		let newShipment

		// Create contract Instance
		objContract = await helper.getContractInstance(org, "Admin", "pharmachannel", "pharmanet", "org.pharma-network.pharmanet");
		
		// Submit Transaction
		console.log('.....Requesting transaction on the Network');
		let txObject = await objContract.createTransaction('createShipment');
		let txId = txObject.getTransactionID();
		shipmentBuffer = await txObject.submit(buyerCRN, drugName, listOfAssets, transporterCRN);
		
		// process response
		console.log('.....Processing create Shipment Transaction Response \n\n');
		console.log(shipmentBuffer.toString())
		newShipment = JSON.parse(shipmentBuffer.toString());
		console.log('\n\n..... create Shipment Transaction Complete!');

		// Add Tx to reponse
		newShipment["txId"] = txId._transaction_id

		// Response
		return newShipment;

    } catch (err) {

        console.log(err);
        throw new Error(err);

    } finally {

        // Disconnect from the fabric gateway
        helper.disconnect();

    }
}

// main("manufacturer","D0001","Antacid1","0001,0002","T0001").then(() => {
// 	console.log('New shipment created');
// });

module.exports.execute = main;