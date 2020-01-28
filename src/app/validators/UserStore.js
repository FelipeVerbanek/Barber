const Yup = require('yup')
//Criando schema de validação das informações de entrada

module.exports = async (req, res, next)=> {
    try{
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string().email().required(),
            password: Yup.string().required().min(6)
        })

        await schema.validate(req.body, {abortEarly: false})

        return next();
    }catch(err){
        return res.status(400).json({error: err.inner})
    }
} 






