/**
 * Main class
 */
var Extension = /** @class */ (function () {
    function Extension() {
        var _this = this;
        this.videos = [];
        this.storage = new RmbrStorage();
        this.storage.init(function () {
            var elements = document.querySelectorAll("video");
            for (var i = 0; i < elements.length; i++) {
                _this.videos.push(new Video(_this.storage, elements[i]));
            }
        });
    }
    return Extension;
}());
/**
 * Handles a single video
 */
var Video = /** @class */ (function () {
    /**
     *
     * @param {RmbrStorage} storage Reference to the storage
     * @param {HTMLVideoElement} element
     */
    function Video(storage, element) {
        var _this = this;
        this.storage = storage;
        this.element = element;
        console.log(this.element);
        console.log(this.storage.data);
        console.log(this.element.currentSrc);
        this.element.addEventListener("timeupdate", function () {
            // Prevent indexing of short videos
            if (_this.element.duration > 4 * 60) {
                _this.storage.set(_this.element.currentSrc, _this.element.currentTime);
            }
        });
        this.element.addEventListener("canplay", function () {
            console.log("try");
            if (_this.storage.hasUrl(_this.element.currentSrc)) {
                console.log("set to " + _this.storage.get(_this.element.currentSrc));
                _this.element.currentTime = _this.storage.get(_this.element.currentSrc);
            }
        });
    }
    return Video;
}());
/**
 * Manages the storage of the extension
 */
var RmbrStorage = /** @class */ (function () {
    function RmbrStorage() {
    }
    RmbrStorage.prototype.init = function (callback) {
        var _this = this;
        browser.storage.local.get().then(function (data) {
            _this.data = data;
            //console.log(data);
            callback();
        }, function (error) {
            console.log(error);
            callback();
        });
    };
    RmbrStorage.prototype.hasUrl = function (url) {
        return this.data.hasOwnProperty(url);
    };
    RmbrStorage.prototype.get = function (url) {
        return this.data[url];
    };
    RmbrStorage.prototype.set = function (url, progress) {
        console.log(url + " " + progress);
        this.data[url] = progress;
        this.store();
    };
    RmbrStorage.prototype.store = function () {
        browser.storage.local.set(this.data);
    };
    return RmbrStorage;
}());
new Extension();
