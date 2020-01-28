const { Router } = require('express')
const multer = require('multer')
const multerConfig = require('./configs/multer')

const AuthMiddleware = require('./app/middlewares/auth')

const UserController = require('./app/controllers/UserController')
const SessionController = require('./app/controllers/SessionController')
const FileController = require('./app/controllers/FileController')
const ProviderController = require('./app/controllers/ProviderController')
const AppointmentController = require('./app/controllers/AppointmentController')
const SheduleController = require('./app/controllers/ScheduleController')
const NotificationController = require('./app/controllers/NotificationController')
const AvailableController = require('./app/controllers/AvailableController')

const validateUserStore = require('./app/validators/UserStore')
const validateUserUpdate = require('./app/validators/UserUpdate')
const validateAppointment = require('./app/validators/AppointmentStore')

const routes = new Router()
const upload = multer(multerConfig)


routes.post('/users',validateUserStore, UserController.store)
routes.post('/sessions', SessionController.store)

routes.use(AuthMiddleware)//Verifica autenticação
//Routas que precisa de autenticação
routes.put('/users',validateUserUpdate, UserController.update)

routes.get('/providers', ProviderController.index)
routes.get('/providers/:providerId/available', AvailableController.index)
//Upload do avatar
routes.post('/files', upload.single('file'),FileController.store)

routes.post('/appointments', validateAppointment, AppointmentController.store )
//Listar os agendamentos
routes.get('/appointments',AppointmentController.index)
//Listar os agendamentos do provider
routes.delete('/appointments/:id',AppointmentController.delete )

routes.get('/schedules', SheduleController.index )

routes.get('/notifications', NotificationController.index)
routes.put('/notifications/:id', NotificationController.update)

module.exports = routes