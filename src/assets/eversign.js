/* see https://eversign.com/api/documentation/embedded-signing#client-side */

export const eversign = {

    open: function (params) {

        // parameters
        var iFrameWidth = params.width || 350;
        var iFrameHeight = params.height || 500;

        // callbacks
        eversign.callbacks = Object.assign({}, params.events);

        // if iOS, add CSS styles to container element that prevent iOS from resizing iFrame
        if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {

            var css = document.createElement('style');
            css.type = 'text/css';
            css.innerHTML = '#' + params.containerID + ' { width: ' + iFrameWidth + 'px; height: ' + iFrameHeight + 'px; overflow: hidden;';
            document.body.appendChild(css);

        }

        // add CSS rules vital to mobile scrolling to iFrame container element
        if (iFrameWidth > 800) {
            document.getElementById(params.containerID).style['-webkit-overflow-scrolling'] = 'touch';
            document.getElementById(params.containerID).style['overflow-y'] = 'scroll';
        }

        // create iFrame
        var iFrame = document.createElement('iframe');
        document.getElementById(params.containerID).appendChild(iFrame);

        iFrame.src = params.url;
        iFrame.width = iFrameWidth;
        iFrame.height = iFrameHeight;

        /*
        if (iFrameWidth < 801) {
        iFrame.setAttribute("scrolling", "no");
        }
        */

        // configure postMessage
        var eventMethod = window[(window.addEventListener ? "addEventListener" : "attachEvent")],
            messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

        // listen to postMessage from child window
        eventMethod(messageEvent, eversign.windowListener, false);

        /* BEGIN RG edit */
        return iFrame;
        /* END RG edit */
    },

    callbacks: {},

    windowListener: function(e) {
        var eventType = (e[(e.message ? "message" : "data")]+'').split('_').pop();
        var eventTypes = ['loaded', 'signed', 'declined', 'error'];
        var hasErrorMessage = e.data && e.data.error_message;

        if (eventType && eventTypes.includes(eventType) &&
            eversign.callbacks.hasOwnProperty(eventType) &&
            typeof eversign.callbacks[eventType] == 'function') {
            eversign.callbacks[eventType]();
        }  else if (hasErrorMessage) {
            eversign.callbacks['error'](e.data.error_message);
        }
    }
};
