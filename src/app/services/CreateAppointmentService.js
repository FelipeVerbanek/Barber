const { startOfHour, parseISO, isBefore, format} = require('date-fns')

const Appointment = require('../models/Appointment')
const User = require('../models/User')
const serviceNotification = require('./NotificationService')

const Cache = require('../../lib/Cache')

class CreateAppointmentService{

    async run({ provider_id, userId, date }){

        if(provider_id == userId){
            throw new Error("you can't create a schedule for yourself")
        }
    
        const isProvider = await User.findOne({
            where: { id: provider_id, provider:true}
        })
        if(!isProvider){
            throw new Error("You can only create appointments with providers")
        }
        
        const hourStart = startOfHour(parseISO(date))
        //Validando se a data já se passou
        if(isBefore(hourStart, new Date())){
           throw new Error("Past dates are not permitted")
        }
    
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart
            }
        })
    
        if(checkAvailability){
            throw new Error('Appointment date is not available')            
        }
    
        const appointment = await Appointment.create( {
            user_id: userId,
            provider_id,
            date: hourStart
        } )

        await serviceNotification.run({userId, provider_id, hourStart})

        await Cache.invalidatePrefix(`user:${userId}:appointments`)

        return appointment
        

    }
}

module.exports = new CreateAppointmentService()