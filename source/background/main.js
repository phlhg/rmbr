class Extension {

    constructor(){

        this.messanger = new ExtensionMessanger();
        this.storage = new ExtensionStorage();
        this.movieCollection = this.storage.setPartition("movies",new MovieCollection(this.storage));

        this.storage.load(() => {
            this.setEvents();
        });

    }

    setEvents() {

        this.messanger.setHandler("getVideo",(data,sender) => {

            this.messanger.send("getVideo",{
                id: data.id,
                video: this.movieCollection.get(Movie.id(sender.tab.url,data.id))?.toObject()
            },sender);

        });

        this.messanger.setHandler("updateVideo",(data,sender) => {

            let m = this.movieCollection.get(Movie.id(sender.tab.url,data.id));

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

    constructor(storage){
        this.storage = storage;
    }

    update(){
        this.storage.store(); 
    }

    toStorableObject(){ return {} }

    restoreFromObject(data){  }

}

class MovieCollection extends Storable {

    constructor(storage){
        super(storage);
        this.collection = [];
    }

    get(id){
        return this.collection.find(m => {
            return m.id == id;
        });
    }

    add(m){
        this.collection.push(m);
        this.update();
        return m;
    }

    fromObject(data){
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

    constructor(id, progress, url, name){
        this.id = id;
        this.progress = progress;
        this.url = url;
        this.name = name;
    }

    static id(url,xpath) {
        return Hash.fromString(url+"@"+xpath);
    }

    updateProgress(progress){
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

    static fromObject(data){
        return new this(
            data.id,
            data.progress,
            data.url,
            data.name
        );
    }

}

class ExtensionStorage {

    constructor(){
        this.partitions = {};
    }

    load(callback) {
        browser.storage.local.get().then(data => {
            this.restore(data);
            callback();
        }, () => {
            this.store();
            callback();
        });
    }
    
    
    setPartition(name, c){
        this.partitions[name] = c;
        return c;
    }

    restore(data) {
        for(let name in data){
            if(this.partitions.hasOwnProperty(name)){
                this.partitions[name].fromObject(data[name]);
            }
        }
    }

    store() {
        let data = {};
        for(let name in this.partitions){
            data[name] = this.partitions[name].toObject();
        }
        browser.storage.local.set(data);
    }

}

class ExtensionMessanger {

    constructor(){

        this.handlers = {};
        this.defaultHandler = (data,sender) => { console.log(data); };

        browser.runtime.onMessage.addListener(this.receive.bind(this));
    }

    send(type, message, target){
        browser.tabs.sendMessage( target.tab.id, { 
            "type": type, 
            "data": message 
        },{ frameId: target.frameId });
    }

    receive(message, sender){
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

    setHandler(type, handler){
        this.handlers[type] = handler;
    }

    setDefaultHandler(handler){
        this.defaultHandler = handler;
    }

}

class Hash {

    //From https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript

    static fromString(value) {
        var hash = 0, i, chr;
        for (i = 0; i < value.length; i++) {
            chr   = value.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    }

}

var ext = new Extension();