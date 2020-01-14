const jwt = require('jsonwebtoken')
const Yup = require('yup')

const User = require('../models/User')
const File = require('../models/File')
const authConfig = require('../../configs/auth')

class SessionController {
    async store(req, res){

        const schema = Yup.object().shape({
            email: Yup.string().email().required(),
            password: Yup.string().required()
        })

        if(!(await schema.isValid(req.body))){
            return res.json({error: 'Validation fails'})
        }

        const {email, password} = req.body
        
        console.log(req.body)
        const user = await User.findOne({
            where : {email} ,
            include: [{
                model: File,
                as: 'avatar',
                attribute: ['id','path', 'url']
            }] 
            
        })

        if(!user){
            return res.status(401).json({ error: 'User not found'})
        }
        if(!(await user.checkPassword(password))){
            return res.status(401).json({error: 'Password does not match'})
        }

        const {id, name, avatar, provider } = user

        return res.json({
            user:{
                id,
                name,
                email,
                avatar,
                provider
                
            },
            token: jwt.sign({ id }, authConfig.secret, {
                expiresIn: authConfig.expiresIn               
            })
        })
    }
}

module.exports = new SessionController