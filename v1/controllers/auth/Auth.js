// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { signInWithEmailAndPassword } = require("firebase/auth");
// const { emit } = require("nodemon");

const firebaseConfig = {
  apiKey: "AIzaSyDmJ_mA_XcUPZtdUMOsbkbXsS0I4jFPKhM",
  authDomain: "novelscrapper-5a928.firebaseapp.com",
  projectId: "novelscrapper-5a928",
  storageBucket: "novelscrapper-5a928.firebasestorage.app",
  messagingSenderId: "60885371197",
  appId: "1:60885371197:web:5f7f6ff3c725d844f61d54",
  measurementId: "G-HSTZ2SD1QC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

const signIn = async (req, res, next) => {
  try {
    // console.log("sign In");
    let { email } = req.body;
    let { password } = req.body;

    if (!email || email.length == 0) {
      return res.status(200).send({ message: "no email" });
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        return res.status(200).send(user.providerData[0]);
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({ error: err });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err });
  }
};

module.exports = {
  signIn,
};
