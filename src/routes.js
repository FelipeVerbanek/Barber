const { Router } = require('express')
const multer = require('multer')
const multerConfig = require('./configs/multer')

const AuthMiddleware = require('./middlewares/auth')

const UserController = require('./app/controllers/UserController')
const SessionController = require('./app/controllers/SessionController')
const FileController = require('./app/controllers/FileController')
const ProviderController = require('./app/controllers/ProviderController')
const AppointmentController = require('./app/controllers/AppointmentController')
const SheduleController = require('./app/controllers/ScheduleController')

const routes = new Router()
const upload = multer(multerConfig)

routes.post('/users',UserController.store)
routes.post('/sessions', SessionController.store)

routes.use(AuthMiddleware)//Verifica autenticação
//Routas que precisa de autenticação
routes.put('/users', UserController.update)

routes.get('/providers', ProviderController.index)
//Upload do avatar
routes.post('/files', upload.single('file'),FileController.store)

routes.post('/appointments',AppointmentController.store )
//Listar os agendamentos
routes.get('/appointments',AppointmentController.index)
//Listar os agendamentos do provider
routes.get('/schedules', SheduleController.index )

module.exports = routes