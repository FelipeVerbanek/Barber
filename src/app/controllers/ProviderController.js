const User = require('../models/User')
const File = require('../models/File')

const Cache = require('../../lib/Cache')

class ProviderController {
    async index(req, res){

        const cached = await Cache.get('providers')

        if(cached){
            console.log('cache')
            return res.json(cached)
        }
        
        const providers = await User.findAll({
            where: { provider: true },
            attributes: ['id' , 'name', 'email', 'avatar_id'],
            include: [{
                model: File,
                as: 'avatar',
                attributes: ['name','path', 'url']
            }]
        })

        await Cache.set('providers', providers)

        return res.json(providers)
    }
}

module.exports = new ProviderController