'use strict';

const { Contract } = require('fabric-contract-api');
const helperclass = require('./helper.js');

//define namespace for each asset on the network
const companyNameSpace = 'org.pharma-network.pharmanet.company';
const drugNameSpace = 'org.pharma-network.pharmanet.drug';
const poNameSpace = 'org.pharma-network.pharmanet.po';
const shipmentNameSpace = 'org.pharma-network.pharmanet.shipment';

class PharmanetContract extends Contract {

	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet');
		global.helper = new helperclass();
	}

	/* ****** All custom functions are defined below ***** */

	// This is a basic user defined function used at the time of instantiating the smart contract
	// to print the success message on console
	async instantiate(ctx) {
		console.log('pharmanet Smart Contract Instantiated');
	}

	/**
	 * Create a new company account on the network
	 * @param ctx - The transaction context object
	 * @param companyCRN - Company Registration Number
	 * @param companyName - Name of the company
	 * @param location - location of the company
	 * @param organisationRole - organization role for the new company
	 * @returns
	 */
	async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {

		let hierarchyKey;
		// Validate organisationRole and set hierarchyKey

		switch (organisationRole) {
			case "Manufacturer":
				hierarchyKey = "1";
				break;
			case "Distributor":
				hierarchyKey = "2";
				break;
			case "Retailer":
				hierarchyKey = "3";
				break;
			case "Transporter":
				hierarchyKey = " ";
				break;
			default:
				throw new Error('invalid Parameter : organisationRole');
		}

		// Validate if the role of the organization is same as the initiator organization
		helper.validateUserRole(ctx, [organisationRole.toLowerCase()], ('User is not authorised to register a Company for role : ' + organisationRole));

		// Create a new composite key for the new company account
		let companyCompositeKey = ctx.stub.createCompositeKey(companyNameSpace, [companyCRN, companyName]);

		// Fetch company with given ID from blockchain
		let existingCompanyBuffer = await ctx.stub.getState(companyCompositeKey);

		// console.log('existingCompanyBuffer : ' + existingCompanyBuffer.length);

		if (existingCompanyBuffer.length !== 0) {
			throw new Error('Invalid company key: ' + companyCRN + '+' + companyName + '. A company with this ID already exists.');
		} else {
			// Create a company object to be stored in blockchain
			let newCompanyObject = {
				companyID: companyCompositeKey,
				companyCRN: companyCRN,
				companyName: companyName,
				location: location,
				organisationRole: organisationRole,
				hierarchyKey: hierarchyKey,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// add new company state on the ledger 
			let companyBuffer = Buffer.from(JSON.stringify(newCompanyObject));
			await ctx.stub.putState(companyCompositeKey, companyBuffer);

			// Return value of new company account created to user
			return newCompanyObject;

		}
	}


	/**
	 * allow manufacturer to add / commission a new drug
	 * @param {*} ctx  - The transaction context object
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 * @param {*} mfgDate 
	 * @param {*} expDate 
	 * @param {*} companyCRN 
	 * @returns 
	 */
	async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {

		// Validation: Only Manufacturer can add a new Drug
		helper.validateUserRole(ctx, ["manufacturer"], 'Only Manufacturer can add a new Drug');

		//retrieve company details by partial key companyCRN
		let companyObject = await helper.getCompanyByCRN(ctx, companyCRN);

		// Validation: Drug manufacturer could oly be a company with role = "Manufacturer"
		if (companyObject.organisationRole !== "Manufacturer") {
			throw new Error('input companyCRN' + companyObject.companyCRN + '(' + companyObject.companyName + ')' + ' does not belong to a Manufacturer');
		}

		// Create a new composite key for the new drug to be added
		let drugCompositeKey = ctx.stub.createCompositeKey(drugNameSpace, [drugName, serialNo]);

		// Fetch drug details and validate if the given ID already exists
		let existingDrugBuffer = await ctx.stub.getState(drugCompositeKey);

		// Make sure drug does not already exist.
		if (!(!existingDrugBuffer || existingDrugBuffer.toString().length <= 0)) {
			throw new Error('Invalid drug key: ' + drugName + '+' + serialNo + '. A drug with this ID already exists.');
		} else {
			// Create a drug object to be stored in blockchain
			let newDrugObject = {
				productID: drugCompositeKey,
				drugName: drugName,
				serialNo: serialNo,
				manufacturer: companyObject.companyID,
				mfgDate: mfgDate,
				expDate: expDate,
				owner: companyObject.companyID,
				shipment: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Create a new instance of drug and save it to blockchain
			let drugBuffer = Buffer.from(JSON.stringify(newDrugObject));
			await ctx.stub.putState(drugCompositeKey, drugBuffer);

			return newDrugObject;

		}

	}

	/**
	 * Buyer will create Purchase order for the seller for the purchase of the specified drug Name and quantity 
	 * @param {*} ctx - The transaction context object 
	 * @param {*} byerCRN 
	 * @param {*} sellerCRN 
	 * @param {*} drugName 
	 * @param {*} quantity 
	 */
	async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {

		// Validations: Purchase order can be created by Distributor or Retailer only
		helper.validateUserRole(ctx, ["distributor", "retailer"], "Purchase order can be created by Distributor or Retailer only");

		// Validate buyer and seller heriarchy. Valid scenarios: (buyer  = 2 & seller = 1) or (buyer = 3 & seller = 2)
		// get Buyer and seller Company details by partial key CRN
		let buyerCompanyObject = await helper.getCompanyByCRN(ctx, buyerCRN);

		//validae if PO is being created by the buyer
		helper.validateUserRole(ctx, [buyerCompanyObject.organisationRole.toLowerCase()], ('User does not have privilages to create the PO as a ' + buyerCompanyObject.organisationRole));

		// get Seller Company details by partial key CRN
		let sellerCompanyObject = await helper.getCompanyByCRN(ctx, sellerCRN);

		if (!((buyerCompanyObject.hierarchyKey === "2" && sellerCompanyObject.hierarchyKey === "1") ||
			(buyerCompanyObject.hierarchyKey === "3" && sellerCompanyObject.hierarchyKey === "2"))) {
			throw new Error('Transfer of drug does not follow the hierarchy : buyerHierarchy = ' + buyerCompanyObject.hierarchyKey + '& seller Hierarchy = ' + sellerCompanyObject.hierarchyKey);
		}

		// Create a new composite key for the new purchase order
		let poCompositeKey = ctx.stub.createCompositeKey(poNameSpace, [buyerCRN, drugName]);

		// Fetch drug details and validate if the given ID already exists
		let existingPOBuffer = await ctx.stub.getState(poCompositeKey);

		// Make sure PO does not already exist.
		if (!(!existingPOBuffer || existingPOBuffer.toString().length <= 0)) {
			throw new Error('PO already exists. Please try to udpate teh PO: ' + buyerCRN + '+' + drugName + '.');
		} else {
			// Create a PO object to be stored in blockchain
			let newPOObject = {
				poID: poCompositeKey,
				drugName: drugName,
				quantity: quantity,
				buyer: buyerCompanyObject.companyID,
				seller: sellerCompanyObject.companyID,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Create a new instance of PO and save it to blockchain
			let poBuffer = Buffer.from(JSON.stringify(newPOObject));
			await ctx.stub.putState(poCompositeKey, poBuffer);

			return newPOObject;

		}
	}

	/**
	 * Seller will create a shipment in response to the Purchase order submited by the Buyer. 
	 * @param {*} ctx 
	 * @param {*} buyerCRN        - Unique Buyer identifier
	 * @param {*} drugName 		  - drug Name
	 * @param {*} listOfAssets    - List of drug serial Number seperated by ",". 
	 * @param {*} transporterCRN  - Unique Transporter identifier
	 */
	async createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN) {

		// Convert input list of assets seperated by "," to an array of drug serial numbers
		let drugSerialNoArr = listOfAssets.split(",");

		// Generate shipment composite key using the full key
		let shipmentCompositeKey = ctx.stub.createCompositeKey(shipmentNameSpace, [buyerCRN, drugName]);

		// validate: if shipment exists. 
		let existingShipmentBuffer = await ctx.stub.getState(shipmentCompositeKey);

		if (!(!existingShipmentBuffer || existingShipmentBuffer.toString().length <= 0)) {
			throw new Error('Shipment already Exists. Please use update Shipment');
		}

		//Fetch Details of the PO using BuyerCRN + drugName
		let poCompositeKey = ctx.stub.createCompositeKey(poNameSpace, [buyerCRN, drugName]);

		// Fetch drug details and validate if the given ID already exists
		let existingPOBuffer = await ctx.stub.getState(poCompositeKey);

		//Validation: Check if PO exists
		if (!existingPOBuffer || existingPOBuffer.toString().length <= 0) {
			throw new Error('Unable to find PO: ' + buyerCRN + drugName);
		} else {

			// convert po Data to string and parse to PO Object
			let existingPOObject = JSON.parse(existingPOBuffer.toString());

			//get seller company by seller composite key
			let sellerCompanyBuffer = await ctx.stub.getState(existingPOObject.seller);

			// convert Company data to string and parse to Company Object
			let sellerCompanyObject = JSON.parse(sellerCompanyBuffer.toString());

			//validate shipment is being creted by the seller
			helper.validateUserRole(ctx, [sellerCompanyObject.organisationRole.toLowerCase()], "Shipment can be created onlyby the seller");


			// Validation: Validate drugSerialNoArr.length >= required quantity in the PO
			if (drugSerialNoArr.length < existingPOObject.quantity) {
				throw new Error('Shipment creation error: List of assets insuficient for creating shipment')
			}

			//validate list of assets provided, belong to seller. assuming list of assets will contain array of [[drugName,serial number],..]
			// also prepare the assets array to create shipment

			let assets = [];

			for (let i = 0; i < drugSerialNoArr.length; i++) {

				//generate company composite key using drugName and serialNo
				let drugCompositeKey = ctx.stub.createCompositeKey(drugNameSpace, [drugName, drugSerialNoArr[i]]);

				//fetch drug details and verify if drug exists and the owner is the seller
				let existingDrugBuffer = await ctx.stub.getState(drugCompositeKey);

				// Convert drug details in to a JSON object for validation
				let existingDrugObject = JSON.parse(existingDrugBuffer.toString());

				if (!(!existingDrugBuffer || existingDrugBuffer.toString().length <= 0 || (existingDrugObject.owner !== existingDrugObject.seller))) {
					throw new Error('Invalid drug key: ' + drugName + '+' + drugSerialNoArr[i] + '. Drug does not exist or is not owned by the seller.');
				} else {
					assets[i] = drugCompositeKey;
				}
			}

			// fetch the transporter usin partial key transporterCRN
			let transporterCompanyObject = await helper.getCompanyByCRN(ctx, transporterCRN);

			// Create a shipment object to be stored in blockchain
			let newShipmentObject = {
				shipmentID: shipmentCompositeKey,
				creator: existingPOObject.seller,
				assets: assets,
				transporter: transporterCompanyObject.companyID,
				status: 'in-transit',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Create a new instance of shipment and save it to blockchain
			let shipmentBuffer = Buffer.from(JSON.stringify(newShipmentObject));
			await ctx.stub.putState(shipmentCompositeKey, shipmentBuffer);

			//update owner for list of drug assets = transporter
			for (let i = 0; i < drugSerialNoArr.length; i++) {

				//fetch drug details by composite key
				let existingDrugBuffer = await ctx.stub.getState(assets[i]);

				// Convert drug details in to a JSON object for update
				let updatedDrugObject = JSON.parse(existingDrugBuffer.toString());

				updatedDrugObject.owner = transporterCompanyObject.companyID;
				updatedDrugObject.updatedAt = new Date();

				let updatedDrugBuffer = Buffer.from(JSON.stringify(updatedDrugObject));
				await ctx.stub.putState(assets[i], updatedDrugBuffer);

			}

			//return new shipment program to confirm creation of shipment
			return newShipmentObject;
		}
	}

	/**
	 * Transporter will update the shipment as delivered. Each drug adds the shipment details on record
	 * @param {*} ctx 
	 * @param {*} buyerCRN 
	 * @param {*} drugName 
	 * @param {*} transporterCRN 
	 */
	async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {

		// validation: transaction is invoked by the transporter.
		helper.validateUserRole(ctx, ["transporter"], 'shipment can be delivered by a Transporter only.');

		// fetch shipment details and update status to delviered.
		let shipmentCompositeKey = ctx.stub.createCompositeKey(shipmentNameSpace, [buyerCRN, drugName]);

		// validate: if shipment exists. 
		let existingShipmentbuffer = await ctx.stub.getState(shipmentCompositeKey);

		if (!existingShipmentbuffer || existingShipmentbuffer.toString().length <= 0) {
			throw new Error('Shipment details not found');
		} else {

			// convert to shipment object for updates
			let existingShipmentObject = JSON.parse(existingShipmentbuffer.toString());

			// fetch the transporter using partial key transporterCRN
			let transporterCompanyObject = await helper.getCompanyByCRN(ctx, transporterCRN);

			if (transporterCompanyObject.companyID !== existingShipmentObject.transporter) {
				throw new Error('Only the transporter of the shipment can mark the shipment as delivered');
			}

			// add shipment details to the shipment list in each drug. 
			for (let i = 0; i < existingShipmentObject.assets.length; i++) {

				//fetch drug details and update shipment details
				let existingDrugBuffer = await ctx.stub.getState(existingShipmentObject.assets[i]);

				let existingDrugObject = JSON.parse(existingDrugBuffer.toString());

				// fetch the transporter usin partial key transporterCRN
				let buyerCompanyObject = await helper.getCompanyByCRN(ctx, buyerCRN);

				//add shipment composite key to each drugs shipment list.
				existingDrugObject.shipment.push(shipmentCompositeKey);
				existingDrugObject.owner = buyerCompanyObject.companyID;
				existingDrugObject.updatedAt = new Date();

				let drugBuffer = Buffer.from(JSON.stringify(existingDrugObject));
				await ctx.stub.putState(existingShipmentObject.assets[i], drugBuffer);
			}

			// Update shipment status as delivered.
			existingShipmentObject.status = 'delivered';
			existingShipmentObject.updatedAt = new Date();


			let newShipmentBuffer = Buffer.from(JSON.stringify(existingShipmentObject));
			await ctx.stub.putState(shipmentCompositeKey, newShipmentBuffer);

			//return new shipment program to confirm creation of shipment
			return existingShipmentObject;

		}
	}

	/**
	 * 
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 * @param {*} retailerCRN 
	 * @param {*} customerAadhar 
	 */
	async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {

		// retail drug transaction can only be initiated by the retailer
		helper.validateUserRole(ctx, ["retailer"], 'only retailer would be able to sell the drug to consumer.');

		//fetch retailer company ID using partial key retailerCRN
		let retailerCompanyObject = await helper.getCompanyByCRN(ctx, retailerCRN);

		//generate company composite key using drugName and serialNo
		let drugCompositeKey = ctx.stub.createCompositeKey(drugNameSpace, [drugName, serialNo]);

		//fetch drug details and validate if the retailer is the owner of the drug
		let existingDrugBuffer = await ctx.stub.getState(drugCompositeKey);

		let existingDrugObject = JSON.parse(existingDrugBuffer.toString());

		// validation: transaction is invoked by the retailer who is the onwer of te drug.
		if (retailerCompanyObject.companyID !== existingDrugObject.owner) {
			throw new error('Retailer is not the owner fo the Drug : ' + drugName + ':' + serialNo);
		} else {
			// update owner fo the drug = customer adhar number. 
			existingDrugObject.owner = customerAadhar;
			existingDrugObject.updatedAt = new Date();


			let drugBuffer = Buffer.from(JSON.stringify(existingDrugObject));
			await ctx.stub.putState(drugCompositeKey, drugBuffer);
		}

		return existingDrugObject;
	}

	/**
	 * viewHistory (drugName, serialNo)
	 * Get history for the key drugName + serialNo
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 */
	async viewHistory(ctx, drugName, serialNo) {

		//generate company composite key using drugName and serialNo
		let drugCompositeKey = ctx.stub.createCompositeKey(drugNameSpace, [drugName, serialNo]);

		// get History for the drug key
		let resultsIterator = await ctx.stub.getHistoryForKey(drugCompositeKey);

		// helper funtion to iterate through the history and return array of transactionID, Date time and stateValue
		let results = await helper.getAllResults(resultsIterator, true);

		// return history for the drug composite key
		return results;

	}

	/**
	 * viewDrugCurrentState (drugName, serialNo)
	 * View the current state of the drugName + serialNo
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 */
	async viewDrugCurrentState(ctx, drugName, serialNo) {

		//generate company composite key using drugName and serialNo
		let drugCompositeKey = ctx.stub.createCompositeKey(drugNameSpace, [drugName, serialNo]);

		//fetch drug details and validate if the retailer is the owner of the drug
		let existingDrugBuffer = await ctx.stub.getState(drugCompositeKey);

		if (!existingDrugBuffer || existingDrugBuffer.toString().length <= 0) {
			throw new Error('Invalid drug key: ' + drugName + '+' + serialNo + '. A drug with this ID does not exist.');
		} else {
			return JSON.parse(existingDrugBuffer.toString());
		}
	}

}

module.exports = PharmanetContract;