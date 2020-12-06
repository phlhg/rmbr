/** Imitate browser variable for addons */
declare const browser: any;

class Extension {

    messanger: ExtensionMessanger;
    storage: ExtensionStorage;

    movieCollection: MovieCollection;

    constructor(){

        this.messanger = new ExtensionMessanger();
        this.storage = new ExtensionStorage();
        this.movieCollection = this.storage.setPartition("movies",new MovieCollection(this.storage));

        this.storage.load(() => {
            this.setEvents();
        });

    }

    setEvents(): void {

        this.messanger.setHandler("getVideo",(data,sender) => {

            this.messanger.send("getVideo",{
                id: data.id,
                video: this.movieCollection.get(Movie.id(sender.tab.url,data.id))?.toObject()
            },sender);

        });

        this.messanger.setHandler("updateVideo",(data,sender) => {

            let m: Movie = this.movieCollection.get(Movie.id(sender.tab.url,data.id));

            if(m == undefined){
                m = new Movie(Movie.id(sender.tab.url,data.id), 0, sender.tab.url, sender.tab.title);
                this.movieCollection.add(m);
            }

            m.updateProgress(data.progress);
            this.movieCollection.update();

        });

    }

}

class Storable {

    storage: ExtensionStorage;

    constructor(storage: ExtensionStorage){
        this.storage = storage;
    }

    update(){
        this.storage.store(); 
    }

    toStorableObject(){ return {} }

    restoreFromObject(data: any){  }

}

class MovieCollection extends Storable {

    collection: Array<Movie> = [];

    get(id: number){
        return this.collection.find(m => {
            return m.id == id;
        });
    }

    add(m: Movie){
        this.collection.push(m);
        this.update();
        return m;
    }

    fromObject(data: any){
        this.collection = [];
        data.forEach(m => {
            this.collection.push(Movie.fromObject(m));
        });
    }

    toObject(){
        return this.collection.map(m => m.toObject())
    }

}

class Movie {

    id: number;
    url: string;
    name: string;
    progress: number;

    constructor(id, progress, url, name){
        this.id = id;
        this.progress = progress;
        this.url = url;
        this.name = name;
    }

    static id(url,xpath): number{
        return Hash.fromString(url+"@"+xpath);
    }

    updateProgress(progress: number){
        this.progress = progress;
    }

    toObject(){
        return {
            "id": this.id,
            "progress": this.progress,
            "url": this.url,
            "name": this.name
        }
    }

    static fromObject(data: any){
        return new this(
            data.id,
            data.progress,
            data.url,
            data.name
        );
    }

}

class ExtensionStorage {

    partitions: Object = {};

    load(callback: Function): void {
        browser.storage.local.get().then(data => {
            this.restore(data);
            callback();
        }, () => {
            this.store();
            callback();
        });
    }
    
    
    setPartition(name: string, c: any){
        this.partitions[name] = c;
        return c;
    }

    restore(data: any): void {
        for(let name in data){
            if(this.partitions.hasOwnProperty(name)){
                this.partitions[name].fromObject(data[name]);
            }
        }
    }

    store(): void {
        let data: object = {};
        for(let name in this.partitions){
            data[name] = this.partitions[name].toObject();
        }
        browser.storage.local.set(data);
    }

}

class ExtensionMessanger {

    handlers: Object = {};
    defaultHandler: Function = (data,sender) => { console.log(data); };

    constructor(){
        browser.runtime.onMessage.addListener(this.receive.bind(this));
    }

    send(type: string, message: any, target: any){
        browser.tabs.sendMessage( target.tab.id, { 
            "type": type, 
            "data": message 
        },{ frameId: target.frameId });
    }

    receive(message: any, sender: any){
        if(message.hasOwnProperty("type") && message.hasOwnProperty("data")){
            if(this.handlers.hasOwnProperty(message.type)){
                this.handlers[message.type](message.data,sender);
            } else {
                this.defaultHandler(message,sender);
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

var ext: Extension = new Extension();

class Hash {

    static fromString(value: String): number{
        var hash = 0, i, chr;
        for (i = 0; i < value.length; i++) {
            chr   = value.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

}