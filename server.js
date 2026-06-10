const express = require('express');
const path = require('path');
const server = express();


server.use(express.static("public"));

server.listen(8080, () => {
    console.log("Server is running on 8080");
});

