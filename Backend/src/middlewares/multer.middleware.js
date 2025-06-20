import multer from "multer";
import path from 'path';


let uploadCount = 0;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },
    // filename: function (req, file, cb) {
    //     cb(null, file.originalname)   // after completaion project, you can update this.
    // }



    // filename: function (req, file, cb) {
    //     uploadCount++; // increment count for each uploaded file

    //     // Get file extension (e.g. .jpg, .png)
    //     const ext = path.extname(file.originalname);

    //     const newFilename = `Avatar${uploadCount}${ext}`;

    //     cb(null, newFilename);
    // }



    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now();

        const newFilename = `${uniqueSuffix}${ext}`;

        cb(null, `Av${newFilename}`);
    },
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit

})


export const upload = multer({ storage })