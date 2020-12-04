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
    Extension.getIdentifier = function (element) {
        return this.getLocation(window) + "@" + this.getXPath(element);
    };
    Extension.getLocation = function (w) {
        return (window.location != window.parent.location) ? document.referrer : document.location.href;
    };
    Extension.getXPath = function (element) {
        if (element.parentElement != undefined) {
            return this.getXPath(element.parentElement) + "/" + element.tagName;
        }
        else {
            return "";
        }
    };
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
        this.identifier = Extension.getIdentifier(this.element);
        this.element.addEventListener("timeupdate", function () {
            // Prevent indexing of short videos
            if (_this.element.duration > 4 * 60) {
                _this.storage.set(_this.identifier, _this.element.currentTime);
            }
        });
        console.log("try");
        if (this.storage.hasUrl(this.identifier)) {
            console.log("set to " + this.storage.get(this.identifier));
            this.element.currentTime = this.storage.get(this.identifier);
        }
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
