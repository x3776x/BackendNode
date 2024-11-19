const { singularize } = require('sequelize/lib/utils')
const { archivo } = require('../models')
const fs = require("fs")
const { where } = require('sequelize')

let self = {}

// GET: api/archivos
self.getAll = async function (req, res, next) {
    try{
        let data = await archivo.findAll({ atributes: [['id', 'archivoId'], 'mime', 'indb', 'nombre', 'size']})
        res.status(200).json(data)
    } catch (error){
        next(error)
    }
}

// GET: api/archivos/5/detalle
self.getDetalle = async function (req, res, next) {
    try{
        let id = req.params.id
        let data = await archivo.findByPk(id, {atributes: [['id', 'archivoid'], 'mine', 'indb', 'nombre', 'size']})
        if(data)
            res.status(200).json(data)
        else
            res.status(404).send()
    } catch (error){
        next(error)
    }
}

// GET: api/archivos/5
self.get = async function (req, res, next) {
    try{
        let id = req.params.id
        let data = await archivo.findByPk(id)
        if(!data)
            return res.status(404).send()

        let imagen = data.datos
        if(!data.indb)
            imagen = fs.readFileSync("uploads/" + data.nombre)

        res.status(200).contentType(data.mime).send(imagen)
    } catch(error){
        next(error)
    }
}

// POST: api/archivos
self.create = async function (req, res, next) {
    try{
        console.log(req.file)
        if(req.file == undefined) return res.status(400).json('El archivo es obligatorio. ');

        let binario = null;
        let indb = false;
        if (process.env.FILES_IN_BD == "true") {
            binario = fs.readFileSync("uploads/" + req.file.filename)
            fs.existsSync("uploads/" + req.file.filename) && fs.unlinkSync("uploads/" + req.file.filename)
            indb = true;
        }
    // Crea el registro 
    let data = await archivo.create({
        mime: req.file.mimetype,
        indb: indb, 
        nombre: req.file.filename, 
        size: req.file.size, 
        datos: binario
    })

    // Bitacora
    req.bitacora("archivos.crear", data.id)
    //Envia la respuesta
    res.status(201).json({
        id: data.id, 
        mime: req.file.mimetype,
        indb: indb, 
        nombre: req.file.filename
    })
    } catch (error) {
        next(error)
    }

}

// PUT: api/archivos/5
self.update = async function (req, res, next) {
    try {
        if (req.file == undefined) return res.status(400).json('El archivo es obligatorio.');

        let id = req.params.id
        let imagen = await archivo.findByPk(id)
        if (!imagen) {
            fs.existsSync("uploads/" + req.file.filename) && fs.unlinkSync("uploads/" + req.file.filename)
            return res.status(404).send()
        }

        let binario = null;
        let indb = false;
        if (process.env.FILES_IN_BD == "true") {
            binario = fs.readFileSync("uploads/" + req.file.filename)
            fs.existsSync("uploads/" + req.file.filename) && fs.unlinkSync("uploads/" + req.file.filename)
            indb = true;
        }

        // Modifica el registro
        let data = await archivo.update({
            mime: req.file.mimetype,
            indb: indb,
            nombre: req.file.filename,
            size: req.file.size,
            datos: binario
        }, { where: { id: id } })

        // Bitacora
        req.bitacora("archivos.editar", id)
        // Envía la respuesta
        if (data[0] == 0)
            return res.status(404).send()

        // Eliminamos el archivo anterior
        if (!imagen.indb)
            fs.existsSync("uploads/" + imagen.nombre) && fs.unlinkSync("uploads/" + imagen.nombre)

        res.status(204).send()
    } catch (error) {
        next(error)
    }
}


//DELTE: api/archivos/5
self.delete = async function (req, res, next) {
    try{
        const id = req.params.id
        let imagen = await archivo.findByPk(id)
        if(!imagen)
            return res.status(404).send()

        let data = await archivo.destroy({where: {id: id}})
        if(data === 1){
            //Bitacora
            req.bitacora("archivos.eliminar", id)
            //Eliminamos el archivo anterior
            if(!imagen.indb)
                fs.existsSync("uploads/" + imagen.nombre) && fs.unlinkSync("uploads/" + imagen.nombre)
            return res.status(204).send()
        }
        res.status(404).send()
    } catch(error){
        next(error)
    }
}

module.exports = self