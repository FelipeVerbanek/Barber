

const Yup = require('yup')
const { startOfHour, parseISO, isBefore, format, subHours} = require('date-fns')
const pt = require('date-fns/locale/pt')
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const File = require('../models/File')
const Notification = require('../schemas/Notification')

const CancellationMail = require('../jobs/CancellationMail')
const Queue = require('../../lib/Queue')

class AppointmentController{
    async index(req, res){
        const {page =  1} = req.query
        console.log(page)
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

        return res.json(appointments)
    }
    async store(req,res){
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required()
        })

        if(!schema.isValid(req.body)){
            return res.status(400).json({error: 'Validation fails!'})
        }

        const {provider_id, date} = req.body
        if(provider_id == req.userId){
            return res.status(400).json({error: "you can't create a schedule for yourself"})
        }

        const isProvider = await User.findOne({
            where: { id: provider_id, provider:true}
        })
        if(!isProvider){
            return res.status(400).json({ error: 'You can only create appointments with providers'})
        }
        
        const hourStart = startOfHour(parseISO(date))
        //Validando se a data já se passou
        if(isBefore(hourStart, new Date())){
            return res.status(400).json({error: 'Past dates are not permitted'})
        }

        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart
            }
        })

        if(checkAvailability){
            return res.status(400).json({
                error: 'Appointment date is not available'
            })
        }

        const appointment = await Appointment.create( {
            user_id: req.userId,
            provider_id,
            date: hourStart
        } )

        /*
            Notificar provedor de serviços
        */

        const user  = await User.findByPk(req.userId)
        const formattedDate = format(
            hourStart,
            "'dia' dd 'de' MMMM', às' H:mm'h'" ,
            { locale: pt }
        )
        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formattedDate}`,
            user: provider_id
        })

        return res.json(appointment)
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
        
        return res.json(appointment)
    }
}

module.exports = new AppointmentController