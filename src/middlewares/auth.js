const jwt = require('jsonwebtoken')
const { promisify} = require('util')

const authConfig = require('../configs/auth')

module.exports = async (req, res, next)=>{
    const authHeader = req.headers.authorization

    if(!authHeader){
        return res.status(401).json({ error: 'Token not provided'})
    }
    //Utilizando somente segunda posição do array, para obter o token
    const [, token] = authHeader.split(' ')

    try{        
        const decoded = await promisify(jwt.verify)(token, authConfig.secret)

        req.userId = decoded.id

        return next()

    }catch(err){
        return res.status(401).json({error: 'Token invalid'})
    }
}