const express = require('express');
const path = require('path');
const routes = require('./routes');
require('./database/index')

class App{
    constructor(){
        this.server = express();
        this.moddlewares();
        this.routes();
    }    

    moddlewares() {
        this.server.use(express.json());
        this.server.use('/files', express.static(path.resolve(__dirname, '..', 'temp', 'uploads')))
    }

    routes(){
        this.server.use(routes)
    }
}

module.exports = new App().server