class Content {

    constructor(){

        this.videos = {};
        this.messanger = new ContentMessanger();

        this.messanger.setHandler("getVideo",(data) => {
            let id = data.id;
            let video = data.video;

            if(this.videos.hasOwnProperty(id)){
                if(video != undefined){
                    this.videos[id].setProgress(video.progress);
                }
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
        this.track = false;
        this.identifier = Content.getIdentifier(this.element);

        this.element.addEventListener("timeupdate",() => {
            if(this.track){
                this.updateProgress(this.element.currentTime);
            }
        })

        this.content.messanger.send("getVideo",{
            "id": this.identifier
        });

        this.element.addEventListener("canplaythrough", () => {
            if(this.element.duration > 4 * 60){
                this.track = true;
            }
        })
    
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
        this.element.currentTime = progress;
        var msg = new Message(this.element,"Continue at "+this.progressToText(this.element.currentTime));
        this.element.onplay = () => {
            setTimeout(() => { msg.hide(); },2000);
            this.element.onplay = () => {}
        }
        msg.show();
    }

}

class Message {

    constructor(anchor, message){
        this.anchor = anchor;

        this.dom = {}

        this.dom.root = document.createElement("div");
        this.dom.text = document.createElement("span");
        this.dom.button = document.createElement("div");

        this.dom.root.classList.add("rmbrMessage");
        this.dom.root.style.backgroundImage = 'url('+browser.extension.getURL('icons/48_white.png')+')';

        this.dom.root.appendChild(this.dom.text);
        this.dom.root.appendChild(this.dom.button);

        this.dom.text.innerText = message;
        this.dom.button.classList.add("button");

        document.body.appendChild(this.dom.root);
        window.addEventListener("scroll",this.reposition.bind(this));
    }

    setMessage(message){
        this.dom.text.innerText = message;
    }

    setAction(name, callback){
        this.dom.root.classList.add("action");
        this.dom.button.innerText = name;
        this.dom.button.onclick = () => {
            callback(this);
        }
    }

    reposition(){
        let bcr = this.anchor.parentElement.getBoundingClientRect();
        this.dom.root.style.top = bcr.top+"px";
        this.dom.root.style.left = bcr.left+"px";
    }

    show(){
        this.reposition();
        setTimeout(() => {
            this.dom.root.classList.add("show");
        }, 200);
    }

    hide(){
        this.dom.root.classList.remove("show");
        setTimeout(this.remove.bind(this),400);
    }

    remove(){
        this.dom.root.remove();
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