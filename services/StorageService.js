const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { inRange } = require("lodash");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseUrl: process.env.FIREBASE_DB_URL,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
class StorageService {
  constructor() {}

  async uploadImage(file) {
    const filename = this.generateUUID();
    const imgRef = ref(storage, filename);

    const metadata = {
      contentType: file.mimetype,
    };

    return uploadBytes(imgRef, file.buffer, metadata).then((_) => {
      return this.buildUrlString(filename);
    });
  }

  async deleteImage(uniqueIdStr) {
    const imgReg = ref(storage, uniqueIdStr);
    deleteObject(desertRef)
      .then(() => {
        console.log("deleted");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  generateUUID() {
    // TODO: check if uuid is somehow already used
    return uuidv4();
  }

  buildUrlString(id) {
    return `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${id}?alt=media`;
  }
}

module.exports = StorageService;
