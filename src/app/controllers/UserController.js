const Yup = require('yup')
const User = require('../models/User')
const File = require('../models/File')

class UserController {
    async store(req, res){
        //Verifica se e-mail já está sendo utilizado
        const userExists = await User.findOne({ where : {email: req.body.email}})
        if(userExists){
            return res.status(400).json({
                "error" : "User already exists."
            })
        }

        const { id, name, email, provider } = await User.create(req.body)
        
        return res.json({
            id, name, email, provider
        })
    }

    async update(req,res){
        //Criando schema de validação das informações de entrada
        try{            
            const { email, oldPassword} = req.body
    
            const user = await User.findByPk(req.userId)
            //Compara se está alterando e-mail
            if(email !== user.email){
                //Verfica se o novo e-mail já existe cadastrado
                const userExists = await User.findOne({ where : {email}})
                if(userExists){
                    return res.status(400).json({
                        "error" : "User already exists."
                    })
                }
    
            }
            //Verificar se a senha antiga está corretá
            if (oldPassword && !(await user.checkPassword(oldPassword)))
            {
                return res.status(401).json({ error: 'Password does not match'})
            }
    
            await user.update(req.body)
    
            const {id, name, provider, avatar } = await User.findByPk(req.userId, {
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['id', 'path', 'url']
                }]
            })
            return res.json({
                id, name, email, provider, avatar
            })
        }catch(err){
            return res.json({ erro : err.message})
        }
        
    }
}

module.exports = new UserController