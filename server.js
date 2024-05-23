const cors = require('cors');
const dotenv = require('dotenv');
const express = require("express");
const path = require('path')
const {Replicate} = require('./index')
const cloudinary = require('cloudinary')
const fileUpload= require('express-fileupload')
const replicate = new Replicate({
    auth: 'r8_3e21gXzGH7og2Bv7apO7JLlk085Cakg0zEQwf',
});

const app = express();
const model = "andreasjansson/blip-2:4b32258c42e9efd4288bb9910bc532a69727f9acd26aa08e175713a0a857a608";
app.use(fileUpload({
    useTempFiles:true
}))
const input = {
  image: "https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&dpr=1&w=1000",
  question: "name"
};
async function output(input){
    const result = await replicate.run(model, { input });
    console.log(result)
}


const corsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

// Load environment variables
dotenv.config();
// Create Express server

//public 
app.use('/public',express.static('public'))


app.listen(3000,()=>{
    console.log("App is running at http://localhost:%d ",3000);
})


// Express configuration
app.use(express.json());

// CORS configuration
app.use(cors(corsOptions));
app.options("*", cors);
cloudinary.config({ 
    cloud_name: 'golchi', 
    api_key: '929697753175682', 
    api_secret: process.env.CLOUD 
});
app.post("/",async (req,res,next)=>{
    const file = req.files.image
    cloudinary.v2.uploader.upload(file.tempFilePath,async(err,result)=>{
        if(err) return res.json("error",err)
        else{
            input.image = result.url;
            input.question = req.body.question
            console.log(input.question)
            const doc = await replicate.run(model, { input });
            console.log(doc)
            res.json(doc);
        }
    })
})

app.post("/vision", async(req,res,next)=>{
    const file = req.files.image
    console.log(file)
    const headers = {
        'Content-Type':'application/json',
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Methods':'POST,PATCH,OPTIONS'
    }
    fetch('https://visionplayground.azurewebsites.net/api/images', {
        headers:headers,
        method: 'POST',
        body: {file:file}
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        responseText.textContent = data;
        hideLoader();
        // Show response in a prompt
        alert(data);
    })
    .catch(error => {
        console.error('Error sending image:', error);
        hideLoader();
        // Show error message in a prompt
        alert('Error occurred while processing image.');
    });
})

module.exports = app;
