const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoserver;
let userservice;
let authservice;
let llmservice;
let gatewayservice;
let historyservice;
let questionservice;
let wikidataservice;

async function startServer() {
    console.log('Starting MongoDB memory server...');
    mongoserver = await MongoMemoryServer.create();
    const mongoUri = mongoserver.getUri();
    process.env.MONGODB_URI = mongoUri;
    console.log('MongoDB memory server started at:', mongoUri);    
    userservice = await require("../../users/userservice/user-service");
    authservice = await require("../../users/authservice/auth-service");
    llmservice = await require("../../llmservice/llm-service");
    historyservice = await require("../../historyservice/history-stats-service");
    questionservice = await require("../../questionsService/question-history-service");
    wikidataservice = await require("../../wikidataservice/wikidata-service");
    gatewayservice = await require("../../gatewayservice/gateway-service");
    
}

startServer();
