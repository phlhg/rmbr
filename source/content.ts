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
            return this.getXPath(element.parentElement) + "/" + element.tagName;
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
            console.log("set to "+this.storage.get(this.identifier));
            this.element.currentTime = this.storage.get(this.identifier);
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