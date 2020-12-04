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

}

/**
 * Handles a single video 
 */
class Video {

    storage: RmbrStorage;
    element: HTMLVideoElement;
    
    /**
     * 
     * @param {RmbrStorage} storage Reference to the storage
     * @param {HTMLVideoElement} element 
     */
    constructor(storage: RmbrStorage, element: HTMLVideoElement){

        this.storage = storage;
        this.element = element;

        console.log(this.element);
        console.log(this.storage.data);
        console.log(this.element.currentSrc);



        this.element.addEventListener("timeupdate",() => {
            // Prevent indexing of short videos
            if(this.element.duration > 4*60){
                this.storage.set(this.element.currentSrc,this.element.currentTime);
            }
        })

        this.element.addEventListener("canplay",() => {
            console.log("try");
            if(this.storage.hasUrl(this.element.currentSrc)){
                console.log("set to "+this.storage.get(this.element.currentSrc));
                this.element.currentTime = this.storage.get(this.element.currentSrc);
            }
        });
    
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
            //console.log(data);
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
