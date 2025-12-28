const admin = require("./firebase")
const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")

const db = admin.firestore()
const transactionsRef = db.collection("transactions")
const jsonPath = path.join(__dirname, "transactions.json")

let storedTransactions = []
if (fs.existsSync(jsonPath)) {
  storedTransactions = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
}

function isTransactionStored(id) {
  return storedTransactions.some(tx => tx.id === id)
}

function saveTransactions() {
  fs.writeFileSync(jsonPath, JSON.stringify(storedTransactions, null, 2))
}

transactionsRef.onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async change => {
    if (change.type !== "added") return

    const txData = { id: change.doc.id, ...change.doc.data() }

    if (isTransactionStored(txData.id)) return

    if (txData.receiver === "rftDLURWRCxtc3LRrrCJTg2dtXWrCyPjyu") {
      try {
        await fetch("http://192.168.1.2:3000/0/shop/rftpaymentconfirmationgems", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            key: "jHTmuoxGdLYbDmUXgRJpeoXSQoGbkLZKmsBnQEhaHCjQMNorTjVMyUqdREJtVnhg"
          },
          body: JSON.stringify({
            sender: txData.sender,
            receiver: txData.receiver,
            amount: txData.amount,
            fee: txData.fee
          })
        })
      } catch (err) {
        console.error(err)
      }
    }

    storedTransactions.push(txData)
    saveTransactions()
  })
})