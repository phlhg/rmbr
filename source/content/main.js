class Content {

    constructor(){

        this.videos = {};
        this.messanger = new ContentMessanger();

        this.messanger.setHandler("getVideo",(data) => {
            let id = data.id;
            let video = data.video;

            console.log(video);

            if(video != undefined && this.videos.hasOwnProperty(id)){
                this.videos[id].setProgress(video.progress);
            }

        })
        
        let elements = document.querySelectorAll("video");

        for(let i = 0; i < elements.length; i++){
            let v = new Video(this,elements[i]);
            this.videos[v.identifier] = v;
        }

    }

    static getIdentifier(element) {
        return this.getXPath(element);
    }

    static getXPath(element) {
        if(element.parentElement != undefined){
            return this.getXPath(element.parentElement) + "/" + element.tagName + "[" + (element.id ? element.id : Array.from(element.classList).join()) + "]";
        } else {
            return "";
        }
    }

}


class Video {
    
    constructor(content, element){

        this.content = content;
        this.element = element;
        this.identifier = Content.getIdentifier(this.element);

        this.element.addEventListener("timeupdate",() => {
            if(this.element.duration > 4*60){
                this.updateProgress(this.element.currentTime);
            }
        })

        this.content.messanger.send("getVideo",{
            "id": this.identifier
        });
    
    }

    updateProgress(progress){
        console.log(progress);
        this.content.messanger.send("updateVideo",{
            "id": this.identifier,
            "progress": progress
        });
    }

    progressToText(progress) {
        let d = new Date(progress*1000);
        return this.dd(d.getHours()-1) + ":" + this.dd(d.getMinutes()) + ":" + this.dd(d.getSeconds());
    }

    dd(n) {
        return ""+ (n < 10 ? "0"+n : n);
    }

    setProgress(progress){
        new Message(this.element,"Continue at "+this.progressToText(progress));
        console.log(this.element);
        console.log("set to "+progress);
        this.element.currentTime = progress;
    }

}

class Message {

    constructor(anchor, message){
        this.anchor = anchor;
        this.message = message;
        this.root = document.createElement("div");
        this.root.classList.add("rmbrMessage");
        this.root.innerText = this.message;
        this.root.style.backgroundImage = 'url('+browser.extension.getURL('icons/48_white.png')+')';
        document.body.appendChild(this.root);

        setTimeout(this.show.bind(this),200)

        this.anchor.onplay = () => {
            setTimeout(this.hide.bind(this),3000);
        }

        window.addEventListener("scroll",this.reposition.bind(this));
    }

    reposition(){
        let bcr = this.anchor.parentElement.getBoundingClientRect();
        this.root.style.top = bcr.top+"px";
        this.root.style.left = bcr.left+"px";
    }

    show(){
        this.reposition();
        this.root.classList.add("show");
    }

    hide(){
        this.root.classList.remove("show");
        this.anchor.onplay = () => {};
        setTimeout(this.remove.bind(this),400);
    }

    remove(){
        this.root.remove();
    }

}

class ContentMessanger {

    constructor(){
        this.handlers = {}
        this.defaultHandler = (data,sender) => { console.log(data); };
        browser.runtime.onMessage.addListener(this.receive.bind(this));
    }

    send(type, message){
        browser.runtime.sendMessage({ 
            "type": type, 
            "data": message 
        });
    }

    receive(message){
        if(message.hasOwnProperty("type") && message.hasOwnProperty("data")){
            if(this.handlers.hasOwnProperty(message.type)){
                this.handlers[message.type](message.data);
            } else {
                this.defaultHandler(message.data);
            }
        } else {
            console.log(message);
        }
    }

    setHandler(type, handler){
        this.handlers[type] = handler;
    }

    setDefaultHandler(handler){
        this.defaultHandler = handler;
    }

}

new Content();