const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const utils = require("./utils.js");
require("dotenv").config({ path: "./minecraft.env" });

const serviceAccount = require("./serviceAccountKey.json"); // path to your downloaded key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(express.json());
app.use(cors());

const playersLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 5 requests per windowMs
  message: { error: "Too many requests, please slow down" }
});

/* -------- Login/Register -------- */
app.get("/players/login", /*playersLimiter,*/ async (req, res) => {
	const name = req.query.name,
			  uuid = req.query.uuid;
	
	console.log(`[Server][GET] Request to /players/login (name: ${name}, uuid: ${uuid}) KEY: ${req.headers?.key === process.env.PLAYER_LOGIN_KEY ? "process.env.PLAYER_LOGIN_KEY" :req.headers?.key }`);
	
	if (req.headers?.key !== process.env.PLAYER_LOGIN_KEY) return res.status(401).send({ error: "Invalid key!" });
	
	try {
		if (uuid) {
			const doc = await db.collection("players").doc(uuid).get();
			if (!doc.exists) {
				const playerData = utils.newPlayerTemplate(name);
				await db.collection("players").doc(uuid).set(
					playerData
				);
				console.log(`[Server][GET] Registered player ${name} (${uuid})`);
				res.send(doc.data());
			} else res.send(doc.data());
		} else if (name) {
			const snapshot = await db.collection("players").where("name", "==", name).get();
			if (snapshot.empty) {
				const playerData = utils.newPlayerTemplate(name);
				await db.collection("players").doc(uuid).set(
					playerData
				);
				console.log(`[Server][GET] Registered player ${name} (${uuid})`);
				res.send(doc.data());
			} else {
				const players = snapshot.docs.map(doc => ({ ...doc.data() }));
			  res.send(players[0]);
			}
		} else {
			res.status(400).send({ error: "Please provide a name or uuid" });
		}
	} catch (err) {
		console.error(`[Server][GET] ERROR on /players/login\n ${err}`);
		return res.status(500).send({ error: "Internal server error!" });
	}
});
/* -------------------------------- */

/* -------- Logout -------- */
app.post("/players/logout", async (req, res) => {
	if (!req.body) return res.status(404).send({ error: `Player Data not found!` });
	const playerData = req.body;
	
	console.log(`[Server][POST] Request to /players/logout (name: ${playerData.player.name}, uuid: ${playerData.uuid}) KEY: ${req.headers?.key === process.env.PLAYER_UPDATE_KEY ? "process.env.PLAYER_UPDATE_KEY" : req.headers?.key }`);
	
	if (req.headers?.key !== process.env.PLAYER_UPDATE_KEY) return res.status(401).send({ error: "Invalid key!" });
	
	try {
		await db.collection("players").doc(playerData.uuid).set(playerData.player);
		res.send({ message: `Successfully updated account for ${playerData.player.name} (${playerData.uuid})` });
	} catch (err) {
		console.error(`[Server][POST] ERROR on /players/logout\n ${err}`);
		return res.status(500).send({ error: "Internal server error!" });
	}
});

/* -------- Gems -------- */

const packages = {
	"gems_170": 170,
	"gems_380": 380,
	"gems_730": 730,
	"gems_1650": 1650
};

app.post("/shop/buygems", async (req, res) => {
	const name = req.body.name,
			  uuid = req.body.uuid,
				package = req.body.package;
	
	console.log(`[Server][POST] Request to /shop/buygems (name: ${name}, uuid: ${uuid}) KEY: ${req.headers?.key === process.env.SHOP_BUY_GEMS ? "process.env.SHOP_BUY_GEMS" : req.headers?.key }`);
	
	if (req.headers?.key !== process.env.SHOP_BUY_GEMS) return res.status(401).send({ error: "Invalid key!" });
	
	try {
		const playerRef = db.collection("players").doc(uuid);
		const gems = packages[package];
		await playerRef.update({
			gems: admin.firestore.FieldValue.increment(gems)
		});
		
		const docSnap = await playerRef.get();
		const data = docSnap.data();
		console.log(`[Server][POST] on /shop/buygems: ${name}'s gems: ${data.gems}`);
		res.send({ message: `${name}'s gems: ${data.gems}` });
	} catch (err) {
		console.error(`[Server][POST] ERROR on /shop/buygems\n ${err}`);
		return res.status(500).send({ error: "Internal server error!" });
	}
});
/* ------------------------ */

app.listen(process.env.PORT, () => {
	console.log(`Server running on PORT ${process.env.PORT}`);
});