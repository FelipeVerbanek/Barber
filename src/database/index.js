const Sequelize = require('sequelize')
const User = require('../app/models/User')
const File = require('../app/models/File')
const Appointment = require('../app/models/Appointment')

const databaseConfig = require('../configs/database')

const models = [User, File, Appointment]

class Database {
    constructor(){
        this.init()
    }
    init(){
        this.connection = new Sequelize(databaseConfig)
        models
            .map(model => model.init(this.connection))
            .map(model => model.associate && model.associate(this.connection.models))
    }
}

module.exports = new Database()