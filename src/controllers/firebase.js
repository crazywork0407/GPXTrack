const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getDatabase } = require('firebase/database');
const { getStorage } = require('firebase/storage');

const firebaseConfig = {
    apiKey: "AIzaSyDmWUexU34eFyL_DHVm3ncn9-xOURDAwg8",
    authDomain: "jumplogger-70bc3.firebaseapp.com",
    databaseURL: "https://jumplogger-70bc3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "jumplogger-70bc3",
    storageBucket: "jumplogger-70bc3.appspot.com",
    messagingSenderId: "1017838234856",
    appId: "1:1017838234856:web:a2d571f1e59bbe6afdad5d"
};
initializeApp(firebaseConfig);
const database = getDatabase();
const storage = getStorage();
const auth = getAuth();

module.exports = {
    database,
    storage,
    auth
}