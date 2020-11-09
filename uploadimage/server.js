const express = require("express");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");


const app = express();

const port = process.env.PORT || 9000;

//middlewares
app.use(bodyParser.json());
app.use(methodOverride("_method"));


app.set("view engine", "ejs");



//int gfs
let gfs;

//mongoose connection
const connection_url = "mongodb+srv://admin:OjETXUtYAEPYaie6@cluster0.bahnf.mongodb.net/dbimage?retryWrites=true&w=majority";
const con = mongoose.createConnection(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology: true,
});

con.once('open',  ()=> {
    gfs = Grid(con.db, mongoose.mongo);
    gfs.collection("uploads")

    // all set!
});

//storage init
const storage = new GridFsStorage({
    url: connection_url,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                //bucket name should match the collection name above
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

//post upload
app.post("/upload",upload.single('file'),(req,res)=>{
    res.render("/")
});

//display all files in json format
app.get("/files",(req,res)=>{
    gfs.files.find().toArray((error,file)=>{
        //if file does not exist
        if(!file || file.length===0){
            res.status(404).json({
                error: "file does not exist"
            })
        }
        //if files exist
        return res.json(file)
    })
});

//get single file base on files name
app.get("/files/:filename",(req,res)=>{
    console.log(req)
    gfs.files.findOne({filename:req.params.filename},(error,file)=>{
        //if file does not exist
        if(!file || file.length===0){
            res.status(404).json({
                error: "file does not exist"
            })
        }
        //if files exist
        return res.json(file)
    })
});

//display image using api get route
app.get("/image/:filename",(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(error,file)=> {
        //if file does not exist
        if (!file || file.length === 0) {
            res.status(404).json({
                error: "file does not exist"
            })
        }
        if (file.contentType === "image/jpeg" || file.contentType === "img/png" || file.contentType === "image/png") {
            //read image
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res)
        } else {
            res.status(404).json({
                error: "file does not exist"
            })
        }
    })
    });


app.get("/",(req,res)=>{
    res.render("index")
});

app.listen(port,()=>console.log(`listening to: ${port}`));
