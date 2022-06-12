'use strict';

const companyNameSpace = 'org.pharma-network.pharmanet.company';

class helper {

	/**
	 * Common helper functions to validate if user belongs to the given input role [].  
	 * @param {*} ctx 
	 * @param {*} role      - array of allowed roles
	 * @param {*} errMsg    - error message for the given scenario
	 */
	validateUserRole(ctx, role, errMsg) {
		const initiatorID = ctx.clientIdentity.getX509Certificate();

		let isValidUser = false;

		for (let i = 0; i < role.length; i++) {
			if (initiatorID.issuer.organizationName.split(".")[0] === role[i]) {
				isValidUser = true;
			}
			// console.log('role[i] : ' + role[i] + 'initiator Role :' + initiatorID.issuer.organizationName.split(".")[0]);
			// console.log('isValidUser : ' + isValidUser);
		}

		if (isValidUser === false) {
			throw new Error('User Authorization Failed. Initiator Role: ' + initiatorID.issuer.organizationName.split(".")[0] + ' Error MSG: ' + errMsg);
		}
	}

	/**
	 * helper function to handle repeated task to fetch company by partial key: companyCRN
	 * @param {*} ctx 
	 * @param {*} companyCRN - partial key for fetching company details
	 * @returns 
	 */
	async getCompanyByCRN(ctx, companyCRN) {

		//Fetch Company by partial Key asuming, comapnyCRN can  uniquly identify a comapny
		let companyResultsIterator = await ctx.stub.getStateByPartialCompositeKey(companyNameSpace, [companyCRN]);

		let companyFound = false;
		while (!companyFound) {

			let responseRange = await companyResultsIterator.next();

			if (!responseRange || !responseRange.value || !responseRange.value.key) {
				return new Error("Invalid companyCRN");
			}

			companyFound = true;
			let objectType;
			let attributes;

			({ objectType, attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key));

			let returnedCompanyName = attributes[1];
			let returnedCompanyCRN = attributes[0];

			//generate company composite key using companyCRN and companyName
			let companyCompositeKey = ctx.stub.createCompositeKey(companyNameSpace, [returnedCompanyCRN, returnedCompanyName]);

			let companyBuffer = await ctx.stub.getState(companyCompositeKey);
			return JSON.parse(companyBuffer.toString());

		}

	}

	/**
	 * Iterate through the response for the getHistoryForKey(drugsCompositeKey) 
	 * @param {*} iterator 
	 * @param {*} isHistory 
	 * @returns  - array of json file with transaction history:  Transaction id, timestamp, is delete flag and state value
	 */
	async getAllResults(iterator, isHistory) {
		let allResults = [];
		while (true) {
			let res = await iterator.next();

			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));

				if (isHistory && isHistory === true) {
					jsonRes.TxId = res.value.tx_id;
					jsonRes.Timestamp = res.value.timestamp;
					jsonRes.IsDelete = res.value.is_delete.toString();
					try {
						jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Value = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.Key = res.value.key;
					try {
						jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Record = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			if (res.done) {
				console.log('end of data');
				await iterator.close();
				// console.info(allResults);
				return allResults;
			}
		}
	}

}

module.exports = helper;