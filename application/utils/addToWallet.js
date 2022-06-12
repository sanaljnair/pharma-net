'use strict';

const fs = require('fs'); // FileSystem Library
const { FileSystemWallet, X509WalletMixin } = require('fabric-network'); // Wallet Library provided by Fabric
const { getConnectionProfilePath, getIdentityPath } = require("../constants/constant")

async function main(org, certificatePath, privateKeyPath) {

	// Main try/catch block
	try {

		// A wallet is a filesystem path that stores a collection of Identities
		const wallet = new FileSystemWallet(getIdentityPath(org));

		// Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
		const certificate = fs.readFileSync(certificatePath).toString();

		// IMPORTANT: Change the private key name to the key generated on your computer
		const privatekey = fs.readFileSync(privateKeyPath).toString();

		// Load credentials into wallet
		const fabricUserName = "Admin";
		const mspName = org + "MSP";
		const identity = X509WalletMixin.createIdentity(mspName, certificate, privatekey); // 'registrarMSP'

		await wallet.import(fabricUserName, identity);

	} catch (error) {
		console.log(`Error adding to wallet. ${error}`);
		console.log(error.stack);
		throw new Error(error);
	}
}

// main(
// 	'manufacturer',
// 	'/home/sanal/practice/pharma-network/network/crypto-config/peerOrganizations/manufacturer.pharma-network.com/users/Admin@manufacturer.pharma-network.com/msp/signcerts/Admin@manufacturer.pharma-network.com-cert.pem', 
// 	'/home/sanal/practice/pharma-network/network/crypto-config/peerOrganizations/manufacturer.pharma-network.com/users/Admin@manufacturer.pharma-network.com/msp/keystore/1a0f1fb11b2bfad13920f6881f60fc0d5d481f644f1757e1726e4d2e55738a74_sk',
// 	).then(() => {
// 	console.log('User identity added to wallet.');
// });
// main(
// 	'distributor',
// 	'/home/sanal/practice/pharma-network/network/crypto-config/peerOrganizations/distributor.pharma-network.com/users/Admin@distributor.pharma-network.com/msp/signcerts/Admin@distributor.pharma-network.com-cert.pem', 
// 	'/home/sanal/practice/pharma-network/network/crypto-config/peerOrganizations/distributor.pharma-network.com/users/Admin@distributor.pharma-network.com/msp/keystore/930fe0bc76b43121b839ac6d03f8cb0ab09b19e47bdda84edb18e4a5f8b30589_sk',
// 	).then(() => {
// 	console.log('User identity added to wallet.');
// });
// main(
// 	'transporter',
// 	'/home/sanal/practice/pharma-network/network/crypto-config/peerOrganizations/transporter.pharma-network.com/users/Admin@transporter.pharma-network.com/msp/signcerts/Admin@transporter.pharma-network.com-cert.pem', 
// 	'/home/sanal/practice/pharma-network/network/crypto-config/peerOrganizations/transporter.pharma-network.com/users/Admin@transporter.pharma-network.com/msp/keystore/e03b0b768d6e848d17a7483a26e84032428c60ff3597fa0a202843c061cf90af_sk',
// 	).then(() => {
// 	console.log('User identity added to wallet.');
// });

module.exports.execute = main;
