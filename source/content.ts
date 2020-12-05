/** Imitate browser variable for addons */
declare const browser: any;

/**
 * Main class
 */
class Extension {

    videos: Array<Video>;
    storage: RmbrStorage;

    constructor(){

        this.videos = [];
        this.storage = new RmbrStorage();

        this.storage.init(() => {

            let elements: NodeListOf<HTMLVideoElement> = document.querySelectorAll("video");

            for(let i = 0; i < elements.length; i++){
                this.videos.push(new Video(this.storage, elements[i]));
            }

        });


    }

    static getIdentifier(element: HTMLElement){
        return this.getLocation(window) + "@" + this.getXPath(element);
    }

    static getLocation(w: Window): String {
        return (window.location != window.parent.location) ? document.referrer : document.location.href;
    }

    static getXPath(element: HTMLElement): String {
        if(element.parentElement != undefined){
            return this.getXPath(element.parentElement) + "/" + element.tagName + "[" + (element.id ? element.id : Array.from(element.classList).join()) + "]";
        } else {
            return "";
        }
    }

}

/**
 * Handles a single video 
 */
class Video {

    storage: RmbrStorage;
    element: HTMLVideoElement;
    identifier: string;
    
    /**
     * 
     * @param {RmbrStorage} storage Reference to the storage
     * @param {HTMLVideoElement} element 
     */
    constructor(storage: RmbrStorage, element: HTMLVideoElement){

        this.storage = storage;
        this.element = element;
        this.identifier = Extension.getIdentifier(this.element);

        this.element.addEventListener("timeupdate",() => {
            // Prevent indexing of short videos
            if(this.element.duration > 4*60){
                this.storage.set(this.identifier,this.element.currentTime);
            }
        })
        
        
        if(this.storage.hasUrl(this.identifier)){
            new Message(this.element,"Continue at "+this.progressToText(this.storage.get(this.identifier)));
            console.log(this.element);
            console.log("set to "+this.storage.get(this.identifier));
            this.element.currentTime = this.storage.get(this.identifier);
        }
    
    }

    progressToText(time: number) : string {
        let d : Date = new Date(time*1000);
        return this.dd(d.getHours()-1) + ":" + this.dd(d.getMinutes()) + ":" + this.dd(d.getSeconds());
    }

    dd(n: number): string {
        return ""+ (n < 10 ? "0"+n : n);
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

/**
 * Manages the storage of the extension
 */
class RmbrStorage {

    data: Object;

    init(callback: Function){
        browser.storage.local.get().then(data => {
            this.data = data;
            callback();
        }, error => {
            console.log(error);
            callback();
        });
    }
    
    hasUrl(url: string){
        return this.data.hasOwnProperty(url);
    }

    get(url: string){
        return this.data[url];
    }

    set(url: string, progress: number){
        console.log(url+ " "+ progress);
        this.data[url] = progress;
        this.store();
    }

    store(){
        browser.storage.local.set(this.data);
    }

}

new Extension();