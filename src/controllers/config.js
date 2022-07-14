const { ref: dref, set: dSet, onValue } = require('firebase/database');
const { database } = require('./firebase');

const getCardConfig = async (req, res) => {
    var { uid } = req.body;
    const configRef = dref(database, uid + '/config');

    onValue(configRef, (cResult) => {
        var configData = cResult.val();
        res.send({ data: configData });
    }, {
        onlyOnce: true
    })
}

const updateCardConfig = async (req, res) => {
    try {
        const { uid, configData } = req.body;
        const configRef = dref(database, uid + '/config');
        dSet(configRef, configData)
            .then(() => {
                res.send({ status: true });
            })
            .catch((error) => {
                res.send({ status: false });
            })
    } catch (error) {
        res.send({ status: false });
    }
}

module.exports = {
    getCardConfig,
    updateCardConfig
}