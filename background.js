chrome.extension.onRequest.addListener(onRequest);
var source='';
var overridesource='';
var tabId=0;
var logicOverride=[overrideDailyMotion,overrideYoutube];
function onRequest(request, sender, sendResponse) {
    overridesource='';
    tabId=sender.tab.id;
    var tsource=tryOverride(sender.tab)
    console.log(tsource);
    if (tsource!=null&&tsource!=''){
        overridesource=tsource;
        source=tsource;
        console.log(overridesource);
        chrome.pageAction.show(tabId);
    };
    sendResponse({});
};

function getSource(){
    return source;
}
function tryOverride(tab){
    var tsource=''
    for(var i=0;i<logicOverride.length;i++){
       console.log(i);
       tsource =logicOverride[i](tab)
       console.log(tsource);
    }
    return tsource
}
chrome.webRequest.onBeforeRequest.addListener(
  function(info) {
    if(overridesource==''){
        if(info.url.indexOf('.flv')!=-1||info.url.indexOf('.mp4')!=-1||info.url.indexOf('\?start')!=-1||info.url.indexOf('.avi')!=-1||info.url.indexOf('.mkv')!=-1||info.url.indexOf('.ogg')!=-1){
            source=info.url;
            try{
                chrome.pageAction.show(tabId);
            }catch(err){
                console.log(err.message);
            };
        };
        return;
    };
  },
  {
    urls: [
      "<all_urls>"
    ],
    //types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
    types: [ "other"]
  },
  ["blocking"]);


function overrideYoutube(tab){
    if (tab.url.indexOf('youtube')==-1){
        return;
    }
    var videoID=tab.url.substring(tab.url.lastIndexOf('\=')+1)
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://www.youtube.com/get_video_info?&video_id=" + videoID + "&eurl=http%3A%2F%2Fwww%2Eyoutube%2Ecom%2F&sts=1588", false);
    xhr.send()
    console.log(readQueryString(xhr.responseText));
    var flashvars = parseFlashVariables(xhr.responseText);
    console.log(flashvars);
    if(flashvars.status === "ok") {
        return processFlashVars(flashvars);
    } else { // e.g. region-blocked video
        return ;
    }

}
function overrideDailyMotion(tab){
    if (tab.url.indexOf('dailymotion.com')==-1){
        return;
    }
    var videoID=tab.url.substring(tab.url.lastIndexOf('\/')+1)
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://www.dailymotion.com/embed/video/" + videoID, false);
    xhr.send();
    var match = /var info = (.*),/.exec(xhr.responseText);
    if(!match) return;
    var info = JSON.parse(match[1]);
    
    var sources = [];
    if(info.stream_h264_hd1080_url) sources.push({"url": info.stream_h264_hd1080_url, "format": "1080p MP4", "height": 1080, "isNative": true});
    if(info.stream_h264_hd_url) sources.push({"url": info.stream_h264_hd_url, "format": "720p MP4", "height": 720, "isNative": true});
    if(info.stream_h264_hq_url) sources.push({"url": info.stream_h264_hq_url, "format": "480p MP4", "height": 480, "isNative": true});
    if(info.stream_h264_url) sources.push({"url": info.stream_h264_url, "format": "380p MP4", "height": 360, "isNative": true});
    if(info.stream_h264_ld_url) sources.push({"url": info.stream_h264_ld_url, "format": "240p MP4", "height": 240, "isNative": true});
    return sources[0]['url'];

}
function processFlashVars(flashvars) {
	if(flashvars.ps === "live" && !flashvars.hlsvp) return;
	
	var sources = [];
	
	// Get video URLs
	if(flashvars.url_encoded_fmt_stream_map) { 
		var fmtList = decodeURIComponent(flashvars.url_encoded_fmt_stream_map).split(",");
		var fmt, lsource;
		for(var i = 0; i < fmtList.length; i++) {
			fmt = parseFlashVariables(fmtList[i]);
			if(!fmt.url) continue;
			
			if(fmt.itag === "22") {
				lsource = {"format": "720p MP4", "height": 720, "isNative": true};
			} else if(fmt.itag === "18") {
				lsource = {"format": "360p MP4", "height": 360, "isNative": true};
			} else if(canPlayFLV && fmt.itag === "5") {
				lsource = {"format": "240p FLV", "height": 240, "isNative": false};
			} else continue;
			
			lsource.url = decodeURIComponent(fmt.url) + "&title=" + flashvars.title.replace(/%22/g, "%27") + "%20%5B" + lsource.height + "p%5D";
			if(fmt.sig) lsource.url += "&signature=" + fmt.sig;
			else if(fmt.s) lsource.url += "&signature=" + this.decodeSignature(fmt.s);
			sources.push(lsource);
		}
	} else if(flashvars.hlsvp) {
		sources.push({"url": decodeURIComponent(flashvars.hlsvp), "format": "HLS", "isNative": true});
	}
return sources[0]['url'];
	
}

