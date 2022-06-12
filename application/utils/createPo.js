'use strict';
const helper = require('./contractHelper');

async function main(org,buyerCRN, sellerCRN, drugName, quantity) {
    try {
        
		// Reference
		let objContract
		let poBuffer
		let newPO

		// Create contract Instance
		objContract = await helper.getContractInstance(org, "Admin", "pharmachannel", "pharmanet", "org.pharma-network.pharmanet");
		
		// Submit Transaction
		console.log('.....Requesting transaction on the Network');
		let txObject = await objContract.createTransaction('createPO');
		let txId = txObject.getTransactionID();
		poBuffer = await txObject.submit(buyerCRN, sellerCRN, drugName, quantity);
		
		// process response
		console.log('.....Processing create PO Transaction Response \n\n');
		console.log(poBuffer.toString())
		newPO = JSON.parse(poBuffer.toString());
		console.log('\n\n..... create PO Transaction Complete!');

		// Add Tx to reponse
		newPO["txId"] = txId._transaction_id

		// Response
		return newPO;

    } catch (err) {

        console.log(err);
        throw new Error(err);

    } finally {

        // Disconnect from the fabric gateway
        helper.disconnect();

    }
}

// main("distributor","D0001","M0001","Antacid1","1").then(() => {
// 	console.log('New PO created');
// });

module.exports.execute = main;