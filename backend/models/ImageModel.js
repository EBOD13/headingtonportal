const mongoose = require('mongoose')

const ImageSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    }

})

const ImageModel = mongoose.model('ImageModel', ImageSchema)

module.exports = ImageModel