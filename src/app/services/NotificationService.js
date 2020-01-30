const { format} = require('date-fns')
const pt = require('date-fns/locale/pt')
const Notification = require('../schemas/Notification')
const User = require('../models/User')

class NotificationService{

    async run({userId, provider_id, hourStart}){
        try{
            const user  = await User.findByPk(userId)
            const formattedDate = format(
                hourStart,
                "'dia' dd 'de' MMMM', às' H:mm'h'" ,
                { locale: pt }
            )
            await Notification.create({
                content: `Novo agendamento de ${user.name} para ${formattedDate}`,
                user: provider_id
            })
        }catch(err){
            throw new Error(err.message)
        }

    }
}

module.exports = new NotificationService();