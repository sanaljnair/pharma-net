const express = require('express');
const app = express();
const cors = require('cors');
const port = 4000;
const logger = require('morgan');

// Import all function modules
const addToWallet = require('./utils/addToWallet');
const registerCompany = require('./utils/registerCompany');
const addDrug = require('./utils/addDrug');
const createPO = require('./utils/createPo');
const createShipment = require('./utils/createShipment');
const updateShipment = require('./utils/updateShipment');
const retailDrug = require('./utils/retailDrug');
const viewHistory = require('./utils/viewHistory');
const viewDrugCurrentState = require('./utils/viewDrugCurrentState');

// Define Express app settings
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set('title', 'Pharma Supply Chain App');
app.use(logger('dev'))

app.get('/', (req, res) => res.send('Pharma Supply Chain App is running'));

app.post('/:org/addToWallet', (req, res) => {

    addToWallet.execute(req.params.org, req.body.certificatePath, req.body.privateKeyPath).then (() => {      
        const result = {
            status: 'success',
            message: 'User credentials added to wallet'
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });

});

app.post('/:org/registerCompany', (req, res) => {
    registerCompany.execute(req.params.org, req.body.companyCRN, req.body.companyName, req.body.location,req.body.organisationRole ).then ((company) => {
        console.log('New company registered');
        const result = {
            status: 'success',
            message: 'New company registered',
            company: company
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Company Registration Failed',
            error: e
        };
        res.status(500).send(result);
    });
});


app.post('/:org/addDrug', (req, res) => {
    addDrug.execute(req.params.org, req.body.drugName, req.body.serialNo, req.body.mfgDate, req.body.expDate, req.body.companyCRN ).then ((drug) => {
        console.log('New Drug added');
        const result = {
            status: 'success',
            message: 'New Drug added',
            drug: drug
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'New drug addition failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.post('/:org/createPO', (req, res) => {
    createPO.execute(req.params.org, req.body.buyerCRN, req.body.sellerCRN, req.body.drugName,req.body.quantity).then ((po) => {
        console.log('New PO created');
        const result = {
            status: 'success',
            message: 'New PO created',
            po: po
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'New PO creation failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.post('/:org/createShipment', (req, res) => {
    createShipment.execute(req.params.org, req.body.buyerCRN, req.body.drugName, req.body.listOfAssets,req.body.transporterCRN).then ((shipment) => {
        console.log('New Shipment created');
        const result = {
            status: 'success',
            message: 'New Shipment created',
            shipment: shipment
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'New Shipment creation failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.post('/:org/updateShipment', (req, res) => {
    updateShipment.execute(req.params.org, req.body.buyerCRN, req.body.drugName, req.body.transporterCRN).then ((shipment) => {
        console.log('Shipment Update Succesfull');
        const result = {
            status: 'success',
            message: 'Shipment Update Succesfull',
            shipment: shipment
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Shipment Update failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.post('/:org/retailDrug', (req, res) => {
    retailDrug.execute(req.params.org, req.body.drugName, req.body.serialNo, req.body.retailerCRN, req.body.customerAadhar).then ((retail) => {
        console.log('Retail transaction Succesfull');
        const result = {
            status: 'success',
            message: 'Retail transaction Succesfull',
            retail: retail
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Retail transaction failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.get('/:org/viewHistory', (req, res) => {
    viewHistory.execute(req.params.org, req.body.drugName, req.body.serialNo).then ((history) => {
        console.log('View Drug History transaction Succesfull');
        const result = {
            status: 'success',
            message: 'View Drug History transaction Succesfull',
            history: history
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'View Drug History transaction failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.get('/:org/viewDrugCurrentState', (req, res) => {
    viewDrugCurrentState.execute(req.params.org, req.body.drugName, req.body.serialNo).then ((drug) => {
        console.log('View Drug transaction Succesfull');
        const result = {
            status: 'success',
            message: 'View Drug transaction Succesfull',
            drug: drug
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'View Drug transaction failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.listen(port, () => console.log(`Pharma Supply Chain App listening on port ${port}!`));
