import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/')
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now() + String(Math.floor(Math.random() * 1000))}${path.extname(file.originalname)}`
        cb(null, file.fieldname + "-" + fileName)
    }
});

const fileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
        return cb(new Error("Por favor, envie apenas arquivos png ou jpg!"))
    }
    cb(undefined, true)
}

const upload = multer({
    storage,
    limits: {
        fileSize: 4 * 1024 * 1024
    },
    fileFilter
})

export {upload} 