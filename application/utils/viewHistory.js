'use strict';
const helper = require('./contractHelper');

async function main(org, drugName, serialNo) {
    try {
        
		// Reference
		let objContract
		let historyBuffer
		let newHistory

		// Create contract Instance
		objContract = await helper.getContractInstance(org, "Admin", "pharmachannel", "pharmanet", "org.pharma-network.pharmanet");
		
		// Submit Transaction
		console.log('.....Requesting transaction on the Network');
		let txObject = await objContract.createTransaction('viewHistory');
		let txId = txObject.getTransactionID();
		historyBuffer = await txObject.submit(drugName, serialNo);
		
		// process response
		console.log('.....Processing view Drug History Transaction Response \n\n');
		console.log(historyBuffer.toString())
		newHistory = JSON.parse(historyBuffer.toString());
		console.log('\n\n..... view Drug History Transaction Complete!');

		// Add Tx to reponse
		newHistory["txId"] = txId._transaction_id

		// Response
		return newHistory;

    } catch (err) {

        console.log(err);
        throw new Error(err);

    } finally {

        // Disconnect from the fabric gateway
        helper.disconnect();

    }
}

// main("transporter","Antacid1","0001").then(() => {
// 	console.log('view History success');
// });

module.exports.execute = main;