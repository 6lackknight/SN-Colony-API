const express = require("express")
const multer = require("multer")
const bodyParser = require("body-parser")
const colony = require("./colony.js")

const { getNetworkClient } = require("@colony/colony-js-client")
const { open } = require("@colony/purser-software")
const BN = require("bn.js")


const app = express()
const upload = multer()

var colonyClient = null

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ extended: true, limit: "1mb" }))


app.post("/", upload.array(), async(req, res, next) =>{
	console.log(req.body)
})

app.post("/colony/domains/create", upload.array(), async(req, res, next) =>{
	var task_specifics = req.body

	// Create a domain
	new_domain = await colonyClient.addDomain.send({ parentDomainId: 1 })
	res.status(200).json({ new_domain })

})

app.get("/colony/domains/count", async(req, res, next) => {
	domain_count = await colonyClient.getDomainCount.call()
	res.status(200).json(domain_count)
})

app.get("/colony/domains/view/:id", async(req, res, next) =>{
	// Create a domain
	found_domain = await colonyClient.getDomain.call({ domainId: req.params.id })
	res.status(200).json(found_domain)
})

app.post("/colony/create", upload.array(), async(req, res, next) => {
	var result = {}
	var config = req.body

	const wallet = await open({
		  privateKey: config.wallet,
	})

	// Check out the logs to see the wallet address
	console.log("Wallet Address:", wallet.address)
	result["walletAddress"] = wallet.address

	// Get a network client instance
	const networkClient = await getNetworkClient(config["testNet"], wallet)

	// Check out the logs to see the network address
	console.log("Network Address:", networkClient.contract.address)
	result["networkAddress"] = networkClient.contract.address

	// Create a token using the network client instance
	const { meta: { receipt: { contractAddress: tokenAddress } } } = await networkClient.createToken.send({
		  symbol: config["tokenSymbol"],
	})

	// Check out the logs to see the token address
	console.log("Token Address: ", tokenAddress)
	result["tokenAddress"] = tokenAddress


	// Create a colony using the network client instance
	const { eventData: { colonyAddress } } = await networkClient.createColony.send({
		  tokenAddress,
	})

	// Check out the logs to see the colony address
	console.log("Colony Address:", colonyAddress)
	result["colonyAddress"] = colonyAddress

	// Get a colony client instance using the network client instance
	colonyClient = await networkClient.getColonyClientByAddress(
		  colonyAddress,
	)

	// Set an admin using the colony client instance
	const admin_address = "0xD447E2a66f50EB067a9bFe52296354C629fD2214"
	await colonyClient.setAdminRole.send({
		  user: admin_address,
	})
	console.log("Colony Administrator set to: " + admin_address)
	result["colonyAdmin"] = admin_address

	// Set token owner
	const owner = config["tokenOwner"]
	await colonyClient.tokenClient.setOwner.send({ owner: colonyAddress })
	console.log("Colony Set as token owner")
	result["colonyAsTokenOwner"] = true

	// Mint some coin
	const mint_amount = new BN(config.mintAmount)
	await colonyClient.mintTokens.send({ amount: mint_amount})
	console.log("Successfully minted " + mint_amount + " tokens")
	result["mintedCoins"] = mint_amount

	console.log("Colony Successfully Created: ", result)

	res.status(200).json(result)
})

app.listen(80, () => console.log("API running on port :3000! \n OPG out."))
