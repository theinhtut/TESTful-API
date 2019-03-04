const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

// MongoDB Schema Models
const Device = require('../models/deviceModel');
const Variable = require('../models/variableModel');
const User = require('../models/userModel');

router.use(express.json());

router.get('/', (req, res, next) =>{
    res.status(200).json({
        message: 'This is api page'
    });
});


// Create User using POST to /users
router.post('/users', (req, res, next) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        token: req.body.token
    });
    
    user.save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: "User has been created successfully",
            createdUser:{
                _id: result._id,
                name: result.name,
                email: result.email,
                token: result.token
            }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
    
});


// Create Devices for User using POST to /devices/:token
router.post('/devices/:token', (req, res, next) =>{
    const deviceName = req.body.deviceName;
    const deviceURLId = deviceName.replace(/\s/g,'-').toLowerCase(); // Space replace with "-" and all lowercase
    
    const updateOps = {};

    // Check TOKEN
    User.findOne({ token: req.params.token })
    .exec()
    .then(result => {
        if(result) {
            // Token is correct then create a new device
            const device = new Device({
                deviceName: req.body.deviceName,
                deviceURLId: deviceURLId,
                createdBy: result._id
            });
            
            device.save()
            .then(doc => {
                updateOps.deviceId = doc._id;
                updateOps.deviceName = deviceName;
                updateOps.deviceURLId = deviceURLId;
                console.log('updateOps: ' + updateOps);
                res.status(200).json({
                message: 'Device has been created successfully',
                createdDevice: {
                    _id: doc._id,
                    userId: result._id,
                    deviceName: doc.deviceName,
                    deviceURLId: doc.deviceURLId,
                    createdOn: doc.createdOn
                }
            });
            
            // Update the device in UserModel
            User.updateOne({token: req.params.token}, {$push: { devices: updateOps }})
            .then(doc2 => {
                console.log('doc2: ');
                console.log(doc2);
            })
            .catch(err2 => {
                console.log(err2);
            });

            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: err });
                
            });        
        } else {
            // Invalid TOKEN
            res.status(401).json({ message:'No valid entry found for provided token' });
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
    });


});


// TESTING - TESTING Create Devices for User using POST to /devices/:token
router.post('/devices/testing12/:token', (req, res, next) =>{
    res.status(200).json({ message:'Testing' });
});
    

