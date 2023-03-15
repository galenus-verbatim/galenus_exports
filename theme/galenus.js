const Jax = function() {
    const EOF = '\u000A';
    /**
     * Get URL to a callback function.
     * 
     * @param {String} url 
     * @param {function} callback 
     * @returns 
     */
    function load(url, callback, type='text') {
        let timeStart = new Date();
        let xhr = new XMLHttpRequest();
        xhr.responseType = type;
        xhr.onprogress = function() {
            // if sended by chunks
        };
        xhr.onload = function() {
            var status = xhr.status;
            if (status !== 200) {
                // error ? do what ?
                callback(xhr.response);
                reject(Error(status + " " + url));
            }
            callback(xhr.response);
            //
        };
        // loadend (load|error|abort)
        xhr.onerror = function() {
            console.log('[' + xhr.status + '] ' + url);
        };
        xhr.open('GET', url);
        xhr.send();
        return xhr;
    }
    return {
        load: load,
    }
}();

(function() {
    const nav = document.getElementById('nav');
    const doc = document.getElementById('doc');
    Jax.load('html/tlg0057.tlg100.1st1K-grc1.html', function(html) {
        doc.innerHTML = html;
    });
    Jax.load('nav.html', function(html) {
        nav.innerHTML = html;
        let els = nav.querySelectorAll('a');
        for (let i = 0, len = els.length; i < len; ++i) {
            let a = els[i];
            a.onclick = (e) => {
                e.preventDefault();
                if (window.lastA) window.lastA.classList.remove('selected'); 
                a.classList.add('selected');
                window.lastA = a;
                Jax.load(a.href, function(html) {
                    doc.innerHTML = html;
                });
            }
        }
    })

}());

const Galenus = function() {
    // https://www.biusante.parisdescartes.fr/iiif/2/bibnum:00039x04:0038/full/max/0/default.jpg
    function wear(css, dat) {
        if (!dat) return;
        let els = document.querySelectorAll(css);
        for (let i = 0; i < els.length; ++i) {

            var span = document.createElement("span");
            span.className = "pageview";
            let p = els[i].dataset.n;


            if (!p) p = els[i].dataset.page;
            let url;
            // has been seen, but no more used
            // const pos = p.indexOf(".");
            let pno;
            let text = '[';
            if (els[i].classList.contains('page1') || els[i].classList.contains('pbde')) {
                text += '…';
            }
            let pdiff = dat['pdiff'];
            if (dat['pholes']) {
                for (const prop in dat['pholes']) {
                    if (p >= prop) {
                        pdiff = dat['pholes'][prop];
                    } else {
                        break;
                    }
                }
            }

            text += dat['vol'] + '.' + p + ' ' + dat['abbr'];
            // pad page number for biusante 
            pno = pad(parseInt(p) + parseInt(pdiff), 4);
            url = dat['url'].replace('%%', pno);
            text += ']';
            span.innerText = text;
            // els[i].parentNode.insertBefore(span, els[i].nextSibling);
            els[i].appendChild(span);


            span.onclick = function() {
                if (pageViewer.spanLast) pageViewer.spanLast.classList.remove("selected");
                this.classList.add("selected");
                pageViewer.spanLast = this;
                image.src = url;
                let title = '';
                if (dat.title) title = text + ' source : ' + dat.title.replace('%%', pno);
                image.alt = title;
                const header = document.getElementById('image_header');
                if (header) header.innerHTML = title;
                pageViewer.update();
                pageViewer.resize();
            }
            if (first) {
                span.click();
                first = false;
            }
        }
    }
    function pad(num, width) {
        var s = "000000000" + num;
        return s.substring(s.length - width);
    }
    return {
        wear: wear,
    }
}();
/**
 * Do something with bâle chartier data
 */
