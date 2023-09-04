import {readFileSync, writeFileSync } from "fs";
import http from "http";
import fs from "fs";


class FileServer{
    
    constructor(ipAddress = None, port = None, callback = ()=> console.log("Started Server")){
        this.ipAddress = ipAddress;
        this.port = port;
        this.cb = callback;
        this.httpServer = http.createServer();

        this.headers = {
                'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
                'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
                'Access-Control-Max-Age': 2592000, // 30 days
                /** add other headers as per requirement */
            }

        this.filePaths = {};
    }

    filePathExist(urlPath){
        
        if(Object.keys(this.filePaths).indexOf(urlPath) > -1) return true;
        else return false;
    }
    
    getUrlPathMethods(urlPath){
        return this.filePaths[urlPath].methods;
    }

    getUrlPathFunctions(urlPath){
        return this.filePaths[urlPath].functions;
    }

    getUrlPaths(){
        return Object.keys(this.filePaths);
    }

    setMethod(urlPath, method, cb){
        this.filePath[urlPath].methods.push(method.toUpperCase());
        this.filePaths[urlPath].functions.push(cb);
        return null;
    }

    setUrlPath(urlPath, method, cb){
        if(this.filePathExist(urlPath)){
            console.log("File Path Exists Already, use setMethod method");
            return null;
        };

        this.filePaths[urlPath] = {
            methods:[method],
            functions:[cb]
        };
        return null;
    }

    setMultipleUrlPaths(urlPaths, methods, cbs){
        const arrayLength = urlPaths.length;
        if(methods.length !== arrayLength && cbs.length !== arrayLength){
            console.log("All the arrays are not the same length, all arrays need to be the same length");
            return null;
        }
        for(let i = 0; i < arrayLength; i++) this.setUrlPath(`/${urlPaths[i]}`, methods[i], cbs[i]);
        return null;
    }

    pageNotFound(req, res){
        console.log("This url path was not found: " + req.url);
        res.writeHead(404, this.headers)
        res.end("Filepath does not exist")
    }

    start(){
        this.httpServer.on("request", (req, res)=>{
            console.log("Recieved Client Request!");
            const urlPath = req.url.replace(/%20/g, " ").replace(/%E2%80%90/g, "-");//regex expression to convert '%20' from the url to spaces
            
            const method = req.method;

            if(!this.filePathExist(urlPath)) {
                console.log("Error with the key name")
                this.pageNotFound(req,res);
                return null;
            }

            const index = this.getUrlPathMethods(urlPath).indexOf(method);

            if(index < 0) {
                this.pageNotFound(req, res);
                return null;
            }

            const methodFunction = this.filePaths[urlPath].functions[index];

            methodFunction(req, res, this.headers, this);
            return null;
        })

        this.httpServer.listen(this.port,this.ipAddress, this.cb)
    }

}

function receiveFile(req, res, headers, serverInstance){
    let dataRecieved = "";
    req.on("data", stream=>{
        dataRecieved+=stream
    })

    req.on("end", () =>{
        console.log("Finished Recieving Data")
        const data = JSON.parse(dataRecieved);
        writeFileSync(`../BasicWebFileExplorerDownloads/${data.name}`, Buffer.from(data.data, "base64"))
        serverInstance.setUrlPath(`/${data.name}`, "GET", sendFile);
    })

    res.writeHead(200, headers);
    res.end("Success");
    
}

function sendFileNames(req, res, headers){
    const fileData = fs.readdirSync("../BasicWebFileExplorerDownloads");
    
    res.writeHead(200, headers);
    res.end(JSON.stringify({
        files:fileData.filter(file => file !== ".DS_Store"),
    }))
}

function sendFile(req, res, headers){
    const reqFile = req.url.replace(/%20/g, " ").replace(/%E2%80%90/g, "-"); //regex expression to convert '%20' from the url to spaces
    const fileData = readFileSync(`../BasicWebFileExplorerDownloads/${reqFile}`);
    res.writeHead(200, headers);
    res.end(fileData);

}

function main(){
    const fileServer = new FileServer("192.168.1.104", 8080, ()=> console.log("started"));
    fileServer.setUrlPath("/upload", "POST", receiveFile);
    fileServer.setUrlPath("/files", "GET", sendFileNames);

    const files = fs.readdirSync("../BasicWebFileExplorerDownloads");
    const fileMethods = files.map(()=>"GET");
    const fileCbs = files.map(()=>sendFile);
    
    fileServer.setMultipleUrlPaths(files, fileMethods, fileCbs);
    fileServer.start();
}

main();