'use strict';
const helper = require('./contractHelper');

async function main(org, drugName, serialNo, mfgDate, expDate, companyCRN) {
    try {
        
		// Reference
		let objContract
		let drugBuffer
		let newDrug

		// Create contract Instance
		objContract = await helper.getContractInstance(org, "Admin", "pharmachannel", "pharmanet", "org.pharma-network.pharmanet");
		
		// Submit Transaction
		console.log('.....Requesting transaction on the Network');
		let txObject = await objContract.createTransaction('addDrug');
		let txId = txObject.getTransactionID();
		drugBuffer = await txObject.submit(drugName, serialNo, mfgDate, expDate, companyCRN);
		
		// process response
		console.log('.....Processing add Drug Transaction Response \n\n');
		console.log(drugBuffer.toString())
		newDrug = JSON.parse(drugBuffer.toString());
		console.log('\n\n..... add Drug Transaction Complete!');

		// Add Tx to reponse
		newDrug["txId"] = txId._transaction_id

		// Response
		return newDrug;

    } catch (err) {

        console.log(err);
        throw new Error(err);

    } finally {

        // Disconnect from the fabric gateway
        helper.disconnect();

    }
}

// main("manufacturer","Antacid1","0002","20012022","20012024","M0001").then(() => {
// 	console.log('New drug created');
// });

module.exports.execute = main;