// Sending variables and values, POST to /devices/:deviceURLId/:token
router.post('/devices/:deviceURLId/:token', (req, res, next) => {
    const deviceURLId = req.params.deviceURLId;
    const deviceName = req.body.deviceName;
    const updateOps = {};

    var keysArray = []; // To store the keys in JSON
    for(var key in req.body) {
        keysArray.push(key);
    }

    // Check TOKEN
    User.findOne({ token: req.params.token })
    .exec()
    .then(resultUserFindOne => {
        // If TOKEN is valid
        if(resultUserFindOne) {
            // Check Device Exist or not
            Device.findOne({ deviceURLId: deviceURLId, createdBy: resultUserFindOne })
            .exec()
            .then(resultDeviceFindOne => {
                // If Device is Found
                if(resultDeviceFindOne){
                    console.log('Device Found');
                    res.status(200).json({ message:'Successful'});

                    // forEach Loop for req.body request
                    keysArray.forEach(key_i => {
                        // Find the variables keys of req.body in VariableModel
                        Variable.findOne({ variableName: key_i, createdBy: resultUserFindOne._id })
                        .exec()
                        .then(resultVariableFindOne => {
                            // If variable's key is found
                            if(resultVariableFindOne){
                                console.log('\x1b[36m%s\x1b[0m', 'Variable Found: ' + key_i);
                                updateOps.timestamp = new Date().toISOString();
                                updateOps.val = req.body[key_i];
                           
                                // Update the array to found variable key document
                                Variable.updateOne({ variableName: key_i, createdBy: resultUserFindOne._id }, {$push: { samples: updateOps}})
                                .exec()
                                .then()
                                .catch(errVariableUpdateOne => {
                                    console.log(errVariableUpdateOne);
                                });
                
                            } else {
                                // Variables keys of req.body is not found in VariableModel
                                // Create new document
                                console.log('\x1b[31m%s\x1b[0m', 'Variable not found: ' + key_i);
                                updateOps.timestamp = new Date().toISOString();
                                updateOps.val = req.body[key_i];
                           
                            
                                const variable = new Variable({
                                    deviceURLId: deviceURLId,
                                    deviceName: resultDeviceFindOne.deviceName,
                                    variableName: key_i,
                                    createdBy: resultUserFindOne._id,
                                    createdOn: new Date().toISOString(),
                                    samples: [updateOps]
                                });
                    
                                variable.save();
                            }
                        })
                        .catch();
                    });
                
                } else {
                    // Device is not found
                    console.log('Device Not Found');
                    res.status(404).json({ message:'Device Not Found!' });
                }
            })
            .catch(errDeviceFindOne => {
                console.log(errDeviceFindOne);
                res.status(500).json({ message:errDeviceFindOne });
            });
            

        } else {
            // Invaild Token
            console.log('Invalid Token');
            res.status(401).json({ message:'No valid entry found for provided token' });
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});


// Read all devices belong to user by GET /devices/:token
router.get('/devices/:token', (req, res, next) =>{
    
    // Check Token
    User.findOne({ token: req.params.token })
    .exec()
    .then(resultUserFindOne => {
        // TOKEN is valid
        if(resultUserFindOne) {
            const docString = JSON.stringify(resultUserFindOne);
            const docJSON = JSON.parse(docString);
            console.log(docJSON.devices);
            res.status(200).json(docJSON.devices);
        } else {
            // Invaild Token
            console.log('Invalid Token');
            res.status(401).json({ message:'No valid entry found for provided token' });
        }
        
    })
    .catch(errUserFindOne => {
        console.log(errUserFindOne);
        res.status(500).json({ error: errUserFindOne });
    });


});


// DELETE User's Devices to DELETE /devices/:deviceURLId/:token
router.delete('/devices/:deviceURLId/:token', (req, res, next) => {
    const deviceURLId = req.params.deviceURLId;
    
    // Check TOKEN
    User.findOne({ token: req.params.token })
    .exec()
    .then(resultUserFindOne => {
        if(resultUserFindOne) {
            // Token is correct
            
            // DELETE device in DeviceModel
            Device.findOneAndDelete({ createdBy: resultUserFindOne._id, deviceURLId: deviceURLId })
            .then(resultDeviceFindOneDelete => {
                if(resultDeviceFindOneDelete) {
                    // If the device is found
                    console.log('\x1b[33m%s\x1b[0m', 'Deleted Device in DeviceModel');
                
                    // DELETE device object array in UserModel
                    User.updateOne({ _id: resultUserFindOne._id}, 
                    { $pull: { "devices" : { deviceURLId: deviceURLId } } })
                    .then(resultDeviceFindOneRemove => {
                        console.log('\x1b[33m%s\x1b[0m','Deleted Devices Object in UserModel');
                        console.log(resultDeviceFindOneRemove);
                    })
                    .catch(errDeviceFindOneRemove => {
                        console.log(errDeviceFindOneRemove);
                    });


                    // DELETE device's variables in VariableModel
                    Variable.deleteMany({ createdBy: resultUserFindOne._id, deviceURLId: deviceURLId})
                    .then(resultVariableFindOneDelete => {
                        console.log('\x1b[33m%s\x1b[0m', 'Deleted Device in VariableModel');
                        console.log(resultVariableFindOneDelete);
                    })
                    .catch(errVariableFindOneDelete => {
                        console.log(errVariableFindOneDelete);
                    });
            
                    res.status(200).json({ message: 'Device: ' + deviceURLId + ' and all variables belong to the device has been deleted' });
                } else {
                    // Device is not found
                    console.log('\x1b[31m%s\x1b[0m', 'No device found');
                    res.status(404).json({ message: 'Device: ' + deviceURLId + ' not found' });
                }
                
            })
            .catch(errDeviceFindOneDelete => {
                console.log(errDeviceFindOneDelete);
            });
            
        } else {
            // Invalid TOKEN
            res.status(401).json({ message:'No valid entry found for provided token' });
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
    });


});


// Read all variables from user's device by GET /variables/:token
router.get('/variables/:token', (req, res, next) =>{
    
    // Check Token
    User.findOne({ token: req.params.token })
    .exec()
    .then(resultUserFindOne => {
        // TOKEN is valid
        if(resultUserFindOne) {

            Variable.find({ createdBy: resultUserFindOne._id })
            .select('variableName deviceName createdOn')
            .exec()
            .then(doc => {
                res.status(200).json(doc);
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: err });
            });
        } else {
            // Invaild Token
            console.log('Invalid Token');
            res.status(401).json({ message:'No valid entry found for provided token' });
        }
        
    })
    .catch(errUserFindOne => {
        console.log(errUserFindOne);
        res.status(500).json({ error: errUserFindOne });
    });
});





// Handling POST from /devices
router.post('/devices', (req, res, next) =>{
    //const device = new Device(req.body);
    //const booty = req.body;
    //const bodyJSON = JSON.stringify(req.body.name);
    //const bodyJSON = Object.keys(req.body);
    const reqBody = req.body;
    const testDeviceId = { deviceId: "224466" };
    Object.assign(reqBody, testDeviceId);

    const device = new Device(reqBody);
    

    // POST without Schema
    device
    .save()
    .then(result => {
        console.log(device);
        res.status(201).json({
            message: 'You have POST sth !!'
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
    
    
    // const mockData = JSON.parse('{ "name": "John", "email": "123@mail.com" }');
    // const device = new Device(req.body);
    // const testDeviceId = JSON.parse('{ "deviceId" : "22446688" }');
    // Object.assign(mockData, testDeviceId);
    
    // console.log(mockData);
    
    
    
});


// For TESTING #1 purposes only
router.get('/devices', (req, res, next) =>{
    Device.find()
    .exec()
    .then(doc => {
        var doc2 = doc[2];
        var doc2Friends = doc2;

        var stringJSON = JSON.stringify(doc2Friends);
        var doc_events = JSON.parse(stringJSON);
        console.log(doc_events.friends);

        res.status(200).json({
            message: 'Check your log !!'
        });

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });


});

// For TESTING #2 purposes only
router.get('/devices/testing2', (req, res, next) =>{
    Device.find({deviceId: '224466'})
    .exec()
    .then(doc => {

        console.log(doc);
        res.status(200).json({
            message: 'Go and GET that bicth!'
        });

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });


});


// For TESTING #3 purposes only
router.get('/devices/testing3', (req, res, next) =>{
    Variable.find({deviceId: '224466'})
    .exec()
    .then(doc => {

        console.log(doc);
         const docString = JSON.stringify(doc);
         const docJSON = JSON.parse(docString);
         const result = docJSON[0];
         const sampleResult = result.samples;

        console.log('The samples are ' + sampleResult[0].timestamp);

        console.log('The keys are ' + Object.values(sampleResult[1]));

        const x = [];
        const y = [];

        x.push(Object.values(sampleResult[1]));
        console.log('X array contain : ' + x);

        res.status(200).json({
            message: 'Go and GET that bicth!'
        });

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });


});
router.post('/devices/testing3', (req, res, next) =>{
    const updateOps = {
        timestamp: '2019-02-25 12:40:00',
        val: '159.58'
    };
    Variable.updateOne({deviceId: '5c72b49dbb2524028c6216da'}, {$push: { samples: updateOps }})
    .exec()
    .then(doc => {

        console.log(doc);
        res.status(200).json({
            message: 'Go and POST that bicth!'
        });

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });

});



// For TESTING #4 purposes only
// Rendering for index.ejs page
router.get('/testing4', (req, res, next) =>{
    Variable.find({deviceName: 'AX Device'})
    .exec()
    .then(doc => {

        const docString = JSON.stringify(doc);
        const docJSON = JSON.parse(docString);
        const result = docJSON[0];
        const sampleResult = result.samples;

        console.log(sampleResult);

        res.status(200).json(result.samples);

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });


});


module.exports = router;