// reads and parses a query string
function readQueryString(qs)
{
	qs = qs.split("+").join(" ");
	var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
	while(tokens = re.exec(qs)) params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	return params;
}



function decodeSignature(s) {
	s = s.split("");
	s = s.slice(2);
	s = s.reverse();
	s = s.slice(3);
	var t = s[0];
	s[0] = s[19%s.length];
	s[19] = t;
	s = s.reverse();
	return s.join("");
}

function parseWithRegExp(text, regex, processValue) { // regex needs 'g' flag
	var obj = {};
	if(!text) return obj;
	if(processValue === undefined) processValue = function(s) {return s;};
	var match;
	while(match = regex.exec(text)) {
		obj[match[1]] = processValue(match[2]);
	}
	return obj;
}
function parseFlashVariables(s) {return parseWithRegExp(s, /([^&=]*)=([^&]*)/g);}



var playback_started = false // to avoid terminating playback before video loads
var terminate_loop = false

function getHostname()
{
    var hostname = localStorage["hostname"];
    if (!hostname) {
      return "apple-tv.local";
    }
	else
	{
		return hostname
	}
}
function isAppleTv()
{
    var appletv = localStorage["appletv"];
    if (typeof appletv==='undefined'){
        return true;
    }
    return appletv;
}
function airplay(url, position) { 
    var xhr = new XMLHttpRequest(); 
	var hostname = getHostname()
    var port = ":7000"; 
    if(/: \d + $ / .test(hostname)) port = "";

	// stop currently playing video
	var xhr_stop = new XMLHttpRequest();
	xhr_stop.open("POST", "http://" + hostname + port + "/stop", true, "AirPlay", null);
	xhr_stop.send(null);

    xhr.open("POST", "http://" + hostname + port + "/play", true, "AirPlay", null);

	playback_started = false;
	terminate_loop = false;

    xhr.addEventListener("load", function() { // set timer to prevent playback from aborting
		var timer = setInterval(function() {
			var xhr = new XMLHttpRequest();
			var playback_info_keys_count = 0; // 0 something wrong; 2 ready to play; >2 playing
			xhr.open("GET", "http://" + hostname + port + "/playback-info", true, "AirPlay", null);
			xhr.addEventListener("load", function() {
				playback_info_keys_count = xhr.responseXML.getElementsByTagName("key").length;
				console.log("playback: " + playback_started + "; keys: " + playback_info_keys_count)
				if (!playback_started && playback_info_keys_count > 2) { // if we're getting some actual playback info
					playback_started = true;
					console.log("setting playback_started = true")
					terminate_loop = false;
				}
				if (terminate_loop && playback_info_keys_count <= 2) { // playback terminated 
					console.log("stopping loop & setting playback_started = false")
					clearInterval(timer);
					var xhr_stop = new XMLHttpRequest();
					xhr_stop.open("POST", "http://" + hostname + port + "/stop", true, "AirPlay", null);
					xhr_stop.send(null);					
					playback_started = false;
				}
				if (playback_started && playback_info_keys_count == 2) { // playback stopped, AppleTV is "readyToPlay"
					console.log("sending /stop signal, setting playback_started = false")
					var xhr_stop = new XMLHttpRequest();
					xhr_stop.open("POST", "http://" + hostname + port + "/stop", true, "AirPlay", null);
					xhr_stop.send(null);
					playback_started = false;
					terminate_loop = true;
				}
			}, false);
			xhr.addEventListener("error", function() {clearInterval(timer);}, false);
			xhr.send(null);
		}, 5000);
	}, false); 
    xhr.setRequestHeader("Content-Type", "text/parameters"); xhr.send("Content-Location: " + url +
    "\nStart-Position: " + position + "\n");
}