const image = document.getElementById('image');
const div = document.getElementById('viewcont');
if (div) {
    // viewer override of resize
    Viewer.prototype.resize = function() {
        var _this3 = this;

        if (!this.isShown || this.hiding) {
            return;
        }

        if (this.fulled) {
            this.close();
            this.initBody();
            this.open();
        }

        this.initContainer();
        this.initViewer();
        this.renderViewer();
        this.renderList();

        if (this.viewed) {
            // do not resize image
            /*
            this.initImage(function() {
                _this3.renderImage();
            });
            _this3.options.viewed();
            */
        }

        if (this.played) {
            if (this.options.fullscreen && this.fulled && !(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)) {
                this.stop();
                return;
            }

            forEach(this.player.getElementsByTagName('img'), function(image) {
                addListener(image, EVENT_LOAD, _this3.loadImage.bind(_this3), {
                    once: true
                });
                dispatchEvent(image, EVENT_LOAD);
            });
        }
    };

    /*
    var onViewed = function onViewed() {
        var imageData = _this2.imageData;
        var render = Array.isArray(options.title) ? options.title[1] : options.title;
        // EDIT 2022-04, keep html in titles
        title.innerHTML = isFunction(render) ? render.call(_this2, image, imageData) : "".concat(alt, " (").concat(imageData.naturalWidth, " \xD7 ").concat(imageData.naturalHeight, ")");
    };
    */

    Viewer.prototype.wheel = function(event) {
        var _this4 = this;
        if (!this.viewed) {
            return;
        }

        event.preventDefault(); // Limit wheel speed to prevent zoom too fast

        if (this.wheeling) {
            return;
        }

        this.wheeling = true;
        setTimeout(function() {
            _this4.wheeling = false;
        }, 50);
        var ratio = Number(this.options.zoomRatio) || 0.1;
        var delta = 1;

        if (event.deltaY) {
            delta = event.deltaY;
        } else if (event.wheelDelta) {
            delta = -event.wheelDelta;
        } else if (event.detail) {
            delta = event.detail;
        }
        this.move(0, -delta);
    };

    var pageViewer = new Viewer(div, {
        title: function(image) {
            // title sould not be html
            return image.alt;
        },
        title: false,
        transition: false,
        inline: true,
        navbar: 0,
        zIndex: 4,
        // minWidth: '100%', 
        toolbar: {
            width: function() {
                let cwidth = div.offsetWidth;
                let iwidth = pageViewer.imageData.naturalWidth;
                let zoom = cwidth / iwidth;
                pageViewer.zoomTo(zoom);
                pageViewer.moveTo(0, pageViewer.imageData.y);
            },
            zoomIn: true,
            zoomOut: true,
            oneToOne: true,
            reset: true,
        },
        viewed() {
            // default zoom on load, image width
            let cwidth = div.offsetWidth;
            let iwidth = pageViewer.imageData.naturalWidth;
            let zoom = cwidth / iwidth;
            pageViewer.zoomTo(zoom);
            pageViewer.moveTo(0, 0);
        },
    });

}
(function() {
    let first = true;
    // const ed1 set, use data 
    if (typeof imgkuhn !== 'undefined') Galenus.wear(".pb", imgkuhn);
    if (typeof imgbale !== 'undefined') Galenus.wear(".ed1page", imgbale);
    if (typeof imgchartier !== 'undefined') Galenus.wear(".ed2page", imgchartier);


})();
(function() {
    const id = 'selnav';
    const select = document.getElementById(id);
    if (!select) return;

    function show(value) {
        if (!select.last) select.last = document.getElementById('TitLa');
        const show = document.getElementById(value);
        if (!show) return;
        localStorage.setItem(id, value);
        select.last.style.display = 'none';
        select.last = show;
        show.style.display = 'block';
    }
    // on load last value
    window.addEventListener("load", function(e) {
        const value = localStorage.getItem(id);
        if (value) {
            select.value = value;
            show(value);
        }
    })

    select.addEventListener("change", function(e) {
        const value = select.value;
        show(value);
    });
}());
(function() {
    const navs = document.getElementById('navs');
    if (!navs) return;
    navs.addEventListener('click', function(e) {
        let a = selfOrAncestor(e.target, 'a');
        if (!a) return;
        if (document.lasta) document.lasta.classList.remove('selected');
        document.lasta = a;
        a.classList.add('selected');
    });

    function selfOrAncestor(el, name) {
        while (el.tagName.toLowerCase() != name) {
            el = el.parentNode;
            if (!el) return false;
            let tag = el.tagName.toLowerCase();
            if (tag == 'div' || tag == 'nav' || tag == 'body') return false;
        }
        return el;
    }
}());

