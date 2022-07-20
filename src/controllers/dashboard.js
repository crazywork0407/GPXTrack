const axios = require('axios');
const fetch = require('node-fetch');
const { signInWithEmailAndPassword } = require('firebase/auth');
const { ref: dref, set: dSet, onValue } = require('firebase/database');
const { ref: sref, getDownloadURL } = require('firebase/storage');
const { auth, database, storage } = require('./firebase');
const { response } = require('express');
const geoapifyKey = "bc1242ec712940f6a0c5972c63b13686";
const tempUId = "0XG1ofhpLzWojIajLdxszlCMrcy2";


const verifyUid = (req, res) => {
    const { uid } = req.body;

    if (uid) {
        res.send({ status: true });
    } else {
        res.send({ status: false });
    }
}

const login = (req, res) => {
    const { email, password } = req.body;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            res.send({ status: true, uid: user.uid });
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == "auth/invalid-email") {
                res.send({ status: false, message: "Invalid Email" });
            } else if (errorCode == "auth/user-not-found") {
                res.send({ status: false, message: "User not found" });
            } else if (errorCode == "auth/wrong-password") {
                res.send({ status: false, message: "Wrong Password" });
            } else if (errorCode == "auth/too-many-requests") {
                res.send({ status: false, message: "Too many request" });
            } else {
                res.send({ status: false });
            }
        });
}

const getLogbook = (req, res) => {
    var { uid } = req.body;
    uid = uid ? uid : tempUId;
    const uidRef = dref(database, uid);

    onValue(uidRef, async (result) => {
        var uidResult = result.val();

        var logbookList = uidResult.logbook;
        var logbookKeys = Object.keys(logbookList).reverse();
        for (let index = 0; index < logbookKeys.length; index++) {
            const key = logbookKeys[index];
            if (logbookList[key].logFile.length && logbookList[key].logFile != " ") {
                logbookList[key].logFile = logbookList[key].logFile + '.gpx';
            } else {
                logbookList[key].logFile = " ";
            }
        }

        var batteryData = uidResult.battery;
        var cardData = uidResult.cardInfo;
        var locationData = uidResult.currentLoc;

        res.send({
            keys: logbookKeys,
            data: logbookList,
            battery: batteryData,
            cardInfo: cardData,
            location: locationData,
            username: uidResult.config.username,
            callsign: uidResult.config.callsign,
            license: uidResult.config.license,
            metric: uidResult.config.units_metric,
            timezone: uidResult.config.timezone
        });
    }, {
        onlyOnce: true
    });
}

const getWindsData = (req, res) => {
    var { uid } = req.body;
    uid = uid ? uid : tempUId;
    const uidRef = dref(database, uid);

    onValue(uidRef, async (result) => {
        var uidResult = result.val();
        var locationData = uidResult.currentLoc;

        var windsUrl = `https://markschulze.net/winds/winds.php?lat=${locationData.curLat}&lon=${locationData.curLon}&hourOffset=0&referrer=JL12207`;
        var windsAloft = await axios.get(windsUrl);
        res.send({ location: locationData, windsAloft: windsAloft.data });
    }, {
        onlyOnce: true
    });
}

const getLogFile = async (req, res) => {
    const { logFileUrl } = req.body;
    let response = await fetch(logFileUrl);
    let data = await response.blob();
    res.send(await data.text());
    res.end();
}

const getDownloadUrl = async (req, res) => {
    var { uid, filename } = req.body;
    uid = uid ? uid : tempUId;

    // Convert file name to *.csv file.
    filename = filename.replace('.gpx', '.csv');

    var downloadUrl = await getDownloadURL(sref(storage, uid + "/" + filename));
    res.send({ url: downloadUrl });
}

const saveLogData = async (req, res) => {
    const { uid, logNr, logPlace, logAirc, logDesc } = req.body;
    var newLogData = req.body;

    if (!uid || !logNr || !logPlace || !logAirc || !logDesc) {
        res.send({ status: false, message: "Please enter all log detail info!" });
        return;
    }


    // const logUidRef = dref(database, uid);
    // onValue(logUidRef, (uResult) => {
    //     var uidResult = uResult.val();
    //     if (uidResult == null) {
    //         res.send({ status: false, message: "UID do not exist" });
    //     } else {
    //         console.log("result 1");
    const logNrRef = dref(database, uid + "/logbook/" + logNr);
    //         onValue(logNrRef, async (nResult) => {
    //             var nrResult = nResult.val();
    //             if (nrResult == null) {
    //                 res.send({ status: false, message: "logNr do not exist" });
    //             } else {
    //                 console.log("result 2")
    //                 delete newLogData["uid"];
    dSet(logNrRef, newLogData)
        .then(() => {
            console.log("Data saved successfully!");
            const uidRef = dref(database, uid);
            onValue(uidRef, async (result) => {
                var uidResult = result.val();

                var logbookList = uidResult.logbook;
                var logbookKeys = Object.keys(logbookList).reverse();
                for (let index = 0; index < logbookKeys.length; index++) {
                    const key = logbookKeys[index];
                    if (logbookList[key].logFile.length && logbookList[key].logFile.substring(0, 1) != " ") {
                        logbookList[key].logFile = logbookList[key].logFile + '.gpx';
                    } else {
                        logbookList[key].logFile = " ";
                    }
                    logbookList[key].logPlace = (logbookList[key].logPlace ? logbookList[key].logPlace : "");
                    logbookList[key].logAirc = (logbookList[key].logAirc ? logbookList[key].logAirc : "");
                    logbookList[key].logDesc = (logbookList[key].logDesc ? logbookList[key].logDesc : "");
                }

                res.send({
                    status: true,
                    keys: logbookKeys,
                    data: logbookList
                });
            }, {
                onlyOnce: true
            });
        })
        .catch(() => {
            res.send({ status: false });
        })
    //             }
    //         })
    //     }
    // })
}

module.exports = {
    verifyUid,
    login,
    getLogbook,
    getWindsData,
    getLogFile,
    getDownloadUrl,
    saveLogData
}