const express = require("express")
const app = express()

app.use("/0", require("./browser"))
app.use("/1", require("./minecraft"))

app.listen(3000);