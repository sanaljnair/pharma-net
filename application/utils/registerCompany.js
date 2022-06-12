'use strict';
const helper = require('./contractHelper');

async function main(org,companyCRN, companyName, location, organisationRole) {
    try {
        
		// Reference
		let objContract
		let companyBuffer
		let newCompany

		// Create contract Instance
		objContract = await helper.getContractInstance(org, "Admin", "pharmachannel", "pharmanet", "org.pharma-network.pharmanet");
		
		// Submit Transaction
		console.log('.....Requesting transaction on the Network');
		let txObject = await objContract.createTransaction('registerCompany')
		let txId = txObject.getTransactionID()
		companyBuffer = await txObject.submit(companyCRN, companyName, location, organisationRole);
		
		// process response
		console.log('.....Processing Register Company Transaction Response \n\n');
		console.log(companyBuffer.toString())
		newCompany = JSON.parse(companyBuffer.toString());
		console.log('\n\n..... Register Company Transaction Complete!');

		// Add Tx to reponse
		newCompany["txId"] = txId._transaction_id

		// Response
		return newCompany;

    } catch (err) {

        console.log(err);
        throw new Error(err);

    } finally {

        // Disconnect from the fabric gateway
        helper.disconnect();

    }
}

// main("manufacturer","M02","name2","Chennai",'Manufacturer').then(() => {
// 	console.log('Company is succesfully registered');
// });

module.exports.execute = main;