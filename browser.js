const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const fs = require("fs/promises");

//const utils = require("./utils.js");
require("dotenv").config({ path: "./browser.env" });

const serviceAccount = require("./serviceAccountKey.json"); // path to your downloaded key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(express.json());
app.use(cors());

async function getFileContent(file) {
	const data = await fs.readFile(file, 'utf8');
	const json = JSON.parse(data);
	return json;
}

async function writeFileContent(file, json) {
	await fs.writeFile(file, JSON.stringify(json, null, 2))
}

const files = [
	"rft-req-history.json"
];

const RFTRequestsHistory = getFileContent(files[0]) || [];

const PENDING_EXPIRE = 5 * 60 * 1000 // 5 minutes

function cleanupRequests(pendingRequests) {
  const now = Date.now()
  for (let i = pendingRequests.length - 1; i >= 0; i--) {
    if (now - pendingRequests[i].timestamp > PENDING_EXPIRE) {
      pendingRequests.splice(i, 1)
    }
  }
}

/* -------- Gems -------- */
const onPendingRFTRequests = [];

setInterval(() => cleanupRequests(onPendingRFTRequests), 60 * 1000)

const packagesToRFT = {
	"gems_170": 220,
	"gems_380": 390,
	"gems_730": 800,
	"gems_1650": 1500
};

app.post("/shop/buygems", async (req, res) => {
	const { name, uuid, package, paymentMethod, payment, timestamp } = req.body;
	
	console.log(`[Bearer][POST] Request to /shop/buygems (name: ${name}, uuid: ${uuid}) KEY: ${req.headers?.key === process.env.SHOP_BUY_GEMS ? "process.env.SHOP_BUY_GEMS" : req.headers?.key }`);
	
	if (req.headers?.key !== process.env.CLIENT_SHOP_BUY_GEMS) return res.status(401).send({ error: "Invalid key!" });
	
	try {
		if (paymentMethod === "rft") {
			onPendingRFTRequests.push({
				sender: payment.wallet,
				name,
				uuid,
				timestamp,
				package
			});
			console.log(onPendingRFTRequests)
		}
	} catch (err) {
		console.error(`[Bearer][POST] ERROR on /shop/buygems\n ${err}`);
		return res.status(500).send({ error: "Internal server error!" });
	}
});

app.post("/shop/rftpaymentconfirmationgems", async (req, res) => {
	const { sender, reciever, amount, fee } = req.body;
	console.log(`[Bearer][POST] Request to /shop/rftpaymentconfirmationgems (sender: ${sender}, reciever: ${reciever}, amount: ${amount}) KEY: ${req.headers?.key === process.env.RFT_REQUEST_PAYMENT_CONFIRMATION_GEMS ? "process.env.RFT_REQUEST_PAYMENT_CONFIRMATION_GEMS" : req.headers?.key }`);
	
	if (req.headers?.key !== process.env.RFT_REQUEST_PAYMENT_CONFIRMATION_GEMS) return res.status(401).send({ error: "Invalid key!" });
	
	try {
		const foundSender = onPendingRFTRequests.find(rftreq => rftreq.sender === sender);
		console.log(foundSender)
		if (foundSender) {
			const { name, uuid, package } = foundSender;
			console.log(amount - fee)
			if ((amount - fee) >= packagesToRFT[package]) {
			  const request = await fetch("http://192.168.1.2:3000/shop/buygems", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						key: process.env.SHOP_BUY_GEMS
					},
					body: JSON.stringify({
						name, uuid, package
					})
				});
				const resolve = await request.json();
				const index = onPendingRFTRequests.indexOf(foundSender)
				if (index !== -1) {
					onPendingRFTRequests.splice(index, 1);
				}
				RFTRequestsHistory.push({
					...foundSender
				});
				await writeFileContent(files[0], RFTRequestsHistory);
				console.log(`[Bearer][POST] Response from backend/shop/buygems: \n${JSON.stringify(resolve, null, 2)}`);
				res.send(resolve);
			}
		}
	} catch (err) {
		console.error(`[Bearer][POST] ERROR on /shop/rftpaymentconfirmationgems\n ${err}`);
		return res.status(500).send({ error: "Internal server error!" });
	}
});
/* ---------------------- */

app.listen(process.env.PORT, () => {
	console.log(`Bearer running on PORT ${process.env.PORT}`);
});