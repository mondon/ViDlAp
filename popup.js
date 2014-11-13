document.addEventListener('DOMContentLoaded', function () {
    addButton();
		
});
function addButton() {
  	var bgPage = chrome.extension.getBackgroundPage();
    var appletv=bgPage.isAppleTv()
    url=bgPage.getSource();
    console.log(appletv)
    if (appletv=="false"){
        downLoadFile()
        var dl = document.createTextNode("Download started");
        document.body.appendChild(dl);
        return
    }
    var btn = document.createElement("BUTTON");
    var t = document.createTextNode("Download");
    btn.appendChild(t);
    if (url.indexOf('.mp4')!=-1||url.indexOf('\?start')!=-1){
        var brtn = document.createElement("BUTTON");
        var rt = document.createTextNode("Apple TV");
        brtn.appendChild(rt);
        brtn.onclick=function(){
  	        var bgPage = chrome.extension.getBackgroundPage();
  	        bgPage.airplay(url,0);
        };
        document.body.appendChild(brtn);
    }
    btn.onclick=downLoadFile
    document.body.appendChild(btn);

} 
function downLoadFile(){
    var downloaded=false;
    var videoTypes=['.ogg','.mp4','.flv','.mkv','.avi'];
    for(var i=0;i<videoTypes.length;i++){
        if (url.indexOf(videoTypes[i])!=-1){
            var splits=url.split(videoTypes[i]);
            var filename=splits[0].substring(splits[0].lastIndexOf('\/')+1)+videoTypes[i];
            downloaded=true; 
            downloadURI(url,filename);
        };
    };
    if (downloaded==false){
        if (url.indexOf('\?start')!=-1){
            var splits=url.split('\?start');
            var filename=splits[0].substring(splits[0].lastIndexOf('\/')+1)+'.mp4';
            downloadURI(url,filename);
       }; 
    };
};

function downloadURI(uri, name) {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  link.click();
}
