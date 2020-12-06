class Content {

    messanger: ContentMessanger;
    videos: Object = {};

    constructor(){

        this.messanger = new ContentMessanger();

        this.messanger.setHandler("getVideo",(data) => {
            let id: string = data.id;
            let video: any = data.video;

            console.log(video);

            if(video != undefined && this.videos.hasOwnProperty(id)){
                this.videos[id].setProgress(video.progress);
            }

        })
        
        let elements: NodeListOf<HTMLVideoElement> = document.querySelectorAll("video");

        for(let i = 0; i < elements.length; i++){
            let v: Video = new Video(this,elements[i]);
            this.videos[v.identifier] = v;
        }

    }

    static getIdentifier(element: HTMLElement): string {
        return this.getXPath(element);
    }

    static getXPath(element: HTMLElement): string {
        if(element.parentElement != undefined){
            return this.getXPath(element.parentElement) + "/" + element.tagName + "[" + (element.id ? element.id : Array.from(element.classList).join()) + "]";
        } else {
            return "";
        }
    }

}


class Video {

    content: Content;
    element: HTMLVideoElement;
    identifier: string;
    
    constructor(content: Content, element: HTMLVideoElement){

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

    progressToText(progress: number): string {
        let d : Date = new Date(progress*1000);
        return this.dd(d.getHours()-1) + ":" + this.dd(d.getMinutes()) + ":" + this.dd(d.getSeconds());
    }

    dd(n: number): string {
        return ""+ (n < 10 ? "0"+n : n);
    }

    setProgress(progress: number){
        new Message(this.element,"Continue at "+this.progressToText(progress));
        console.log(this.element);
        console.log("set to "+progress);
        this.element.currentTime = progress;
    }

}

class Message {

    anchor: HTMLVideoElement;
    root: HTMLElement;
    message: string;

    constructor(anchor: HTMLVideoElement, message: string){
        this.anchor = anchor;
        this.message = message;
        this.root = document.createElement("div");
        this.root.classList.add("rmbrMessage");
        this.root.innerText = this.message;
        this.root.style.top = this.anchor.getBoundingClientRect().top+"px";
        this.root.style.right = (this.anchor.getBoundingClientRect().right-this.anchor.getBoundingClientRect().width)+"px";
        this.root.style.backgroundImage = 'url('+browser.extension.getURL('icons/48_white.png')+')';
        document.body.appendChild(this.root);

        setTimeout(() => {
            this.root.classList.add("show");
        },200)

        this.anchor.onplay = () => {
            setTimeout(() => {
                this.root.classList.remove("show");
                this.anchor.onplay = () => {};
            },5000);
        }

    }

}

class ContentMessanger {

    handlers: Object = {};
    defaultHandler: Function = (data,sender) => { console.log(data); };

    constructor(){
        browser.runtime.onMessage.addListener(this.receive.bind(this));
    }

    send(type: string, message: any){
        browser.runtime.sendMessage({ 
            "type": type, 
            "data": message 
        });
    }

    receive(message: any){
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

    setHandler(type: string, handler: Function){
        this.handlers[type] = handler;
    }

    setDefaultHandler(handler: Function){
        this.defaultHandler = handler;
    }

}

new Content();