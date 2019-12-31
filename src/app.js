require('dotenv/config')
const express = require('express');
const path = require('path');
require('express-async-errors')
const Sentry = require('@sentry/node')
const Youch = require('youch')
require('./database/index')

const routes = require('./routes');
const sentryConfig = require('./configs/sentry')

class App{
    constructor(){
        this.server = express();

        Sentry.init(sentryConfig)


        this.moddlewares();
        this.routes();
        this.exceptionHandler()
    }    

    moddlewares() {
        this.server.use(Sentry.Handlers.requestHandler());
        this.server.use(express.json());
        this.server.use('/files', express.static(path.resolve(__dirname, '..', 'temp', 'uploads')))
    }

    routes(){
        this.server.use(routes)
        this.server.use(Sentry.Handlers.errorHandler());
    }

    exceptionHandler(){
        this.server.use(async (err, req, res, next) => {
            if(process.env.NODE_ENV === 'development'){
                const errors = await new Youch(err, req).toJSON()

                return res.status(500).json(errors)
            }
            return res.status(500).json({error: 'Internal server error'})


        })
    }

}

module.exports = new App().server