import { writeFile, writeFileSync } from "fs";
import http from "http";
import { url } from "inspector";

class FileServer{
    constructor(serverPath, ipAddress, port, callback){
        this.serverPath = serverPath;
        this.ipAddress = ipAddress;
        this.port = port;
        this.callback = callback;
        this.httpServer = http.createServer();
        this.headers = {
                'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
                'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
                'Access-Control-Max-Age': 2592000, // 30 days
                /** add other headers as per requirement */
            }
        this.filePaths = {};
    }

    getServerPath(){
        return this.serverPath;
    }

    setFilePaths(urlPath, method, callback){
        if(this.filePaths[urlPath])return 

        this.filePaths[urlPath] = {
            method:method,
            function:callback,
        }
    }

    listenOnFilePaths(){
        this.httpServer.on("request", (req, res)=>{
            console.log("Recieved Request!");
            const filepath = req.url;
            this.filePaths[filepath]
            // if(req.url === "/upload" && req.method === "POST") receiveFile(req, res, this.headers, "Finished Downloading File")
        })
    }

    run(){
        this.httpServer.listen(this.port,this.ipAddress, this.callback)
    }

}

function main(){
    const fileServer = new FileServer("Desktop", "192.168.1.104", 8080, ()=> console.log("started"));
    

}


function receiveFile(req, res, headers, responseMessage){
    let dataRecieved = "";

    req.on("data", stream=>{
        dataRecieved+=stream
    })

    req.on("end", () =>{
        console.log("Finished Recieving Data")
        const data = JSON.parse(dataRecieved);
        writeFileSync(`../${data.name}`, Buffer.from(data.data, "base64"))
    })

    res.writeHead(200, headers);
    res.end(responseMessage);
}


