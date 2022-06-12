'use strict';
const helper = require('./contractHelper');

async function main(org,drugName, serialNo, retailerCRN, customerAadhar) {
    try {
        
		// Reference
		let objContract
		let retailBuffer
		let newRetail

		// Create contract Instance
		objContract = await helper.getContractInstance(org, "Admin", "pharmachannel", "pharmanet", "org.pharma-network.pharmanet");
		
		// Submit Transaction
		console.log('.....Requesting transaction on the Network');
		let txObject = await objContract.createTransaction('retailDrug');
		let txId = txObject.getTransactionID();
		retailBuffer = await txObject.submit(drugName, serialNo, retailerCRN, customerAadhar);
		
		// process response
		console.log('.....Processing retail Transaction Response \n\n');
		console.log(retailBuffer.toString())
		newRetail = JSON.parse(retailBuffer.toString());
		console.log('\n\n..... retail Transaction Complete!');

		// Add Tx to reponse
		newRetail["txId"] = txId._transaction_id

		// Response
		return newRetail;

    } catch (err) {

        console.log(err);
        throw new Error(err);

    } finally {

        // Disconnect from the fabric gateway
        helper.disconnect();

    }
}


module.exports.execute = main;