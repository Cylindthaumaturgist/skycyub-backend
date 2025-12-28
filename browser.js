const express = require("express");
const cors = require("cors");
const admin = require("./firebase")
const rateLimit = require("express-rate-limit");
const fs = require("fs/promises");

//const utils = require("./utils.js");
require("dotenv").config({ path: "./browser.env" });

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

//const RFTRequestsHistory = getFileContent(files[0]) || [];

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
	"gems_380": 150,
	"gems_750": 350,
	"gems_1730": 900,
	"gems_4720": 2400,
	"gems_8970": 4400
};

app.post("/shop/buygems", async (req, res) => {
	const { name, uuid, package, paymentMethod, payment, timestamp, amount } = req.body;
	
	console.log(`[Bearer][POST] Request to /shop/buygems (name: ${name}, uuid: ${uuid}) KEY: ${req.headers?.key === process.env.SHOP_BUY_GEMS ? "process.env.SHOP_BUY_GEMS" : req.headers?.key }`);
	
	if (req.headers?.key !== process.env.CLIENT_SHOP_BUY_GEMS) return res.status(401).send({ error: "Invalid key!" });
	
	try {
		if (paymentMethod === "rft") {
			onPendingRFTRequests.push({
				sender: payment.wallet,
				name,
				uuid,
				timestamp,
				package,
				amount
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
			console.log(amount - fee, packagesToRFT[package] * foundSender.amount)
			if ((amount - fee) >= (packagesToRFT[package] * foundSender.amount)) {
			  const request = await fetch("http://192.168.1.2:3000/1/shop/buygems", {
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
				/*RFTRequestsHistory.push({
					...foundSender
				});
				await writeFileContent(files[0], RFTRequestsHistory);*/
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

module.exports = app;