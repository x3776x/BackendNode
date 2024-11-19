const {rol} = require ('../models')

let self = {}

// GET: api/roles
self.getAll = async function (req, res) {
    let data = await rol.findAll({ attributes: ['id', 'nombre']})
    res.status(200).json(data)
}

module.exports = self