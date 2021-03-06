

const { isBefore,  subHours} = require('date-fns')

const Appointment = require('../models/Appointment')
const User = require('../models/User')
const File = require('../models/File')

const Cache = require('../../lib/Cache')
const createAppointmentService = require('../services/CreateAppointmentService')

const CancellationMail = require('../jobs/CancellationMail')
const Queue = require('../../lib/Queue')

class AppointmentController{
    async index(req, res){
        const {page =  1} = req.query        
        
        const cacheKey = `user:${req.userId}:appointments:${page}`
        const cached = await  Cache.get(cacheKey)

        if(cached){
            return res.json(cached)
        }

        //Buscando as informações dos appointment, provider, avatar
        const appointments = await Appointment.findAll({
            where: {
                user_id: req.userId, canceled_at:null
            },
            order: ['date'],
            attributes: ['id','date', 'past', 'cancelable'],
            limit: 20,
            offset: (page - 1)  * 20,
            include:[{
                model:User,
                as: 'provider',
                attributes: ['id','name'],
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['id','path','url']
                }]
            }]
        })

        await Cache.set(cacheKey, appointments)

        return res.json(appointments)
    }
    async store(req,res){
        
        const {provider_id, date} = req.body
        try{
            const appointment = await createAppointmentService.run({ provider_id, userId: req.userId, date})
            

            return res.json(appointment)

        }catch(err){
            return res.status(401).json({error: err.message})
        }
        
    }

    async delete(req, res){

        const appointment = await Appointment.findByPk(req.params.id,{
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name','email']
                },
                {   
                    model: User,
                    as: 'user',
                    attributes: ['name']
                }
            ]
        })

        if(appointment.user_id !== req.userId){
            return res.status(401).json({
                error: "You don't have permission to cancel this appointment"
            })
        }
        //Diminui 2 hrs e verifica se o resultado é menor que a hora atual
        const dateWithSub = subHours(appointment.date, 2)
        if(isBefore(dateWithSub, new Date())){
            return res.status(401).json({error: 'You can only cancel appointments 2 hours in advance'})
        }

        appointment.canceled_at = new Date()

        await appointment.save()
        
        await Queue.add(CancellationMail.key, {
            appointment
        })

        await Cache.invalidatePrefix(`user:${req.userId}:appointments`)

        return res.json(appointment)
    }
}

module.exports = new AppointmentController