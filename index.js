const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.GOOGLE_PROJECT_ID,
  "private_key_id": process.env.GOOGLE_PRIVATE_KEY_ID,
  "private_key": process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": process.env.GOOGLE_CLIENT_EMAIL,
  "client_id": process.env.GOOGLE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.GOOGLE_CLIENT_X509_CERT_URL,
  "universe_domain": "googleapis.com"
};

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === "Biblioena" && password === "Biblio1") {
        res.status(200).send({ message: "Succès", isAdmin: true });
    } else { res.status(401).send({ message: "Invalide" }); }
});

app.post('/api/publish', async (req, res) => {
    try {
        const { titre, auteur, annee, type, categorie } = req.body;
        const newDoc = { titre, auteur, annee, type, categorie, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        const docRef = await db.collection('documents').add(newDoc);
        res.status(201).send({ id: docRef.id });
    } catch (error) { res.status(500).send({ error: error.message }); }
});

app.get('/api/documents/:type', async (req, res) => {
    try {
        const snapshot = await db.collection('documents').where('type', '==', req.params.type).get();
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(docs);
    } catch (error) { res.status(500).send({ error: error.message }); }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        await db.collection('documents').doc(req.params.id).delete();
        res.status(200).send({ message: "Supprimé" });
    } catch (error) { res.status(500).send({ error: error.message }); }
});

app.get('/api/admin/all-documents', async (req, res) => {
    try {
        const snapshot = await db.collection('documents').orderBy('createdAt', 'desc').get();
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(docs);
    } catch (error) {
        const snapshot = await db.collection('documents').get();
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(docs);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur actif sur port ${PORT}`));